const { calculateBandScore } = require("../services/bandScoring");

// UT-PMS-01 — boundary values across bands
describe("UT-PMS-01 — calculateBandScore boundary values", () => {
	test("A1: all components pass at exact boundary marks", () => {
		const result = calculateBandScore(
			{
				pictureNamingScore: 13,
				wraScore: 8,
				fluencyMark: 20,
				paIdentificationScore: 8,
				letterFormationScore: 20,
				ed1Score: 3,
				lsComprehensionScore: 2,
			},
			"A1",
		);
		expect(result.passed).toBe(true);
		expect(result.totalScore).toBeGreaterThanOrEqual(90);
	});

	test("A1: one mark below boundary fails that component only", () => {
		const result = calculateBandScore(
			{
				pictureNamingScore: 12, // below passMark 13
				wraScore: 8,
				fluencyMark: 20,
				paIdentificationScore: 8,
				letterFormationScore: 20,
				ed1Score: 3,
				lsComprehensionScore: 2,
			},
			"A1",
		);
		const vocab = result.componentResults.find(
			(c) => c.name === "pictureNaming",
		);
		expect(vocab.passed).toBe(false);
	});

	test("C9: unrecognised band level returns null", () => {
		const result = calculateBandScore({}, "Z9");
		expect(result).toBeNull();
	});

	test("B4/B6/C7 boundary marks resolve correctly for narrative writing", () => {
		const b4 = calculateBandScore({ narrativeScore: 10 }, "B4", "Primary");
		const b6 = calculateBandScore({ narrativeScore: 14 }, "B6", "Primary");
		const c7 = calculateBandScore({ narrativeScore: 16 }, "C7", "Primary");
		expect(b4.componentResults.find((c) => c.name === "narrative").passed).toBe(
			true,
		);
		expect(b6.componentResults.find((c) => c.name === "narrative").passed).toBe(
			true,
		);
		expect(c7.componentResults.find((c) => c.name === "narrative").passed).toBe(
			true,
		);
	});
});

// UT-PMS-03 — Written Vocab tied to writing pass/fail
describe("UT-PMS-03 — Written Vocab derived from writing result", () => {
	test("all taken writing components pass → Written Vocab passes with full weight", () => {
		const result = calculateBandScore(
			{
				wraScore: 10,
				wordSpellingScore: 9,
				narrativeScore: 15,
				expositionScore: 15,
				persuasiveScore: 15,
				rdComprehensionScore: 10,
			},
			"B4",
			"Primary",
		);
		const vocab = result.componentResults.find(
			(c) => c.name === "writtenVocab",
		);
		expect(vocab.passed).toBe(true);
		expect(vocab.weightedScore).toBe(15);
	});

	test("one writing component fails → Written Vocab fails with zero weight", () => {
		const result = calculateBandScore(
			{
				wraScore: 10,
				wordSpellingScore: 9,
				narrativeScore: 15,
				expositionScore: 2,
				persuasiveScore: null,
				rdComprehensionScore: 10,
			},
			"B4",
			"Primary",
		);
		const vocab = result.componentResults.find(
			(c) => c.name === "writtenVocab",
		);
		expect(vocab.passed).toBe(false);
		expect(vocab.weightedScore).toBe(0);
	});

	test("no writing components taken → Written Vocab fails", () => {
		const result = calculateBandScore(
			{
				wraScore: 10,
				wordSpellingScore: 9,
				rdComprehensionScore: 10,
			},
			"B4",
			"Primary",
		);
		const vocab = result.componentResults.find(
			(c) => c.name === "writtenVocab",
		);
		expect(vocab.passed).toBe(false);
	});
});

