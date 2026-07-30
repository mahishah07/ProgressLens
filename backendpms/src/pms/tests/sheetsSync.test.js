const Assessment = require("../models/Assessment");
const Student = require("../models/Student");

jest.mock("../models/Assessment");
jest.mock("../models/Student");
jest.mock("googleapis", () => ({
	google: {
		auth: {
			GoogleAuth: jest.fn().mockImplementation(() => ({})),
		},
		sheets: jest.fn().mockReturnValue({
			spreadsheets: {
				values: {
					get: jest.fn().mockResolvedValue({
						data: {
							values: [
								[
									"Semester",
									"Student_ID",
									"Teacher_ID",
									"Centre_ID",
									"School_ID",
									"Age",
									"SchLevel",
									"SummaryBand",
									"NewBand",
								],
								[
									"2024 Sem 1",
									"Student 0001",
									"Teacher 001",
									"Centre A",
									"School 001",
									"12",
									"Primary",
									"B4",
									"B5",
								],
							],
						},
					}),
				},
			},
		}),
	},
}));

const sheetsSync = require("../services/sheetsSync");

describe("UT-23 — GoogleSheetsSync idempotence", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("should skip duplicate assessment for same student and semester", async () => {
		Student.findOne.mockResolvedValue({
			_id: "mockStudentId",
			studentId: "Student 0001",
			summaryBand: "B4",
		});

		Assessment.findOne.mockResolvedValue({
			_id: "existingAssessmentId",
			student: "mockStudentId",
			semester: "2024 Sem 1",
		});

		Assessment.create = jest.fn();

		const result = await sheetsSync.syncFromSheets();

		expect(Assessment.create).not.toHaveBeenCalled();
		expect(result.skipped).toBe(1);
		expect(result.created).toBe(0);
	});

	test("should create new assessment when no duplicate exists", async () => {
		Student.findOne.mockResolvedValue({
			_id: "mockStudentId",
			studentId: "Student 0001",
			summaryBand: "B4",
		});

		Assessment.findOne.mockResolvedValue(null);
		Assessment.create = jest.fn().mockResolvedValue({ _id: "newAssessmentId" });
		Student.findByIdAndUpdate = jest.fn();

		const result = await sheetsSync.syncFromSheets();

		expect(Assessment.create).toHaveBeenCalledTimes(1);
		expect(result.created).toBe(1);
		expect(result.skipped).toBe(0);
	});
});
