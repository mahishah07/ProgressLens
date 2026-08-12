const request = require("supertest");
const { app } = require("../../../server");

jest.mock("../models/Student");
jest.mock("../models/Assessment");
jest.mock("../models/Report");
jest.mock("../services/studentIdentityService");

const Student = require("../models/Student");
const Assessment = require("../models/Assessment");
const Report = require("../models/Report");
const { resolveStudent } = require("../services/studentIdentityService");

describe("UT-PMS-30 — POST /api/students (createStudent / Register New Student)", () => {
	beforeEach(() => jest.clearAllMocks());

	test("creates a student and returns 201 with the created record", async () => {
		const body = {
			studentId: "Student 0010",
			centreId: "Centre A",
			teacherId: "Teacher 001",
			schoolId: "School 001",
			age: 12,
			schLevel: "Primary",
			summaryBand: "A1",
			enrollmentDate: "2025-01-01",
		};
		Student.create.mockResolvedValue({ _id: "newS1", ...body });

		const res = await request(app).post("/api/students").send(body);

		expect(res.status).toBe(201);
		expect(Student.create).toHaveBeenCalledWith(body);
		expect(res.body.studentId).toBe("Student 0010");
	});

	test("returns 400 when Student.create rejects (e.g. missing required field or duplicate studentId)", async () => {
		Student.create.mockRejectedValue(
			new Error("E11000 duplicate key error: studentId"),
		);

		const res = await request(app)
			.post("/api/students")
			.send({ studentId: "Student 0010" });

		expect(res.status).toBe(400);
		expect(res.body.message).toMatch(/duplicate/i);
	});
	test("does not error on the dead 'semester' field the Register New Student form still sends", async () => {
		// Landing.jsx's registration modal collects a "semester" input and
		// sends it in the POST body, but Student.create ultimately decides
		// whether to persist it based on schema strictness — this test
		// just confirms the controller itself doesn't choke on the extra
		// field, since it passes req.body straight through unfiltered.
		const body = {
			semester: "2026 Sem 1",
			studentId: "Student 0011",
			centreId: "Centre A",
			teacherId: "Teacher 001",
			schoolId: "School 001",
			age: 12,
			schLevel: "Primary",
			summaryBand: "A1",
			enrollmentDate: "2025-01-01",
		};
		Student.create.mockResolvedValue({ _id: "newS2", ...body });

		const res = await request(app).post("/api/students").send(body);

		expect(res.status).toBe(201);
		expect(Student.create).toHaveBeenCalledWith(body);
	});
});

describe("UT-PMS-26 — DELETE /api/students/:id (Delete Student button)", () => {
	beforeEach(() => jest.clearAllMocks());

	test("returns 404 when the student cannot be resolved", async () => {
		resolveStudent.mockResolvedValue(null);

		const res = await request(app).delete("/api/students/unknown-id");

		expect(res.status).toBe(404);
		expect(Assessment.deleteMany).not.toHaveBeenCalled();
		expect(Report.deleteMany).not.toHaveBeenCalled();
	});

	test("cascades: deletes assessments and reports before deleting the student", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		Assessment.deleteMany.mockResolvedValue({ deletedCount: 3 });
		Report.deleteMany.mockResolvedValue({ deletedCount: 1 });
		Student.findByIdAndDelete.mockResolvedValue({ _id: "s1" });

		const res = await request(app).delete("/api/students/Student 0001");

		expect(res.status).toBe(200);
		expect(Assessment.deleteMany).toHaveBeenCalledWith({ student: "s1" });
		expect(Report.deleteMany).toHaveBeenCalledWith({ student: "s1" });
		expect(Student.findByIdAndDelete).toHaveBeenCalledWith("s1");
	});

	test("returns 404 if the student disappears between resolution and delete (race condition)", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		Assessment.deleteMany.mockResolvedValue({ deletedCount: 0 });
		Report.deleteMany.mockResolvedValue({ deletedCount: 0 });
		Student.findByIdAndDelete.mockResolvedValue(null);

		const res = await request(app).delete("/api/students/Student 0001");

		expect(res.status).toBe(404);
	});
});

describe("UT-PMS-27 — GET /api/students pagination validation", () => {
	beforeEach(() => jest.clearAllMocks());

	test("rejects page: 0 with 400", async () => {
		const res = await request(app).get("/api/students?page=0");
		expect(res.status).toBe(400);
	});

	test("rejects limit above 100 with 400", async () => {
		const res = await request(app).get("/api/students?limit=101");
		expect(res.status).toBe(400);
	});

	test("rejects a non-integer page with 400", async () => {
		const res = await request(app).get("/api/students?page=abc");
		expect(res.status).toBe(400);
	});

	test("defaults to page 1, limit 50 when not provided", async () => {
		Student.find.mockReturnValue({
			sort: jest.fn().mockReturnValue({
				skip: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue([]),
				}),
			}),
		});
		Student.countDocuments.mockResolvedValue(0);

		const res = await request(app).get("/api/students");

		expect(res.status).toBe(200);
		expect(res.body.page).toBe(1);
		expect(res.body.pages).toBe(0);
	});
});

describe("UT-PMS-28 — PUT /api/students/:id allowed-field filtering", () => {
	beforeEach(() => jest.clearAllMocks());

	test("only persists allow-listed fields, ignoring unknown/protected keys", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		Student.findByIdAndUpdate.mockResolvedValue({
			_id: "s1",
			centreId: "Centre B",
		});

		await request(app)
			.put("/api/students/Student 0001")
			.send({ centreId: "Centre B", _id: "hijack", studentId: "hijack" });

		const updates = Student.findByIdAndUpdate.mock.calls[0][1];
		expect(updates.centreId).toBe("Centre B");
		expect(updates._id).toBeUndefined();
		expect(updates.studentId).toBeUndefined();
	});

	test("returns 404 when the student does not exist", async () => {
		resolveStudent.mockResolvedValue(null);
		const res = await request(app)
			.put("/api/students/unknown")
			.send({ centreId: "Centre B" });
		expect(res.status).toBe(404);
	});
});

describe("UT-PMS-29 — POST /api/students/bulk", () => {
	beforeEach(() => jest.clearAllMocks());

	test("rejects an empty array with 400", async () => {
		const res = await request(app).post("/api/students/bulk").send([]);
		expect(res.status).toBe(400);
	});

	test("rejects a non-array body with 400", async () => {
		const res = await request(app)
			.post("/api/students/bulk")
			.send({ studentId: "Student 0001" });
		expect(res.status).toBe(400);
	});

	test("inserts a valid array of students", async () => {
		Student.insertMany.mockResolvedValue([
			{ _id: "s1", studentId: "Student 0001" },
			{ _id: "s2", studentId: "Student 0002" },
		]);

		const res = await request(app)
			.post("/api/students/bulk")
			.send([{ studentId: "Student 0001" }, { studentId: "Student 0002" }]);

		expect(res.status).toBe(201);
		expect(res.body).toHaveLength(2);
	});
});
