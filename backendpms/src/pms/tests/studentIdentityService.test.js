const mongoose = require("mongoose");
const Student = require("../models/Student");
const { resolveStudent } = require("../services/studentIdentityService");

jest.mock("../models/Student");

describe("UT-PMS-02 — resolveStudent identifier resolution", () => {
	beforeEach(() => jest.clearAllMocks());

	test("resolves by studentId string first", async () => {
		Student.findOne.mockResolvedValue({
			_id: "mockid",
			studentId: "Student 0001",
		});
		const result = await resolveStudent("Student 0001");
		expect(Student.findOne).toHaveBeenCalledWith({ studentId: "Student 0001" });
		expect(result.studentId).toBe("Student 0001");
	});

	test("falls back to ObjectId lookup when not found by studentId", async () => {
		Student.findOne.mockResolvedValue(null);
		Student.findById.mockResolvedValue({ _id: "6a72f0d56130c6aed484de61" });
		const validId = "6a72f0d56130c6aed484de61";
		const result = await resolveStudent(validId);
		expect(Student.findById).toHaveBeenCalledWith(validId);
		expect(result._id).toBe(validId);
	});

	test("returns null for completely unknown identifier", async () => {
		Student.findOne.mockResolvedValue(null);
		const result = await resolveStudent("not-a-real-id");
		expect(result).toBeNull();
	});

	test("returns null for empty identifier", async () => {
		const result = await resolveStudent("");
		expect(result).toBeNull();
	});

	test("returns null for whitespace-only identifier", async () => {
		const result = await resolveStudent("   ");
		expect(result).toBeNull();
	});
});
