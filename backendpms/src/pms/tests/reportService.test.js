const Report = require("../models/Report");

jest.mock("../models/Report");
jest.mock("../services/studentIdentityService");
jest.mock("../services/progressService");
jest.mock("../services/aiService", () => ({
	generateParentReport: jest.fn(),
	generateDashboardSummary: jest.fn(),
	generateRecommendations: jest.fn(),
}));

const { resolveStudent } = require("../services/studentIdentityService");
const progressService = require("../services/progressService");
const aiService = require("../services/aiService");
const reportService = require("../services/reportService");

const okDashboard = {
	status: "ok",
	totalAssessments: 2,
	currentBandLevel: "B4",
	latestAssessment: { newBand: "B4" },
	bandScore: {
		totalScore: 88,
		passed: false,
		componentResults: [
			{ name: "wra", score: 9, passMark: 8, passed: true, skipped: false },
			{
				name: "readingComp",
				score: null,
				passMark: null,
				passed: true,
				skipped: false,
			}, // defaulted — no real score
			{
				name: "narrative",
				score: 5,
				passMark: 10,
				passed: false,
				skipped: false,
			},
		],
	},
	skillBreakdown: { strongest: "wra", weakest: "narrative" },
	progressOverTime: [],
};

describe("UT-PMS-17 — generateReport", () => {
	beforeEach(() => jest.clearAllMocks());

	test("returns null for unknown student", async () => {
		resolveStudent.mockResolvedValue(null);
		const result = await reportService.generateReport("unknown");
		expect(result).toBeNull();
	});

	test("returns insufficient_data when dashboard has no assessments", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		progressService.buildDashboard.mockResolvedValue({
			status: "assessment_pending",
		});
		const result = await reportService.generateReport("Student 0001");
		expect(result.status).toBe("insufficient_data");
	});

	test("successful AI generation creates a Report with isEdited: false", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		progressService.buildDashboard.mockResolvedValue(okDashboard);
		aiService.generateParentReport.mockResolvedValue({
			overallProgress: "Doing well",
			literacyGrowth: "Growing",
			teacherObservations: "Attentive",
			interventionAreas: "Keep practicing",
		});
		Report.create.mockResolvedValue({ _id: "r1" });

		const result = await reportService.generateReport(
			"Student 0001",
			"teacher-01",
		);

		expect(result.status).toBe("ok");
		expect(Report.create).toHaveBeenCalledWith(
			expect.objectContaining({
				generatedBy: "teacher-01",
				isEdited: false,
				overallProgress: "Doing well",
			}),
		);
	});

	test("AI failure falls back to rule-based narrative instead of throwing", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		progressService.buildDashboard.mockResolvedValue(okDashboard);
		aiService.generateParentReport.mockRejectedValue(new Error("AI down"));
		Report.create.mockResolvedValue({ _id: "r1" });

		const result = await reportService.generateReport("Student 0001");

		expect(result.status).toBe("ok");
		const createArgs = Report.create.mock.calls[0][0];
		expect(createArgs.overallProgress).toMatch(/your child/i);
	});

	test("does not throw when a componentResult has a defaulted null score (readingComp)", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		progressService.buildDashboard.mockResolvedValue(okDashboard);
		aiService.generateParentReport.mockResolvedValue({
			overallProgress: "Doing well",
			literacyGrowth: "Growing",
			teacherObservations: "",
			interventionAreas: "Keep practicing",
		});
		Report.create.mockResolvedValue({ _id: "r1" });

		await expect(
			reportService.generateReport("Student 0001"),
		).resolves.toMatchObject({ status: "ok" });
	});
});

describe("UT-PMS-18 — getLatestReport", () => {
	beforeEach(() => jest.clearAllMocks());

	test("returns null for unknown student", async () => {
		resolveStudent.mockResolvedValue(null);
		const result = await reportService.getLatestReport("unknown");
		expect(result).toBeNull();
	});

	test("returns null when student has no reports", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1" });
		Report.findOne.mockReturnValue({
			sort: jest.fn().mockReturnValue({
				populate: jest.fn().mockResolvedValue(null),
			}),
		});
		const result = await reportService.getLatestReport("Student 0001");
		expect(result).toBeNull();
	});

	test("returns the most recent report when one exists", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1" });
		Report.findOne.mockReturnValue({
			sort: jest.fn().mockReturnValue({
				populate: jest
					.fn()
					.mockResolvedValue({ _id: "r1", overallProgress: "x" }),
			}),
		});
		const result = await reportService.getLatestReport("Student 0001");
		expect(result._id).toBe("r1");
	});
});

describe("UT-PMS-19 — editReport allowed-field filtering", () => {
	beforeEach(() => jest.clearAllMocks());

	test("only copies the four allowed narrative fields, ignoring student/generatedBy/isEdited overrides", async () => {
		Report.findOneAndUpdate.mockResolvedValue({ _id: "r1", isEdited: true });
		await reportService.editReport("r1", {
			overallProgress: "Changed",
			student: "hijack",
			generatedBy: "hijack",
			isEdited: false,
		});
		const updates = Report.findOneAndUpdate.mock.calls[0][1].$set;
		expect(updates.overallProgress).toBe("Changed");
		expect(updates.student).toBeUndefined();
		expect(updates.generatedBy).toBeUndefined();
		expect(updates.isEdited).toBe(true);
	});
});

describe("UT-PMS-20 — editReport optimistic concurrency and validation", () => {
	beforeEach(() => jest.clearAllMocks());

	test("rejects a non-integer expectedVersion with statusCode 400", async () => {
		await expect(
			reportService.editReport("r1", {
				overallProgress: "x",
				expectedVersion: 1.5,
			}),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	test("rejects a negative expectedVersion with statusCode 400", async () => {
		await expect(
			reportService.editReport("r1", {
				overallProgress: "x",
				expectedVersion: -1,
			}),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	test("throws statusCode 409 when the version has moved on (concurrent edit)", async () => {
		Report.findOneAndUpdate.mockResolvedValue(null);
		Report.exists.mockResolvedValue(true);

		await expect(
			reportService.editReport("r1", {
				overallProgress: "x",
				expectedVersion: 2,
			}),
		).rejects.toMatchObject({ statusCode: 409 });
	});

	test("returns null (not an error) when the report genuinely does not exist", async () => {
		Report.findOneAndUpdate.mockResolvedValue(null);
		Report.exists.mockResolvedValue(false);

		const result = await reportService.editReport("nonexistent", {
			overallProgress: "x",
			expectedVersion: 2,
		});
		expect(result).toBeNull();
	});

	test("succeeds and increments version when expectedVersion matches", async () => {
		Report.findOneAndUpdate.mockResolvedValue({
			_id: "r1",
			overallProgress: "x",
			__v: 3,
		});

		const result = await reportService.editReport("r1", {
			overallProgress: "x",
			expectedVersion: 2,
		});

		expect(result.__v).toBe(3);
		const filterArg = Report.findOneAndUpdate.mock.calls[0][0];
		expect(filterArg.__v).toBe(2);
	});
});
