/**
 * Band Scoring Logic for DAS Progress Monitoring System
 * Based on CBA Scoring and Summary Band Logic
 * 90% overall pass threshold for all bands
 *
 * For optional component groups (writing, PA/Phonics in B/C):
 * - Weight is redistributed equally across components that were actually taken
 * - Components with no score AND no progress field are skipped
 * - Written Vocab has no field in MongoDB — treated as always passing with full weight
 */

// Category groups for dynamic redistribution
const WRITING_COMPONENTS = ["narrative", "exposition", "persuasive"];
const PHONICS_COMPONENTS_B = ["phonics", "wra", "wordSpelling"]; // B bands PA/Phonics
const PHONICS_COMPONENTS_C = ["phonics", "wra", "wordSpelling"]; // C bands PA/Phonics

const BAND_CONFIG = {
	// ─── BAND A ───────────────────────────────────────────────────────────────
	A1: {
		passingTotal: 90,
		components: [
			{
				name: "pictureNaming",
				scoreField: "pictureNamingScore",
				progressField: "pictureNamingProgress",
				passMark: 13,
				weight: 50.0,
				optional: false,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 20,
				weight: 11.67,
				optional: false,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 11.67,
				optional: false,
			},
			{
				name: "paIdentification",
				scoreField: "paIdentificationScore",
				progressField: "paIdentificationProgress",
				passMark: 8,
				weight: 11.67,
				optional: false,
			},
			{
				name: "letterFormation",
				scoreField: "letterFormationScore",
				progressField: "letterFormationProgress",
				passMark: 20,
				weight: 3.75,
				optional: false,
			},
			{
				name: "editDiagram1",
				scoreField: "ed1Score",
				progressField: "ed1Progress",
				passMark: 3,
				weight: 3.75,
				optional: false,
			},
			{
				name: "listeningComp",
				scoreField: "lsComprehensionScore",
				progressField: "lsComprehensionProgress",
				passMark: 2,
				weight: 7.5,
				optional: false,
			},
		],
		forgiveness: {
			groupA: ["letterFormation", "editDiagram1"],
			groupB: ["listeningComp"],
		},
		dynamicGroups: null,
	},

	A2: {
		passingTotal: 90,
		components: [
			{
				name: "pictureDescription",
				scoreField: "pictureDescriptionScore",
				progressField: "pictureDescriptionProgress",
				passMark: 7,
				weight: 50.0,
				optional: false,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 24,
				weight: 11.67,
				optional: false,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 8.75,
				optional: false,
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				progressField: "wordSpellingProgress",
				passMark: 8,
				weight: 14.58,
				optional: false,
			},
			{
				name: "editDiagram2",
				scoreField: "ed2Score",
				progressField: "ed2Progress",
				passMark: 3,
				weight: 7.5,
				optional: false,
			},
			{
				name: "listeningComp",
				scoreField: "lsComprehensionScore",
				progressField: "lsComprehensionProgress",
				passMark: 3,
				weight: 7.5,
				optional: false,
			},
		],
		forgiveness: {
			groupA: ["editDiagram2", "listeningComp"],
		},
		dynamicGroups: null,
	},

	A3: {
		passingTotal: 90,
		components: [
			{
				name: "pictureDescription",
				scoreField: "pictureDescriptionScore",
				progressField: "pictureDescriptionProgress",
				passMark: 10,
				weight: 50.0,
				optional: false,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 26,
				weight: 11.67,
				optional: false,
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 11.67,
				optional: false,
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				progressField: "wordSpellingProgress",
				passMark: 8,
				weight: 11.67,
				optional: false,
			},
			{
				name: "editDiagram3",
				scoreField: "ed3Score",
				progressField: "ed3Progress",
				passMark: 4,
				weight: 7.5,
				optional: false,
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				progressField: "rdComprehensionProgress",
				passMark: 5,
				weight: 7.5,
				optional: false,
			},
		],
		forgiveness: {
			groupA: ["editDiagram3", "readingComp"],
		},
		dynamicGroups: null,
	},

	// ─── BAND B ───────────────────────────────────────────────────────────────
	// Written Vocab (15%) — no field in MongoDB, always passes
	// PA/Phonics (50%) — redistributed across components actually taken
	// Writing (17.5%) — redistributed across writing tests actually taken
	// Comprehension (17.5%) — readingComp only

	B4: {
		passingTotal: 90,
		components: [
			{
				name: "writtenVocab",
				scoreField: null,
				progressField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				alwaysPass: true,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 0,
				weight: 50.0,
				optional: true,
				group: "phonics",
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 50.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				progressField: "wordSpellingProgress",
				passMark: 8,
				weight: 50.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				progressField: "narrativeProgress",
				passMark: 10,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				progressField: "expositionProgress",
				passMark: 10,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				progressField: "persuasiveProgress",
				passMark: 10,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				progressField: "rdComprehensionProgress",
				passMark: 7,
				weight: 17.5,
				optional: false,
			},
		],
		forgiveness: null,
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
				progressField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				alwaysPass: true,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 0,
				weight: 50.0,
				optional: true,
				group: "phonics",
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 50.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				progressField: "wordSpellingProgress",
				passMark: 8,
				weight: 50.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				progressField: "narrativeProgress",
				passMark: 12,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				progressField: "expositionProgress",
				passMark: 12,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				progressField: "persuasiveProgress",
				passMark: 12,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				progressField: "rdComprehensionProgress",
				passMark: 10,
				weight: 17.5,
				optional: false,
			},
		],
		forgiveness: null,
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
				progressField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				alwaysPass: true,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 0,
				weight: 50.0,
				optional: true,
				group: "phonics",
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 50.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				progressField: "wordSpellingProgress",
				passMark: 8,
				weight: 50.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				progressField: "narrativeProgress",
				passMark: 14,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				progressField: "expositionProgress",
				passMark: 14,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				progressField: "persuasiveProgress",
				passMark: 14,
				weight: 17.5,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				progressField: "rdComprehensionProgress",
				passMark: 13,
				weight: 17.5,
				optional: false,
			},
		],
		forgiveness: null,
		dynamicGroups: {
			phonics: { totalWeight: 50.0 },
			writing: { totalWeight: 17.5 },
		},
	},

	// ─── BAND C ───────────────────────────────────────────────────────────────
	// Written Vocab (15%) — always passes
	// PA/Phonics (35%) — redistributed across components actually taken
	// Writing (25%) — student takes ONE of narrative/exposition/persuasive
	// Comprehension (25%) — readingComp only

	C7: {
		passingTotal: 90,
		components: [
			{
				name: "writtenVocab",
				scoreField: null,
				progressField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				alwaysPass: true,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 0,
				weight: 35.0,
				optional: true,
				group: "phonics",
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 35.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				progressField: "wordSpellingProgress",
				passMark: 8,
				weight: 35.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				progressField: "narrativeProgress",
				passMark: 16,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				progressField: "expositionProgress",
				passMark: 16,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				progressField: "persuasiveProgress",
				passMark: 16,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				progressField: "rdComprehensionProgress",
				passMark: 6,
				weight: 25.0,
				optional: false,
			},
		],
		forgiveness: null,
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
				progressField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				alwaysPass: true,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 0,
				weight: 35.0,
				optional: true,
				group: "phonics",
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 35.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				progressField: "wordSpellingProgress",
				passMark: 8,
				weight: 35.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				progressField: "narrativeProgress",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				progressField: "expositionProgress",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				progressField: "persuasiveProgress",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				progressField: "rdComprehensionProgress",
				passMark: 7,
				weight: 25.0,
				optional: false,
			},
		],
		forgiveness: null,
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
				progressField: null,
				passMark: 0,
				weight: 15.0,
				optional: false,
				alwaysPass: true,
			},
			{
				name: "phonics",
				scoreField: "phonicsScore",
				progressField: "phonicsProgress",
				passMark: 0,
				weight: 35.0,
				optional: true,
				group: "phonics",
			},
			{
				name: "wra",
				scoreField: "wraScore",
				progressField: "wraProgress",
				passMark: 8,
				weight: 35.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "wordSpelling",
				scoreField: "wordSpellingScore",
				progressField: "wordSpellingProgress",
				passMark: 8,
				weight: 35.0,
				optional: false,
				group: "phonics",
			},
			{
				name: "narrative",
				scoreField: "narrativeScore",
				progressField: "narrativeProgress",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "exposition",
				scoreField: "expositionScore",
				progressField: "expositionProgress",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "persuasive",
				scoreField: "persuasiveScore",
				progressField: "persuasiveProgress",
				passMark: 18,
				weight: 25.0,
				optional: true,
				group: "writing",
			},
			{
				name: "readingComp",
				scoreField: "rdComprehensionScore",
				progressField: "rdComprehensionProgress",
				passMark: 8,
				weight: 25.0,
				optional: false,
			},
		],
		forgiveness: null,
		dynamicGroups: {
			phonics: { totalWeight: 35.0 },
			writing: { totalWeight: 25.0 },
		},
	},
};

