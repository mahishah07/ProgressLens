/**
 * Band Scoring Logic for DAS Progress Monitoring System
 * 90% overall pass threshold for all bands
 *
 * Key rules confirmed with DAS:
 * - Phonics is NOT a separate scored component (assessed orally, excluded)
 * - Fluency has no confirmed pass mark yet — always counted as passed for now
 * - Written Vocab (Band B/C only) is not a separate test — it is tied to the
 *   overall Writing result: if ALL writing components the student TOOK pass,
 *   Written Vocab passes and gets full weight; if ANY of the taken ones fail,
 *   Written Vocab fails and gets 0 weight.
 * - Reading Comprehension pass marks differ by SchLevel (Primary/Secondary)
 *   for bands B5 and B6 only. Reading Comprehension defaults to passed when
 *   no real score is recorded (including an explicit 0) — this accounts for
 *   a known data-collection gap in historical records, per team decision.
 * - For every OTHER compulsory (non-optional) component, an explicit score
 *   of 0 is treated as a genuine recorded result (a real fail), not as
 *   "not taken". For optional components, a 0 is still treated as blank/
 *   not-taken, matching the existing spreadsheet convention.
 * - Dynamic weight groups (phonics, writing) redistribute weight only
 *   across the components actually scored that cycle — an untested slot
 *   does not shrink everyone else's share.
 */

const WRITING_NAMES = [
	"editDiagram1",
	"editDiagram2",
	"editDiagram3",
	"narrative",
	"exposition",
	"persuasive",
];
const PHONICS_GROUP_NAMES = [
	"wra",
	"fluency",
	"wordSpelling",
	"paIdentification",
];

const BAND_CONFIG = {
	// ─── BAND A ───────────────────────────────────────────────────────────────
	A1: {
		passingTotal: 90,
		components: [
			{
				name: "pictureNaming",
				scoreField: "pictureNamingScore",
				passMark: 13,
				weight: 50.0,
				optional: false,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "paIdentification",
				scoreField: "paIdentificationScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "letterFormation",
				scoreField: "letterFormationScore",
				passMark: 20,
				weight: 3.75,
				optional: false,
				group: "writing",
			},
			{
				name: "editDiagram1",
				scoreField: "ed1Score",
				passMark: 3,
				weight: 3.75,
				optional: false,
				group: "writing",
			},
			{
				name: "listeningComp",
				scoreField: "lsComprehensionScore",
				passMark: 2,
				weight: 7.5,
				optional: false,
			},
		],
		dynamicGroups: {
			phonics: { totalWeight: 35.0 },
			writing: { totalWeight: 7.5 },
		},
	},

	A2: {
		passingTotal: 90,
		components: [
			{
				name: "pictureDescription",
				scoreField: "pictureDescriptionScore",
				passMark: 7,
				weight: 50.0,
				optional: false,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "editDiagram2",
				scoreField: "ed2Score",
				passMark: 3,
				weight: 7.5,
				optional: false,
			},
			{
				name: "listeningComp",
				scoreField: "lsComprehensionScore",
				passMark: 3,
				weight: 7.5,
				optional: false,
			},
		],
		dynamicGroups: { phonics: { totalWeight: 35.0 } },
	},

	A3: {
		passingTotal: 90,
		components: [
			{
				name: "pictureDescription",
				scoreField: "pictureDescriptionScore",
				passMark: 10,
				weight: 50.0,
				optional: false,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "editDiagram3",
				scoreField: "ed3Score",
				passMark: 4,
				weight: 7.5,
				optional: false,
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				passMark: 5,
				weight: 7.5,
				optional: false,
			},
		],
		dynamicGroups: { phonics: { totalWeight: 35.0 } },
	},

	// ─── BAND B ───────────────────────────────────────────────────────────────
	B4: {
		passingTotal: 90,
		components: [
			{
				name: "writtenVocab",
				scoreField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				tiedToWriting: true,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				passMark: 8,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				passMark: 10,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				passMark: 10,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				passMark: 10,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				passMark: 7,
				weight: 17.5,
				optional: false,
			},
		],
		dynamicGroups: {
			phonics: { totalWeight: 50.0 },
			writing: { totalWeight: 17.5 },
		},
	},

	B5: {
		passingTotal: 90,
		components: [
			{
				name: "writtenVocab",
				scoreField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				tiedToWriting: true,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				passMark: 8,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				passMark: 12,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				passMark: 12,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				passMark: 12,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				passMark: { Primary: 10, Secondary: 11 },
				weight: 17.5,
				optional: false,
			},
		],
		dynamicGroups: {
			phonics: { totalWeight: 50.0 },
			writing: { totalWeight: 17.5 },
		},
	},

	B6: {
		passingTotal: 90,
		components: [
			{
				name: "writtenVocab",
				scoreField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				tiedToWriting: true,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				passMark: 8,
				weight: 16.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				passMark: 14,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				passMark: 14,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				passMark: 14,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				passMark: { Primary: 13, Secondary: 13 },
				weight: 17.5,
				optional: false,
			},
		],
		dynamicGroups: {
			phonics: { totalWeight: 50.0 },
			writing: { totalWeight: 17.5 },
		},
	},

	// ─── BAND C ───────────────────────────────────────────────────────────────
	C7: {
		passingTotal: 90,
		components: [
			{
				name: "writtenVocab",
				scoreField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				tiedToWriting: true,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				passMark: 16,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				passMark: 16,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				passMark: 16,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				passMark: 6,
				weight: 25.0,
				optional: false,
			},
		],
		dynamicGroups: {
			phonics: { totalWeight: 35.0 },
			writing: { totalWeight: 25.0 },
		},
	},

	C8: {
		passingTotal: 90,
		components: [
			{
				name: "writtenVocab",
				scoreField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				tiedToWriting: true,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				passMark: 7,
				weight: 25.0,
				optional: false,
			},
		],
		dynamicGroups: {
			phonics: { totalWeight: 35.0 },
			writing: { totalWeight: 25.0 },
		},
	},

	C9: {
		passingTotal: 90,
		components: [
			{
				name: "writtenVocab",
				scoreField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				tiedToWriting: true,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "fluency",
				scoreField: "fluencyMark",
				passMark: null,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				passMark: 8,
				weight: 11.67,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				passMark: 8,
				weight: 25.0,
				optional: false,
			},
		],
		dynamicGroups: {
			phonics: { totalWeight: 35.0 },
			writing: { totalWeight: 25.0 },
		},
	},
};

