const request = require("supertest");

jest.mock("../services/aiService", () => ({
	generateParentReport: jest.fn(),
	generateRecommendations: jest.fn(),
}));

const { createApp } = require("../../../server");
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

describe("PMS black-box specification tests", () => {
	beforeAll(connectTestDatabase);
	afterEach(clearTestDatabase);
	afterAll(stopTestDatabase);

	test.each([
		[{}, 400],
		[studentPayload("DAS-A1", { summaryBand: "A1" }), 201],
		[studentPayload("DAS-C9", { summaryBand: "C9" }), 201],
		[studentPayload("DAS-A0", { summaryBand: "A0" }), 400],
		[studentPayload("DAS-C10", { summaryBand: "C10" }), 400],
		[studentPayload("DAS-LEVEL", { schLevel: "Tertiary" }), 400],
	])(
		"black-box boundary partition %# returns %s",
		async (payload, expected) => {
			const response = await request(app).post("/api/students").send(payload);
			expect(response.status).toBe(expected);
		},
	);

	test("black-box dashboard partitions: missing student, no data, and populated data", async () => {
		const missing = await request(app).get("/api/progress/UNKNOWN/dashboard");
		expect(missing.status).toBe(404);
		const student = await Student.create(studentPayload("DAS-0707"));
		const empty = await request(app).get("/api/progress/DAS-0707/dashboard");
		expect(empty.status).toBe(200);
		expect(empty.body.status).toBe("assessment_pending");
		await Assessment.create(
			assessmentPayload(student._id, "2026 Sem 1", "2026-01-15"),
		);
		const populated = await request(app).get(
			"/api/progress/DAS-0707/dashboard",
		);
		expect(populated.status).toBe(200);
		expect(populated.body).toMatchObject({ status: "ok", totalAssessments: 1 });
	});

	test("black-box comparison partitions: zero, one, and two assessments", async () => {
		const student = await Student.create(studentPayload("DAS-0707"));
		const zero = await request(app).get("/api/comparison/DAS-0707");
		expect(zero.body.status).toBe("insufficient_data");
		await Assessment.create(
			assessmentPayload(student._id, "2026 Sem 1", "2026-01-15"),
		);
		const one = await request(app).get("/api/comparison/DAS-0707");
		expect(one.body.status).toBe("insufficient_data");
		await Assessment.create(
			assessmentPayload(student._id, "2026 Sem 2", "2026-07-15", {
				newBand: "B5",
			}),
		);
		const two = await request(app).get("/api/comparison/DAS-0707");
		expect(two.body.status).toBe("ok");
		expect(two.body.totalAssessments).toBe(2);
	});

	test("black-box unsupported route and method return stable 404 JSON", async () => {
		const [route, method] = await Promise.all([
			request(app).get("/api/pms-does-not-exist"),
			request(app).patch("/api/students/DAS-0707").send({}),
		]);
		for (const response of [route, method]) {
			expect(response.status).toBe(404);
			expect(response.body.message).toMatch(/route not found/i);
		}
	});

	test("black-box: readingComp with no score defaults to passed through the full real pipeline (no mocks)", async () => {
		const student = await Student.create(studentPayload("DAS-RC01"));
		await Assessment.create(
			assessmentPayload(student._id, "2026 Sem 1", "2026-01-15", {
				rdComprehensionScore: undefined,
			}),
		);

		const res = await request(app).get("/api/progress/DAS-RC01/dashboard");

		expect(res.status).toBe(200);
		const readingComp = res.body.bandScore.componentResults.find(
			(c) => c.name === "readingComp",
		);
		expect(readingComp.passed).toBe(true);
		expect(readingComp.skipped).toBe(false);
		expect(readingComp.score).toBeNull();
	});

	test("black-box: readingComp with a real low score still fails through the full real pipeline", async () => {
		const student = await Student.create(studentPayload("DAS-RC02"));
		await Assessment.create(
			assessmentPayload(student._id, "2026 Sem 1", "2026-01-15", {
				rdComprehensionScore: 1,
			}),
		);

		const res = await request(app).get("/api/progress/DAS-RC02/dashboard");

		expect(res.status).toBe(200);
		const readingComp = res.body.bandScore.componentResults.find(
			(c) => c.name === "readingComp",
		);
		expect(readingComp.passed).toBe(false);
		expect(readingComp.score).toBe(1);
	});
});
