const Assessment = require("../models/Assessment");
const Student = require("../models/Student");

jest.mock("../models/Assessment");
jest.mock("../models/Student");
jest.mock("googleapis", () => ({
	google: {
		auth: {
			GoogleAuth: jest.fn().mockImplementation(() => ({})),
		},
		sheets: jest.fn(),
	},
}));

const { google } = require("googleapis");
const sheetsSync = require("../services/sheetsSync");

const HEADER_ROW = [
	"Semester",
	"Centre_ID",
	"Teacher_ID",
	"Student_ID",
	"School_ID",
	"Age",
	"SchLevel",
	"EnrollmentDate",
	"SummaryBand",
	"Progress",
	"NewBand",
	"Picture_Naming",
	"PN_Date",
	"PN_Progress",
	"Word_Reading_Accuracy",
	"WRA_Date",
	"WRA_Progress",
];

function mockSheetResponse(dataRows) {
	google.sheets.mockReturnValue({
		spreadsheets: {
			values: {
				get: jest.fn().mockResolvedValue({
					data: { values: [HEADER_ROW, ...dataRows] },
				}),
			},
		},
	});
}

describe("UT-PMS-11 — syncFromSheets row mapping", () => {
	beforeEach(() => jest.clearAllMocks());

	test("valid new row with known studentId creates a new assessment", async () => {
		mockSheetResponse([
			[
				"2024 Sem 1",
				"Centre A",
				"Teacher 001",
				"Student 0001",
				"School 001",
				"12",
				"Primary",
				"1/1/20",
				"A3",
				"TRUE",
				"B4",
				"10",
				"1/1/24",
				"TRUE",
				"8",
				"1/1/24",
				"TRUE",
			],
		]);

		Student.findOne.mockResolvedValue({
			_id: "mockStudentId",
			studentId: "Student 0001",
			summaryBand: "A3",
		});
		Assessment.findOne.mockResolvedValue(null); // no duplicate
		Assessment.create = jest.fn().mockResolvedValue({ _id: "newAssessmentId" });
		Student.findByIdAndUpdate = jest.fn();

		const result = await sheetsSync.syncFromSheets();

		expect(Assessment.create).toHaveBeenCalledTimes(1);
		expect(result.created).toBe(1);
		expect(result.skipped).toBe(0);
	});

	test("duplicate row (same student + semester) is skipped, not re-created", async () => {
		mockSheetResponse([
			[
				"2024 Sem 1",
				"Centre A",
				"Teacher 001",
				"Student 0002",
				"School 001",
				"12",
				"Primary",
				"1/1/20",
				"B4",
				"FALSE",
				"B4",
				"",
				"",
				"",
				"9",
				"1/1/24",
				"TRUE",
			],
		]);

		Student.findOne.mockResolvedValue({
			_id: "mockStudentId2",
			studentId: "Student 0002",
			summaryBand: "B4",
		});
		Assessment.findOne.mockResolvedValue({ _id: "existingAssessmentId" }); // duplicate found
		Assessment.create = jest.fn();

		const result = await sheetsSync.syncFromSheets();

		expect(Assessment.create).not.toHaveBeenCalled();
		expect(result.skipped).toBe(1);
		expect(result.created).toBe(0);
	});

	test("row with unknown studentId is skipped and logged as an error, not thrown", async () => {
		mockSheetResponse([
			[
				"2024 Sem 1",
				"Centre A",
				"Teacher 001",
				"Student 9999",
				"School 001",
				"12",
				"Primary",
				"1/1/20",
				"A1",
				"FALSE",
				"A1",
				"",
				"",
				"",
				"",
				"",
				"",
			],
		]);

		Student.findOne.mockResolvedValue(null); // student not found
		Assessment.create = jest.fn();

		const result = await sheetsSync.syncFromSheets();

		expect(Assessment.create).not.toHaveBeenCalled();
		expect(result.skipped).toBe(1);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toMatch(/not found/i);
	});

	test("row missing Student_ID or Semester is skipped without error", async () => {
		mockSheetResponse([
			[
				"2024 Sem 1",
				"Centre A",
				"Teacher 001",
				"",
				"School 001",
				"12",
				"Primary",
				"1/1/20",
				"A1",
				"FALSE",
				"A1",
				"",
				"",
				"",
				"",
				"",
				"",
			],
		]);

		Assessment.create = jest.fn();
		const result = await sheetsSync.syncFromSheets();

		expect(Assessment.create).not.toHaveBeenCalled();
		expect(result.skipped).toBe(1);
	});

	test("student summaryBand updates only when new band is higher in BAND_ORDER", async () => {
		mockSheetResponse([
			[
				"2024 Sem 1",
				"Centre A",
				"Teacher 001",
				"Student 0003",
				"School 001",
				"12",
				"Primary",
				"1/1/20",
				"A3",
				"TRUE",
				"B4",
				"",
				"",
				"",
				"",
				"",
				"",
			],
		]);

		Student.findOne.mockResolvedValue({
			_id: "mockStudentId3",
			studentId: "Student 0003",
			summaryBand: "A3",
		});
		Assessment.findOne.mockResolvedValue(null);
		Assessment.create = jest.fn().mockResolvedValue({ _id: "newId" });
		Student.findByIdAndUpdate = jest.fn();

		await sheetsSync.syncFromSheets();

		expect(Student.findByIdAndUpdate).toHaveBeenCalledWith(
			"mockStudentId3",
			expect.objectContaining({ summaryBand: "B4" }),
		);
	});

	test("Google Sheets API failure throws a descriptive error, no partial writes", async () => {
		google.sheets.mockReturnValue({
			spreadsheets: {
				values: {
					get: jest.fn().mockRejectedValue(new Error("network unreachable")),
				},
			},
		});
		Assessment.create = jest.fn();

		await expect(sheetsSync.syncFromSheets()).rejects.toThrow(/unreachable/i);
		expect(Assessment.create).not.toHaveBeenCalled();
	});
});