/**
 * Calculate band score for a student's assessment
 * assessment - Assessment document from MongoDB
 * bandLevel - Band level for this assessment
 * schLevel - "Primary" or "Secondary" (needed for B5/B6 readingComp)
 */

const calculateBandScore = (assessment, bandLevel, schLevel) => {
	const config = BAND_CONFIG[bandLevel];
	if (!config) return null;

	const results = config.components.map((comp) => {
		// Written Vocab is resolved after the writing group is evaluated.
		if (comp.tiedToWriting) {
			return {
				name: comp.name,
				group: null,
				score: null,
				passMark: null,
				weight: comp.weight,
				passed: null,
				weightedScore: 0,
				skipped: false,
				note: "Tied to writing result",
			};
		}

		const score = assessment[comp.scoreField];
		const hasRealValue = score !== null && score !== undefined;
		// hasScore = a genuine POSITIVE score. Used by fluency/readingComp's
		// dedicated branches below, which already treat 0 the same as
		// "no score" — that behaviour is intentionally unchanged here.
		const hasScore = hasRealValue && score > 0;

		// Fluency has no confirmed pass mark.
		// It is considered passed when entered, and also when its
		// stored value is 0 (existing system behaviour).
		if (comp.name === "fluency") {
			if (!hasScore && score !== 0) {
				return {
					name: comp.name,
					group: comp.group || null,
					score: score ?? null,
					passMark: null,
					weight: comp.weight,
					passed: null,
					weightedScore: 0,
					skipped: false,
					note: "No score entered",
				};
			}

			return {
				name: comp.name,
				group: comp.group || null,
				score: score ?? null,
				passMark: null,
				weight: comp.weight,
				passed: true,
				weightedScore: 0,
				skipped: false,
				note: "No pass mark set — counted as passed",
			};
		}

		// Reading Comprehension:
		// Reading Comprehension is automatically considered passed when
		// no real score has been recorded, INCLUDING an explicit 0 — this
		// is unchanged from the existing decision (known data-collection
		// gap in historical records). Once a genuine positive score is
		// entered, it is evaluated against its band's pass mark as normal.
		if (comp.name === "readingComp" && !hasScore) {
			return {
				name: comp.name,
				group: comp.group || null,
				score: score ?? null,
				passMark: null,
				weight: comp.weight,
				passed: true,
				weightedScore: 0,
				skipped: false,
				note: "No score recorded — defaulted to passed",
			};
		}

		// Genuinely no data entered at all (null/undefined) — every other
		// component, compulsory or optional, is shown as "not yet scored"
		// and does not contribute to the total this cycle.
		if (!hasRealValue) {
			let passMark = comp.passMark;

			if (passMark && typeof passMark === "object") {
				passMark = passMark[schLevel] ?? passMark.Primary;
			}

			return {
				name: comp.name,
				group: comp.group || null,
				score: null,
				passMark,
				weight: comp.weight,
				passed: null,
				weightedScore: 0,
				skipped: false,
				note: "No score entered",
			};
		}

		// A real value was entered (could be 0 or a positive number).
		let passMark = comp.passMark;
		if (passMark && typeof passMark === "object") {
			passMark = passMark[schLevel] ?? passMark.Primary;
		}

		// Optional components: an explicit 0 is still treated as blank/
		// not-taken, matching the existing spreadsheet convention where 0
		// commonly means "not entered" for these fields.
		if (score === 0 && comp.optional) {
			return {
				name: comp.name,
				group: comp.group || null,
				score: null,
				passMark,
				weight: comp.weight,
				passed: null,
				weightedScore: 0,
				skipped: false,
				note: "No score entered",
			};
		}

		// Compulsory component with a real recorded value (including an
		// explicit 0) — evaluate normally. A 0 here is a genuine fail,
		// not "not taken".
		const passed = score >= passMark;

		return {
			name: comp.name,
			group: comp.group || null,
			score,
			passMark,
			weight: comp.weight,
			passed,
			weightedScore: 0,
			skipped: false,
		};
	});

	// Normalise: any component with passed === null (genuinely no data
	// this cycle) is marked skipped. This is what the dashboard/Trend
	// grid UI relies on to show "Not taken" instead of a fail — and it's
	// also what group weight redistribution below uses to decide which
	// components were actually administered this cycle.
	results.forEach((r) => {
		if (r.name !== "writtenVocab" && r.passed === null) {
			r.skipped = true;
		}
	});

	// Dynamic weight redistribution per group (phonics, writing).
	// Only components actually scored this cycle (not skipped) share the
	// group's total weight — an untested slot does not shrink everyone
	// else's share.
	if (config.dynamicGroups) {
		for (const [groupName, groupConfig] of Object.entries(
			config.dynamicGroups,
		)) {
			const groupResults = results.filter(
				(r) => r.group === groupName && !r.skipped,
			);

			if (groupResults.length === 0) continue;

			const weightPerComponent = parseFloat(
				(groupConfig.totalWeight / groupResults.length).toFixed(4),
			);

			groupResults.forEach((r) => {
				r.weight = weightPerComponent;
				r.weightedScore = r.passed === true ? weightPerComponent : 0;
			});
		}
	}

	// Non-group components get their weighted score directly.
	results.forEach((r) => {
		if (
			!r.group &&
			!r.skipped &&
			r.passed !== null &&
			!r.name.includes("writtenVocab")
		) {
			r.weightedScore = r.passed ? r.weight : 0;
		}
	});

	// Resolve Written Vocab based on the writing group outcome — only the
	// writing components actually taken this cycle need to pass.
	const writtenVocabRow = results.find((r) => r.name === "writtenVocab");

	if (writtenVocabRow) {
		const writingResults = results.filter(
			(r) => r.group === "writing" && !r.skipped,
		);

		const allWritingPassed =
			writingResults.length > 0 &&
			writingResults.every((r) => r.passed === true);

		writtenVocabRow.passed = allWritingPassed;
		writtenVocabRow.weightedScore = allWritingPassed
			? writtenVocabRow.weight
			: 0;
	}

	const failedComponents = results
		.filter((r) => r.passed === false)
		.map((r) => r.name);

	const totalScore = parseFloat(
		results.reduce((sum, r) => sum + r.weightedScore, 0).toFixed(2),
	);

	const passed = totalScore >= config.passingTotal;

	return {
		band: bandLevel,
		totalScore,
		passed,
		forgivenessApplied: false,
		componentResults: results,
		failedComponents,
		skippedComponents: results.filter((r) => r.skipped).map((r) => r.name),
	};
};

module.exports = { BAND_CONFIG, calculateBandScore };