// UT-PMS-04 — dynamic weight redistribution
describe("UT-PMS-04 — dynamic weight redistribution across writing group", () => {
	test("only one writing component taken gets full writing weight", () => {
		const result = calculateBandScore(
			{
				wraScore: 10,
				wordSpellingScore: 9,
				narrativeScore: 15,
				expositionScore: null,
				persuasiveScore: null,
				rdComprehensionScore: 10,
			},
			"B4",
			"Primary",
		);
		const narrative = result.componentResults.find(
			(c) => c.name === "narrative",
		);
		expect(narrative.weight).toBeCloseTo(17.5, 1);
	});

	test("two writing components taken split weight equally", () => {
		const result = calculateBandScore(
			{
				wraScore: 10,
				wordSpellingScore: 9,
				narrativeScore: 15,
				expositionScore: 15,
				persuasiveScore: null,
				rdComprehensionScore: 10,
			},
			"B4",
			"Primary",
		);
		const narrative = result.componentResults.find(
			(c) => c.name === "narrative",
		);
		expect(narrative.weight).toBeCloseTo(8.75, 1);
	});

	test("three writing components taken split weight three ways", () => {
		const result = calculateBandScore(
			{
				wraScore: 10,
				wordSpellingScore: 9,
				narrativeScore: 15,
				expositionScore: 15,
				persuasiveScore: 15,
				rdComprehensionScore: 10,
			},
			"B4",
			"Primary",
		);
		const narrative = result.componentResults.find(
			(c) => c.name === "narrative",
		);
		expect(narrative.weight).toBeCloseTo(5.83, 1);
	});

	test("PA/Phonics group (wra + wordSpelling + fluency) splits evenly when all present", () => {
		const result = calculateBandScore(
			{
				wraScore: 10,
				wordSpellingScore: 9,
				fluencyMark: 15,
				rdComprehensionScore: 10,
			},
			"B4",
			"Primary",
		);
		const wra = result.componentResults.find((c) => c.name === "wra");
		expect(wra.weight).toBeCloseTo(16.67, 1);
	});
});

// UT-PMS-05 — schLevel-based Reading Comprehension pass mark
describe("UT-PMS-05 — schLevel affects Reading Comprehension pass mark", () => {
	test("Primary schLevel uses lower pass mark for B5", () => {
		const result = calculateBandScore(
			{ rdComprehensionScore: 10 },
			"B5",
			"Primary",
		);
		const comp = result.componentResults.find((c) => c.name === "readingComp");
		expect(comp.passed).toBe(true);
	});

	test("Secondary schLevel uses higher pass mark for B5 — same score fails", () => {
		const result = calculateBandScore(
			{ rdComprehensionScore: 10 },
			"B5",
			"Secondary",
		);
		const comp = result.componentResults.find((c) => c.name === "readingComp");
		expect(comp.passed).toBe(false);
	});

	test("B6 Primary and Secondary both pass at their respective boundary", () => {
		const primary = calculateBandScore(
			{ rdComprehensionScore: 13 },
			"B6",
			"Primary",
		);
		const secondary = calculateBandScore(
			{ rdComprehensionScore: 13 },
			"B6",
			"Secondary",
		);
		expect(
			primary.componentResults.find((c) => c.name === "readingComp").passed,
		).toBe(true);
		expect(
			secondary.componentResults.find((c) => c.name === "readingComp").passed,
		).toBe(true);
	});
});

// UT-PMS-06 — Phonics excluded from scoring entirely
describe("UT-PMS-06 — Phonics excluded from total score", () => {
	test("phonicsScore present does not change totalScore vs absent", () => {
		const withPhonics = calculateBandScore(
			{
				phonicsScore: 40,
				wraScore: 8,
				wordSpellingScore: 8,
				narrativeScore: 12,
				rdComprehensionScore: 7,
			},
			"B4",
			"Primary",
		);
		const withoutPhonics = calculateBandScore(
			{
				wraScore: 8,
				wordSpellingScore: 8,
				narrativeScore: 12,
				rdComprehensionScore: 7,
			},
			"B4",
			"Primary",
		);
		expect(withPhonics.totalScore).toBe(withoutPhonics.totalScore);
	});

	test("fluency has no confirmed pass mark and always counts as passed when scored", () => {
		const result = calculateBandScore(
			{
				wraScore: 10,
				wordSpellingScore: 9,
				fluencyMark: 3,
				rdComprehensionScore: 10,
			},
			"B4",
			"Primary",
		);
		const fluency = result.componentResults.find((c) => c.name === "fluency");
		expect(fluency.passed).toBe(true);
	});
});
