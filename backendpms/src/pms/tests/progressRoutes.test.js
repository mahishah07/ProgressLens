const request = require("supertest");
const { app } = require("../../../server");

jest.mock("../models/Student");
jest.mock("../models/Assessment");
jest.mock("../services/studentIdentityService");

const Student = require("../models/Student");
const Assessment = require("../models/Assessment");
const { resolveStudent } = require("../services/studentIdentityService");

describe("PMS-009 / PMS-010 — GET /api/progress/:id/dashboard route", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("returns assessment_pending with 200 when student has no assessments", async () => {
		resolveStudent.mockResolvedValue({
			_id: "mockid123",
			studentId: "Student 0001",
			summaryBand: "A1",
			schLevel: "Primary",
		});

		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([]),
		});

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
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("applies AND semantics across multiple filters", async () => {
		Student.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([
				{
					studentId: "Student 0001",
					centreId: "Centre A",
					summaryBand: "B4",
				},
			]),
		});

		const res = await request(app).get(
			"/api/progress/search?centreId=Centre%20A&summaryBand=B4",
		);

		expect(res.status).toBe(200);

		expect(Student.find).toHaveBeenCalledWith(
			expect.objectContaining({
				centreId: "Centre A",
				summaryBand: "B4",
			}),
		);
	});

	test("does not crash on special regex characters in studentId filter", async () => {
		Student.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([]),
		});

		const res = await request(app).get(
			"/api/progress/search?studentId=" + encodeURIComponent("Student(.*)"),
		);

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
	});
});

describe("PMS-016 — GET /api/progress/:studentId/overview route", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("returns 404 when the student cannot be resolved", async () => {
		resolveStudent.mockResolvedValue(null);

		const res = await request(app).get("/api/progress/unknown-id/overview");

		expect(res.status).toBe(404);
		expect(res.body.message).toMatch(/not found/i);
	});

	test("returns the overview payload for a known student", async () => {
		resolveStudent.mockResolvedValue({
			_id: "mockid123",
			studentId: "Student 0001",
			centreId: "Centre A",
			teacherId: "Teacher 0001",
			schLevel: "Primary",
			summaryBand: "B4",
			progress: "improving",
		});

		Assessment.findOne.mockReturnValue({
			sort: jest.fn().mockResolvedValue({
				_id: "assessment123",
				semester: "2026 Sem 1",
				assessmentDate: new Date("2026-06-01"),
				newBand: "B4",
				summaryBand: "B4",
				assessedBy: "Teacher 0001",
			}),
		});

		const res = await request(app).get(
			"/api/progress/" + encodeURIComponent("Student 0001") + "/overview",
		);

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("student");
		expect(res.body.student.studentId).toBe("Student 0001");
		expect(res.body.currentBandLevel).toBe("B4");
		expect(res.body.latestNewBand).toBe("B4");
		expect(res.body.lastSemester).toBe("2026 Sem 1");
		expect(res.body.hasAssessments).toBe(true);
	});

	test("returns 500 when resolving the student throws an internal error", async () => {
		resolveStudent.mockRejectedValue(
			new Error("internal db connection string leaked"),
		);

		const res = await request(app).get(
			"/api/progress/" + encodeURIComponent("Student 0001") + "/overview",
		);

		expect(res.status).toBe(500);

		// The controller currently sends err.message directly.
		expect(res.body.message).toBe("internal db connection string leaked");
	});
});
