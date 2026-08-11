const Assessment = require("../models/Assessment");
const Student = require("../models/Student");

jest.mock("../models/Assessment");
jest.mock("../models/Student");
jest.mock("../services/studentIdentityService");

const { resolveStudent } = require("../services/studentIdentityService");
const comparisonService = require("../services/comparisonService");

describe("UT-PMS-08 — compareAssessments assessment selection", () => {
	beforeEach(() => jest.clearAllMocks());

	test("auto-orders out-of-order assessment IDs chronologically", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0001",
			summaryBand: "B4",
			schLevel: "Primary",
		});

		const earlier = {
			_id: "a1",
			assessmentDate: new Date("2023-01-01"),
			semester: "2023 Sem 1",
			summaryBand: "A3",
			newBand: "A3",
		};
		const later = {
			_id: "a2",
			assessmentDate: new Date("2024-01-01"),
			semester: "2024 Sem 1",
			summaryBand: "A3",
			newBand: "B4",
		};

		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([earlier, later]),
		});

		// pass IDs in reverse order (later first, earlier second)
		const result = await comparisonService.compareAssessments(
			"Student 0001",
			"a2",
			"a1",
		);

		expect(result.comparisonPeriod.from).toBe("2023 Sem 1");
		expect(result.comparisonPeriod.to).toBe("2024 Sem 1");
	});

	test("returns null for unknown student", async () => {
		resolveStudent.mockResolvedValue(null);
		const result = await comparisonService.compareAssessments(
			"unknown",
			null,
			null,
		);
		expect(result).toBeNull();
	});

	test("returns insufficient_data when student has zero assessments", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0002" });
		Assessment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
		const result = await comparisonService.compareAssessments(
			"Student 0002",
			null,
			null,
		);
		expect(result.status).toBe("insufficient_data");
	});

	test("returns insufficient_data when same assessment selected twice", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0003",
			summaryBand: "A1",
		});
		const single = {
			_id: "a1",
			assessmentDate: new Date(),
			semester: "2024 Sem 1",
			summaryBand: "A1",
			newBand: "A1",
		};
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([single]),
		});
		const result = await comparisonService.compareAssessments(
			"Student 0003",
			"a1",
			"a1",
		);
		expect(result.status).toBe("insufficient_data");
	});
});

describe("UT-PMS-09 — component comparison for union of tested components", () => {
	beforeEach(() => jest.clearAllMocks());

	test("component tested in only one assessment shows raw score with no variance", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0004",
			summaryBand: "B4",
			schLevel: "Primary",
		});

		const earlier = {
			_id: "a1",
			assessmentDate: new Date("2023-01-01"),
			semester: "2023 Sem 1",
			summaryBand: "B4",
			newBand: "B4",
			wraScore: 8,
			wordSpellingScore: 8,
		};
		const later = {
			_id: "a2",
			assessmentDate: new Date("2024-01-01"),
			semester: "2024 Sem 1",
			summaryBand: "B4",
			newBand: "B5",
			wraScore: 9,
			wordSpellingScore: 9,
			narrativeScore: 12, // only tested in the later assessment
		};

		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([earlier, later]),
		});

		const result = await comparisonService.compareAssessments(
			"Student 0004",
			"a1",
			"a2",
		);
		const narrative = result.componentComparison.narrative;

		expect(narrative.bothTaken).toBe(false);
		expect(narrative.before).toBeNull();
		expect(narrative.after).toBe(12);
		expect(narrative.change).toBeNull();
	});

	test("component tested in both assessments shows variance and pass/fail", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0005",
			summaryBand: "B4",
			schLevel: "Primary",
		});

		const earlier = {
			_id: "a1",
			assessmentDate: new Date("2023-01-01"),
			semester: "2023 Sem 1",
			summaryBand: "B4",
			newBand: "B4",
			wraScore: 6,
		};
		const later = {
			_id: "a2",
			assessmentDate: new Date("2024-01-01"),
			semester: "2024 Sem 1",
			summaryBand: "B4",
			newBand: "B5",
			wraScore: 9,
		};

		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([earlier, later]),
		});

		const result = await comparisonService.compareAssessments(
			"Student 0005",
			"a1",
			"a2",
		);
		const wra = result.componentComparison.wra;

		expect(wra.bothTaken).toBe(true);
		expect(wra.before).toBe(6);
		expect(wra.after).toBe(9);
		expect(wra.change).toBe(3);
		expect(wra.beforePassed).toBe(false); // 6 < passMark 8
		expect(wra.afterPassed).toBe(true); // 9 >= passMark 8
	});
});

describe("UT-PMS-10 — pass/fail transition counts", () => {
	beforeEach(() => jest.clearAllMocks());

	test("counts components that flip from fail to pass and pass to fail", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0006",
			summaryBand: "B4",
			schLevel: "Primary",
		});

		const earlier = {
			_id: "a1",
			assessmentDate: new Date("2023-01-01"),
			semester: "2023 Sem 1",
			summaryBand: "B4",
			newBand: "B4",
			wraScore: 6, // fail (passMark 8)
			wordSpellingScore: 9, // pass
		};
		const later = {
			_id: "a2",
			assessmentDate: new Date("2024-01-01"),
			semester: "2024 Sem 1",
			summaryBand: "B4",
			newBand: "B5",
			wraScore: 9, // now pass — newly passing
			wordSpellingScore: 5, // now fail — newly failing
		};

		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([earlier, later]),
		});

		const result = await comparisonService.compareAssessments(
			"Student 0006",
			"a1",
			"a2",
		);

		expect(result.transitions.newlyPassing).toBeGreaterThanOrEqual(1);
		expect(result.transitions.newlyFailing).toBeGreaterThanOrEqual(1);
	});

	test("no transitions when nothing changes pass/fail status", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0007",
			summaryBand: "B4",
			schLevel: "Primary",
		});

		const fixedScores = { wraScore: 9, wordSpellingScore: 9 };
		const earlier = {
			_id: "a1",
			assessmentDate: new Date("2023-01-01"),
			semester: "2023 Sem 1",
			summaryBand: "B4",
			newBand: "B4",
			...fixedScores,
		};
		const later = {
			_id: "a2",
			assessmentDate: new Date("2024-01-01"),
			semester: "2024 Sem 1",
			summaryBand: "B4",
			newBand: "B4",
			...fixedScores,
		};

		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([earlier, later]),
		});

		const result = await comparisonService.compareAssessments(
			"Student 0007",
			"a1",
			"a2",
		);
		expect(result.transitions.newlyPassing).toBe(0);
		expect(result.transitions.newlyFailing).toBe(0);
	});
});
