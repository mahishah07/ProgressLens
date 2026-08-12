jest.mock("../models/Assessment");
jest.mock("../models/Report");
jest.mock("../services/studentIdentityService");
jest.mock("../services/aiService", () => ({ generateParentReport: jest.fn() }));

const Assessment = require("../models/Assessment");
const Report = require("../models/Report");
const { resolveStudent } = require("../services/studentIdentityService");
const aiService = require("../services/aiService");
const progressService = require("../services/progressService");
const comparisonService = require("../services/comparisonService");
const reportService = require("../services/reportService");

const student = {
	_id: "64b000000000000000000001",
	studentId: "DAS-0707",
	summaryBand: "B4",
	schLevel: "Primary",
};

const assessment = (id, date, overrides = {}) => ({
	_id: { toString: () => id },
	semester: id,
	assessmentDate: new Date(date),
	summaryBand: "B4",
	newBand: "B4",
	wraScore: 7,
	wordSpellingScore: 7,
	narrativeScore: 9,
	rdComprehensionScore: 6,
	...overrides,
});

describe("PMS white-box branch and path tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		resolveStudent.mockResolvedValue(student);
	});

	test("buildDashboard executes null-score and 0/1/many loop paths", async () => {
		Assessment.find.mockReturnValueOnce({
			sort: jest.fn().mockResolvedValue([]),
		});
		expect((await progressService.buildDashboard("DAS-0707")).status).toBe(
			"assessment_pending",
		);

		const first = assessment("a1", "2026-01-01", {
			wraScore: null,
			wordSpellingScore: null,
			narrativeScore: null,
			rdComprehensionScore: null,
		});
		Assessment.find.mockReturnValueOnce({
			sort: jest.fn().mockResolvedValue([first]),
		});
		const one = await progressService.buildDashboard("DAS-0707");
		expect(one.totalAssessments).toBe(1);
		expect(one.skillBreakdown.strongest).toBeNull();

		const second = assessment("a2", "2026-07-01", {
			newBand: "B5",
			wraScore: 9,
		});
		Assessment.find.mockReturnValueOnce({
			sort: jest.fn().mockResolvedValue([first, second]),
		});
		const many = await progressService.buildDashboard("DAS-0707");
		expect(many.componentTrend).toHaveLength(2);
		expect(many.assessmentHistory.map((item) => item.semester)).toEqual([
			"a2",
			"a1",
		]);
	});

	test.each([
		["B4", "B5", "improved", 1],
		["B5", "B4", "declined", 1],
		["B4", "B4", "same", 0],
	])(
		"compareAssessments branch %s→%s is %s",
		async (from, to, direction, steps) => {
			Assessment.find.mockReturnValue({
				sort: jest
					.fn()
					.mockResolvedValue([
						assessment("a1", "2026-01-01", { newBand: from }),
						assessment("a2", "2026-07-01", { newBand: to }),
					]),
			});
			const result = await comparisonService.compareAssessments("DAS-0707");
			expect(result.bandChange).toEqual({ direction, steps });
		},
	);

	test("compareAssessments rejects an invalid explicit selection path", async () => {
		Assessment.find.mockReturnValue({
			sort: jest
				.fn()
				.mockResolvedValue([
					assessment("a1", "2026-01-01"),
					assessment("a2", "2026-07-01"),
				]),
		});
		const result = await comparisonService.compareAssessments(
			"DAS-0707",
			"a1",
			"missing",
		);
		expect(result).toMatchObject({
			status: "insufficient_data",
			message: "Invalid assessment selection",
		});
	});

	test("generateReport covers unknown, insufficient, and successful persistence paths", async () => {
		resolveStudent.mockResolvedValueOnce(null);
		await expect(reportService.generateReport("UNKNOWN")).resolves.toBeNull();

		Assessment.find.mockReturnValueOnce({
			sort: jest.fn().mockResolvedValue([]),
		});
		expect(await reportService.generateReport("DAS-0707")).toMatchObject({
			status: "insufficient_data",
		});

		Assessment.find.mockReturnValueOnce({
			sort: jest
				.fn()
				.mockResolvedValue([
					assessment("a1", "2026-01-01"),
					assessment("a2", "2026-07-01"),
				]),
		});
		aiService.generateParentReport.mockResolvedValue({
			overallProgress: "Overall",
			literacyGrowth: "Growth",
			teacherObservations: "Observation",
			interventionAreas: "Support",
		});
		Report.create.mockResolvedValue({ _id: "r1" });
		const success = await reportService.generateReport(
			"DAS-0707",
			"teacher-01",
		);
		expect(success.status).toBe("ok");
		expect(Report.create).toHaveBeenCalledWith(
			expect.objectContaining({ generatedBy: "teacher-01", isEdited: false }),
		);
	});

	test("editReport loop copies only four allowed narrative fields", async () => {
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
