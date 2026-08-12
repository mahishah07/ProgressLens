const request = require("supertest");
const { app } = require("../../../server");

jest.mock("../models/Assessment");
jest.mock("../models/Student");
jest.mock("../services/studentIdentityService");

const Assessment = require("../models/Assessment");
const Student = require("../models/Student");
const { resolveStudent } = require("../services/studentIdentityService");

describe("UT-PMS-21 — POST /api/assessments (createAssessment / Add Assessment page)", () => {
	beforeEach(() => jest.clearAllMocks());

	test("returns 404 when the student cannot be resolved", async () => {
		resolveStudent.mockResolvedValue(null);

		const res = await request(app)
			.post("/api/assessments")
			.send({ student: "unknown", summaryBand: "B4" });

		expect(res.status).toBe(404);
	});

	test("student advances to the next band when the assessment passes, including via a defaulted readingComp", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0001",
			summaryBand: "B4",
			schLevel: "Primary",
		});

		// Everything scored except readingComp — readingComp defaults to
		// passed (see bandScoring.js), so the assessment should still be
		// able to reach the 90% threshold and advance the band, even
		// though Reading Comprehension was never actually tested here.
		const assessmentBody = {
			student: "Student 0001",
			summaryBand: "B4",
			wraScore: 10,
			wordSpellingScore: 9,
			fluencyMark: 18,
			narrativeScore: 15,
			// no rdComprehensionScore
		};

		Assessment.create.mockResolvedValue({ _id: "newA1", ...assessmentBody });
		Student.findByIdAndUpdate.mockResolvedValue({});

		const res = await request(app)
			.post("/api/assessments")
			.send(assessmentBody);

		expect(res.status).toBe(201);
		expect(Assessment.create).toHaveBeenCalledWith(
			expect.objectContaining({ newBand: "B5" }),
		);
		expect(Student.findByIdAndUpdate).toHaveBeenCalledWith(
			"s1",
			expect.objectContaining({ summaryBand: "B5" }),
		);
	});

	test("student stays on the same band when the assessment does not pass", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s2",
			studentId: "Student 0002",
			summaryBand: "B4",
			schLevel: "Primary",
		});

		const assessmentBody = {
			student: "Student 0002",
			summaryBand: "B4",
			wraScore: 2, // fails
		};

		Assessment.create.mockResolvedValue({ _id: "newA2", ...assessmentBody });

		const res = await request(app)
			.post("/api/assessments")
			.send(assessmentBody);

		expect(res.status).toBe(201);
		expect(Assessment.create).toHaveBeenCalledWith(
			expect.objectContaining({ newBand: "B4" }),
		);
		// no promotion, so no Student update should fire
		expect(Student.findByIdAndUpdate).not.toHaveBeenCalled();
	});

	test("C9 (top band) with a passing assessment does not attempt to advance past the last band", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s3",
			studentId: "Student 0003",
			summaryBand: "C9",
			schLevel: "Primary",
		});

		const assessmentBody = {
			student: "Student 0003",
			summaryBand: "C9",
			wraScore: 10,
			wordSpellingScore: 9,
			fluencyMark: 18,
			narrativeScore: 20,
		};

		Assessment.create.mockResolvedValue({ _id: "newA3", ...assessmentBody });

		const res = await request(app)
			.post("/api/assessments")
			.send(assessmentBody);

		expect(res.status).toBe(201);
		expect(Assessment.create).toHaveBeenCalledWith(
			expect.objectContaining({ newBand: "C9" }),
		);
	});
});

describe("UT-PMS-24 — assessment CRUD ID validation", () => {
	beforeEach(() => jest.clearAllMocks());

	test("GET /api/assessments/:id with an invalid ObjectId returns 400", async () => {
		const res = await request(app).get("/api/assessments/not-a-real-id");
		expect(res.status).toBe(400);
	});

	test("PUT /api/assessments/:id with an invalid ObjectId returns 400", async () => {
		const res = await request(app)
			.put("/api/assessments/not-a-real-id")
			.send({ wraScore: 9 });
		expect(res.status).toBe(400);
	});

	test("DELETE /api/assessments/:id with an invalid ObjectId returns 400", async () => {
		const res = await request(app).delete("/api/assessments/not-a-real-id");
		expect(res.status).toBe(400);
	});

	test("DELETE /api/assessments/:id with a valid but nonexistent ObjectId returns 404", async () => {
		const validId = "64b000000000000000000099";
		Assessment.findByIdAndDelete.mockResolvedValue(null);
		const res = await request(app).delete(`/api/assessments/${validId}`);
		expect(res.status).toBe(404);
	});
});

describe("UT-PMS-25 — GET /api/assessments/student/:studentId/progress (View All Assessments)", () => {
	beforeEach(() => jest.clearAllMocks());

	test("returns 404 when the student cannot be resolved", async () => {
		resolveStudent.mockResolvedValue(null);
		const res = await request(app).get(
			"/api/assessments/student/unknown/progress",
		);
		expect(res.status).toBe(404);
	});

	test("returns the assessment list sorted ascending for a known student", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		const sortMock = jest.fn().mockResolvedValue([
			{ _id: "a1", semester: "2023 Sem 1" },
			{ _id: "a2", semester: "2024 Sem 1" },
		]);
		Assessment.find.mockReturnValue({ sort: sortMock });

		const res = await request(app).get(
			"/api/assessments/student/Student 0001/progress",
		);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(2);
		expect(sortMock).toHaveBeenCalled();
	});

	test("returns an empty array (not an error) when the student has no assessments yet", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		Assessment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

		const res = await request(app).get(
			"/api/assessments/student/Student 0001/progress",
		);

		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
	});
});
