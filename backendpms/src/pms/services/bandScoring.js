/**
 * Band Scoring Logic for DAS Progress Monitoring System
 * 90% overall pass threshold for all bands
 *
 * Key rules confirmed with DAS:
 * - Phonics is NOT a separate scored component (assessed orally, excluded)
 * - Fluency has no confirmed pass mark yet — always counted as passed for now
 * - Written Vocab (Band B/C only) is not a separate test — it is tied to the
 *   overall Writing result: if ALL writing components the student took pass,
 *   Written Vocab passes and gets full weight; if ANY fail, Written Vocab
 *   fails and gets 0 weight.
 * - Reading Comprehension pass marks differ by SchLevel (Primary/Secondary)
 *   for bands B5 and B6 only.
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
 * @param {Object} assessment - Assessment document from MongoDB
 * @param {string} bandLevel - Band level for this assessment
 * @param {string} schLevel - "Primary" or "Secondary" (needed for B5/B6 readingComp)
 */
const calculateBandScore = (assessment, bandLevel, schLevel) => {
	const config = BAND_CONFIG[bandLevel];
	if (!config) return null;

	const results = config.components.map((comp) => {
		// Written Vocab handled after writing group is resolved
		if (comp.tiedToWriting) {
			return {
				name: comp.name,
				group: null,
				score: null,
				passMark: null,
				weight: comp.weight,
				passed: null, // resolved below
				weightedScore: 0,
				skipped: false,
				note: "Tied to writing result",
			};
		}

		const score = assessment[comp.scoreField];
		const hasScore = score !== null && score !== undefined && score > 0;

		// Fluency has no confirmed pass mark — always counts as passed if present
		if (comp.name === "fluency") {
			const fluencyPassed = hasScore ? true : score === 0 ? true : null;
			if (!hasScore && score !== 0) {
				return {
					name: comp.name,
					group: comp.group,
					score: score ?? null,
					passMark: null,
					weight: comp.weight,
					passed: null,
					weightedScore: 0,
					skipped: true,
				};
			}
			return {
				name: comp.name,
				group: comp.group,
				score: score ?? null,
				passMark: null,
				weight: comp.weight,
				passed: true,
				weightedScore: 0,
				skipped: false,
				note: "No pass mark set — counted as passed",
			};
		}

		// Skip optional components with no real score
		// Skip any component with no real score (required or optional)
		if (!hasScore) {
			return {
				name: comp.name,
				group: comp.group || null,
				score: score ?? null,
				passMark: comp.passMark,
				weight: comp.weight,
				passed: null,
				weightedScore: 0,
				skipped: true,
			};
		}

		// Resolve pass mark (may depend on schLevel)
		let passMark = comp.passMark;
		if (passMark && typeof passMark === "object") {
			passMark = passMark[schLevel] ?? passMark.Primary;
		}

		const passed = hasScore ? score >= passMark : false;

		return {
			name: comp.name,
			group: comp.group || null,
			score: hasScore ? score : null,
			passMark,
			weight: comp.weight,
			passed,
			weightedScore: 0, // set after dynamic redistribution
			skipped: false,
		};
	});

	// Dynamic weight redistribution per group (phonics, writing)
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
				r.weightedScore = r.passed ? weightPerComponent : 0;
			});
		}
	}

	// Non-group components get their weighted score directly
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

	// Resolve Written Vocab based on writing group outcome
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
