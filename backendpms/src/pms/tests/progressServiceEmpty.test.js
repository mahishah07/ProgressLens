const Student = require("../models/Student");
const Assessment = require("../models/Assessment");

jest.mock("../models/Student");
jest.mock("../models/Assessment");

const progressService = require("../services/progressService");

describe("UT-20 — ProgressService empty state", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("should return assessment_pending when student has no assessments", async () => {
		Student.findById.mockResolvedValue({
			_id: "mockid123",
			studentId: "Student 0001",
			summaryBand: "A1",
			progress: "Same level",
			teacherId: "Teacher 001",
		});

		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([]),
		});

		const result = await progressService.buildDashboard("mockid123");

		expect(result.status).toBe("assessment_pending");
		expect(result.student).toBeDefined();
	});

	test("should return null when student does not exist", async () => {
		Student.findById.mockResolvedValue(null);

		const result = await progressService.buildDashboard("nonexistentid");

		expect(result).toBeNull();
	});
});
