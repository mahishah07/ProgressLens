const request = require("supertest");
const { app } = require("../../../server"); // adjust if server.js exports app differently

jest.mock("../models/Student");
jest.mock("../models/Assessment");
jest.mock("../services/studentIdentityService");

const { resolveStudent } = require("../services/studentIdentityService");
const Assessment = require("../models/Assessment");

describe("PMS-009 / PMS-010 — GET /api/progress/:id/dashboard route", () => {
	beforeEach(() => jest.clearAllMocks());

	test("returns assessment_pending with 200 when student has no assessments", async () => {
		resolveStudent.mockResolvedValue({
			_id: "mockid123",
			studentId: "Student 0001",
			summaryBand: "A1",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

		const res = await request(app).get("/api/progress/mockid123/dashboard");

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("assessment_pending");
	});

	test("returns 404 when student cannot be resolved", async () => {
		resolveStudent.mockResolvedValue(null);

		const res = await request(app).get("/api/progress/unknown-id/dashboard");

		expect(res.status).toBe(404);
		expect(res.body.message).toMatch(/not found/i);
	});

	test("returns full dashboard payload including bandScore and componentTrend", async () => {
		resolveStudent.mockResolvedValue({
			_id: "mockid123",
			studentId: "Student 0001",
			summaryBand: "A3",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([
				{
					_id: "a1",
					semester: "2024 Sem 1",
					assessmentDate: new Date(),
					summaryBand: "A3",
					newBand: "A3",
					wraScore: 8,
					wordSpellingScore: 8,
				},
			]),
		});

		const res = await request(app).get("/api/progress/mockid123/dashboard");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("bandScore");
		expect(res.body).toHaveProperty("componentTrend");
		expect(res.body).toHaveProperty("assessmentHistory");
	});
});

describe("PMS-014 — GET /api/progress/search route", () => {
	test("applies AND semantics across multiple filters", async () => {
		const Student = require("../models/Student");
		Student.find.mockResolvedValue([
			{ studentId: "Student 0001", centreId: "Centre A", summaryBand: "B4" },
		]);

		const res = await request(app).get(
			"/api/progress/search?centreId=Centre%20A&summaryBand=B4",
		);

		expect(res.status).toBe(200);
		expect(Student.find).toHaveBeenCalledWith(
			expect.objectContaining({ centreId: "Centre A", summaryBand: "B4" }),
		);
	});

	test("does not crash on special regex characters in studentId filter", async () => {
		const Student = require("../models/Student");
		Student.find.mockResolvedValue([]);

		const res = await request(app).get(
			"/api/progress/search?studentId=" + encodeURIComponent("Student(.*)"),
		);

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
	});
});
