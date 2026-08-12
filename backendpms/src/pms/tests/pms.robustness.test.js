const request = require("supertest");

jest.mock("../services/aiService", () => ({
	generateParentReport: jest.fn(),
	generateRecommendations: jest.fn(),
}));

const { createApp } = require("../../../server");
const aiService = require("../services/aiService");
const {
	connectTestDatabase,
	clearTestDatabase,
	stopTestDatabase,
	studentPayload,
	assessmentPayload,
	Student,
	Assessment,
} = require("./pmsTestHarness");

const app = createApp({
	env: { NODE_ENV: "test", CORS_ORIGINS: "http://localhost:5173" },
});

describe("PMS robustness and negative tests", () => {
	beforeAll(connectTestDatabase);
	afterEach(async () => {
		jest.clearAllMocks();
		await clearTestDatabase();
	});
	afterAll(stopTestDatabase);

	test.each(["not-an-object-id", "!", "a".repeat(500)])(
		"NEG-005: malformed assessment ID %p returns controlled 4xx",
		async (id) => {
			for (const method of ["get", "put", "delete"]) {
				const response = await request(app)
					[method](`/api/assessments/${id}`)
					.send({ newBand: "B5" });
				expect(response.status).toBeGreaterThanOrEqual(400);
				expect(response.status).toBeLessThan(500);
				expect(JSON.stringify(response.body)).not.toMatch(
					/CastError|stack|node_modules/i,
				);
			}
		},
	);

	test.each([".*", "(a+)+", "[", "DAS-0707\\", "ＤＡＳ"])(
		"NEG-006: search metacharacters %p are treated literally and do not dump all students",
		async (query) => {
			await Student.create([
				studentPayload("DAS-0707"),
				studentPayload("XYZ-1000"),
			]);
			const response = await request(app).get(
				`/api/progress/search?studentId=${encodeURIComponent(query)}`,
			);
			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
		},
	);

	test("NEG-004/008: wrong JSON primitive and operator-shaped student ID do not create records", async () => {
		const primitive = await request(app)
			.post("/api/students")
			.set("Content-Type", "application/json")
			.send("not-an-object");
		expect(primitive.status).toBeGreaterThanOrEqual(400);

		const injection = await request(app)
			.post("/api/students")
			.send({
				studentId: { $ne: null },
				schLevel: "Primary",
				summaryBand: "B4",
			});
		expect(injection.status).toBe(400);
		expect(await Student.countDocuments()).toBe(0);
		expect({}.polluted).toBeUndefined();
	});

	test("PMS-005: update ignores immutable identity and unknown fields", async () => {
		const student = await Student.create(studentPayload("DAS-0707"));
		const response = await request(app)
			.put(`/api/students/${student._id}`)
			.send({
				studentId: "HIJACKED",
				_id: "000000000000000000000000",
				unexpected: "value",
				summaryBand: "B5",
			});
		expect(response.status).toBe(200);
		expect(response.body.studentId).toBe("DAS-0707");
		expect(response.body.summaryBand).toBe("B5");
		expect(response.body.unexpected).toBeUndefined();
	});

	test("NEG-012: AI failure is controlled and does not partially update the latest assessment", async () => {
		const student = await Student.create(studentPayload("DAS-0707"));
		await Assessment.create([
			assessmentPayload(student._id, "2026 Sem 1", "2026-01-15"),
			assessmentPayload(student._id, "2026 Sem 2", "2026-07-15"),
		]);
		aiService.generateRecommendations.mockRejectedValue(
			new Error("429 secret-provider-detail"),
		);
		const response = await request(app).post(
			"/api/ai/DAS-0707/recommendations",
		);
		expect(response.status).toBe(500);
		expect(response.body).toEqual({
			message: "Unable to generate recommendations",
		});
		const latest = await Assessment.findOne({ student: student._id }).sort({
			assessmentDate: -1,
		});
		expect(latest.aiInsights).toBeFalsy();
	});

	test("robust state preservation: invalid assessment update leaves stored record unchanged", async () => {
		const student = await Student.create(studentPayload("DAS-0707"));
		const assessment = await Assessment.create(
			assessmentPayload(student._id, "2026 Sem 1", "2026-01-15", {
				newBand: "B4",
			}),
		);
		const response = await request(app)
			.put(`/api/assessments/${assessment._id}`)
			.send({ student: "UNKNOWN", newBand: "C9" });
		expect(response.status).toBe(404);
		const unchanged = await Assessment.findById(assessment._id);
		expect(unchanged.newBand).toBe("B4");
		expect(unchanged.student.toString()).toBe(student._id.toString());
	});

	test.each(["0", "-1", "1.5", "abc"])(
		"PMS-003: invalid page %p is rejected",
		async (page) => {
			const response = await request(app).get(
				`/api/students?page=${page}&limit=20`,
			);
			expect(response.status).toBe(400);
		},
	);

	test.each(["0", "101", "1.5", "abc"])(
		"PMS-003: invalid limit %p is rejected",
		async (limit) => {
			const response = await request(app).get(
				`/api/students?page=1&limit=${limit}`,
			);
			expect(response.status).toBe(400);
		},
	);

	test.each([
		["wraScore", -1],
		["phonicsScore", -0.01],
		["monthsTo48", -1],
		["rdComprehensionScore", -1],
	])("PMS-008: %s rejects negative value %p", async (field, value) => {
		const student = await Student.create(studentPayload("DAS-SCORES"));
		const response = await request(app)
			.post("/api/assessments")
			.send(
				assessmentPayload(student.studentId, "2026 Sem 1", "2026-01-15", {
					[field]: value,
				}),
			);
		expect(response.status).toBe(400);
		expect(await Assessment.countDocuments()).toBe(0);
	});
});
