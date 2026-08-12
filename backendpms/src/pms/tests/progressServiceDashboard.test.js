const Assessment = require("../models/Assessment");
const Student = require("../models/Student");

jest.mock("../models/Assessment");
jest.mock("../models/Student");
jest.mock("../services/studentIdentityService");

const { resolveStudent } = require("../services/studentIdentityService");
const progressService = require("../services/progressService");

describe("UT-PMS-07 — buildDashboard equivalence classes", () => {
	beforeEach(() => jest.clearAllMocks());

	test("no assessments returns assessment_pending status", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		Assessment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
		const result = await progressService.buildDashboard("Student 0001");
		expect(result.status).toBe("assessment_pending");
	});

	test("single assessment returns componentTrend with one entry", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
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
				},
			]),
		});
		const result = await progressService.buildDashboard("Student 0001");
		expect(result.status).toBe("ok");
		expect(result.componentTrend).toHaveLength(1);
	});

	test("unknown student returns null", async () => {
		resolveStudent.mockResolvedValue(null);
		const result = await progressService.buildDashboard("nonexistent");
		expect(result).toBeNull();
	});
});

describe("UT-PMS-13 — buildDashboard with multiple assessments", () => {
	beforeEach(() => jest.clearAllMocks());

	const twoAssessments = [
		{
			_id: "a1",
			semester: "2023 Sem 1",
			assessmentDate: new Date("2023-01-01"),
			summaryBand: "B4",
			newBand: "B4",
			wraScore: 6,
			wordSpellingScore: 8,
		},
		{
			_id: "a2",
			semester: "2024 Sem 1",
			assessmentDate: new Date("2024-01-01"),
			summaryBand: "B4",
			newBand: "B5",
			wraScore: 9,
			wordSpellingScore: 9,
		},
	];

	test("componentTrend and progressOverTime have one entry per assessment", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0002",
			summaryBand: "B4",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue(twoAssessments),
		});

		const result = await progressService.buildDashboard("Student 0002");

		expect(result.componentTrend).toHaveLength(2);
		expect(result.progressOverTime).toHaveLength(2);
	});

	test("assessmentHistory is returned newest-first", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0002",
			summaryBand: "B4",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue(twoAssessments),
		});

		const result = await progressService.buildDashboard("Student 0002");

		expect(result.assessmentHistory[0].semester).toBe("2024 Sem 1");
		expect(result.assessmentHistory[1].semester).toBe("2023 Sem 1");
	});

	test("bandProgression only includes assessments with a newBand set", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0002",
			summaryBand: "B4",
			schLevel: "Primary",
		});
		const withOneMissingBand = [
			twoAssessments[0],
			{ ...twoAssessments[1], newBand: undefined },
		];
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue(withOneMissingBand),
		});

		const result = await progressService.buildDashboard("Student 0002");

		expect(result.bandProgression).toHaveLength(1);
		expect(result.bandProgression[0].semester).toBe("2023 Sem 1");
	});
});

describe("UT-PMS-14 — componentTrend reflects readingComp default-pass behaviour", () => {
	beforeEach(() => jest.clearAllMocks());

	test("readingComp with no score still shows result: 1 (passed), not null (skipped)", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0003",
			summaryBand: "B4",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([
				{
					_id: "a1",
					semester: "2024 Sem 1",
					assessmentDate: new Date(),
					summaryBand: "B4",
					newBand: "B4",
					wraScore: 8,
					wordSpellingScore: 8,
					// no rdComprehensionScore
				},
			]),
		});

		const result = await progressService.buildDashboard("Student 0003");
		const readingComp = result.componentTrend[0].components.find(
			(c) => c.name === "readingComp",
		);

		expect(readingComp.result).toBe(1);
		expect(readingComp.score).toBeNull();
	});

	test("a genuinely scored, failing readingComp still shows result: 0", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0004",
			summaryBand: "B4",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([
				{
					_id: "a1",
					semester: "2024 Sem 1",
					assessmentDate: new Date(),
					summaryBand: "B4",
					newBand: "B4",
					rdComprehensionScore: 2, // below passMark 7
				},
			]),
		});

		const result = await progressService.buildDashboard("Student 0004");
		const readingComp = result.componentTrend[0].components.find(
			(c) => c.name === "readingComp",
		);

		expect(readingComp.result).toBe(0);
		expect(readingComp.score).toBe(2);
	});
});

describe("UT-PMS-15 — skillBreakdown excludes writtenVocab and null-score components", () => {
	beforeEach(() => jest.clearAllMocks());

	test("defaulted readingComp (null score) is not eligible for strongest/weakest", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0005",
			summaryBand: "B4",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([
				{
					_id: "a1",
					semester: "2024 Sem 1",
					assessmentDate: new Date(),
					summaryBand: "B4",
					newBand: "B4",
					wraScore: 10,
					wordSpellingScore: 8,
					// no rdComprehensionScore — defaults to passed, score null
				},
			]),
		});

		const result = await progressService.buildDashboard("Student 0005");

		expect(result.skillBreakdown.breakdown).not.toHaveProperty("readingComp");
		expect(result.skillBreakdown.breakdown).not.toHaveProperty("writtenVocab");
	});

	test("a genuinely scored readingComp IS eligible for strongest/weakest", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0006",
			summaryBand: "B4",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([
				{
					_id: "a1",
					semester: "2024 Sem 1",
					assessmentDate: new Date(),
					summaryBand: "B4",
					newBand: "B4",
					wraScore: 8,
					rdComprehensionScore: 9,
				},
			]),
		});

		const result = await progressService.buildDashboard("Student 0006");

		expect(result.skillBreakdown.breakdown).toHaveProperty("readingComp", 9);
	});
});

describe("UT-PMS-16 — bandScore field is present and matches component-level results", () => {
	beforeEach(() => jest.clearAllMocks());

	test("bandScore.totalScore and bandScore.passed are present on the dashboard", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0007",
			summaryBand: "A1",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([
				{
					_id: "a1",
					semester: "2024 Sem 1",
					assessmentDate: new Date(),
					summaryBand: "A1",
					newBand: "A1",
					pictureNamingScore: 13,
					wraScore: 8,
					fluencyMark: 20,
					paIdentificationScore: 8,
					letterFormationScore: 20,
					ed1Score: 3,
					lsComprehensionScore: 2,
				},
			]),
		});

		const result = await progressService.buildDashboard("Student 0007");

		expect(result.bandScore).toHaveProperty("totalScore");
		expect(result.bandScore).toHaveProperty("passed");
		expect(result.bandScore.passed).toBe(true);
	});
});