/**
 * Calculate band score for a student's assessment
 * @param {Object} assessment - Assessment document from MongoDB
 * @param {string} bandLevel - Student's band level for this assessment
 * @returns {Object|null} scoring result or null if band not found
 */
const calculateBandScore = (assessment, bandLevel) => {
	const config = BAND_CONFIG[bandLevel];
	if (!config) return null;

	// Step 1: evaluate each component
	const results = config.components.map((comp) => {
		// Always passing components (Written Vocab)
		if (comp.alwaysPass) {
			return {
				name: comp.name,
				group: comp.group || null,
				score: null,
				passMark: comp.passMark,
				weight: comp.weight,
				passed: true,
				weightedScore: comp.weight,
				skipped: false,
				note: "No data field — treated as passed",
			};
		}

		const score = assessment[comp.scoreField];
		const progress = assessment[comp.progressField];
		const hasScore = score !== null && score !== undefined && score > 0;
		const hasProgress = progress !== null && progress !== undefined;

		// Skip optional components with no score or score of 0
		if (comp.optional && (!hasScore || score === 0)) {
			return {
				name: comp.name,
				group: comp.group || null,
				score: null,
				passMark: comp.passMark,
				weight: comp.weight,
				passed: null,
				weightedScore: 0,
				skipped: true,
			};
		}

		// Use progress boolean if available, otherwise compare score to passMark
		let passed;
		if (hasProgress) {
			passed = progress === true;
		} else if (hasScore) {
			passed = score >= comp.passMark;
		} else {
			passed = false;
		}

		return {
			name: comp.name,
			group: comp.group || null,
			score: hasScore ? score : null,
			progress: hasProgress ? progress : null,
			passMark: comp.passMark,
			weight: comp.weight,
			passed,
			weightedScore: 0, // will be set after redistribution
			skipped: false,
		};
	});

	// Step 2: dynamic weight redistribution per group
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

	// Step 3: set weightedScore for non-group components
	results.forEach((r) => {
		if (!r.group && !r.skipped && r.passed !== null && r.weightedScore === 0) {
			r.weightedScore = r.passed ? r.weight : 0;
		}
		// alwaysPass already set in step 1
	});

	const failedComponents = results
		.filter((r) => r.passed === false)
		.map((r) => r.name);

	// Step 4: apply forgiveness rules (Band A only)
	let forgivenessApplied = false;
	if (config.forgiveness) {
		const { groupA, groupB } = config.forgiveness;
		if (groupA && groupB) {
			const failedA = failedComponents.filter((c) => groupA.includes(c));
			const failedB = failedComponents.filter((c) => groupB.includes(c));
			const otherFails = failedComponents.filter(
				(c) => ![...groupA, ...groupB].includes(c),
			);
			forgivenessApplied =
				otherFails.length === 0 &&
				((failedA.length <= 1 && failedB.length === 0) ||
					(failedB.length <= 1 && failedA.length === 0));
		} else if (groupA) {
			const failedA = failedComponents.filter((c) => groupA.includes(c));
			const otherFails = failedComponents.filter((c) => !groupA.includes(c));
			forgivenessApplied = otherFails.length === 0 && failedA.length <= 1;
		}
	}

	const totalScore = parseFloat(
		results.reduce((sum, r) => sum + r.weightedScore, 0).toFixed(2),
	);
	const passed = totalScore >= config.passingTotal || forgivenessApplied;

	return {
		band: bandLevel,
		totalScore,
		passed,
		forgivenessApplied,
		componentResults: results,
		failedComponents,
		skippedComponents: results.filter((r) => r.skipped).map((r) => r.name),
	};
};

module.exports = { BAND_CONFIG, calculateBandScore };
