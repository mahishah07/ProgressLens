const BAND_CONFIG = {
	A1: {
		components: [
			{
				name: "pictureNamingScore",
				category: "Vocab",
				weight: 50.0,
				passMark: 13,
			},
			{
				name: "wraScore",
				category: "PA/Phonics",
				weight: 11.67,
				passMark: 20,
			},
			{
				name: "fluencyScore",
				category: "PA/Phonics",
				weight: 11.67,
				passMark: 8,
			},
			{
				name: "paIdentificationScore",
				category: "PA/Phonics",
				weight: 11.67,
				passMark: 8,
			},
			{
				name: "letterFormationScore",
				category: "Writing",
				weight: 7.5,
				passMark: 20,
			},
			{
				name: "editdiagram1Score",
				category: "Writing",
				weight: 7.5,
				passMark: 3,
			},
			{
				name: "lsComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 7.5,
				passMark: 2,
			},
		],
		forgiveness: {
			groupA: ["letterFormationScore", "ed1Score"],
			groupB: ["lsComprehensionScore"],
		},
		passingTotal: 90,
	},

	A2: {
		components: [
			{
				name: "pictureDescriptionScore",
				category: "Vocab",
				weight: 50.0,
				passMark: 13,
			},
			{
				name: "wraScore",
				category: "PA/Phonics",
				weight: 11.67,
				passMark: 20,
			},
			{
				name: "fluencyScore",
				category: "PA/Phonics",
				weight: 11.67,
				passMark: 8,
			},
			{
				name: "wordSpellingScore",
				category: "Vocab",
				weight: 11.67,
				passMark: 13,
			},
			{
				name: "editdiagram2",
				category: "Writing",
				weight: 7.5,
				passMark: 3,
			},
			{
				name: "lsComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 7.5,
				passMark: 2,
			},
		],
		forgiveness: {
			groupA: ["editdiagram1Score"],
			groupB: ["lsComprehensionScore"],
		},
		passingTotal: 90,
	},

	A3: {
		components: [
			{
				name: "pictureDescriptionScore",
				category: "Vocab",
				weight: 50.0,
				passMark: 13,
			},
			{
				name: "wraScore",
				category: "PA/Phonics",
				weight: 11.67,
				passMark: 20,
			},
			{
				name: "fluencyScore",
				category: "PA/Phonics",
				weight: 11.67,
				passMark: 8,
			},
			{
				name: "wordSpellingScore",
				category: "Vocab",
				weight: 11.67,
				passMark: 13,
			},
			{
				name: "editdiagram3Score",
				category: "Writing",
				weight: 7.5,
				passMark: 3,
			},
			{
				name: "rdComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 7.5,
				passMark: 2,
			},
		],
		forgiveness: {
			groupA: ["editdiagram3Score"],
			groupB: ["rdComprehensionScore"],
		},
		passingTotal: 90,
	},

	B4: {
		components: [
			{
				name: "writtenVocabScore",
				category: "Vocab",
				weight: 15.0,
				passMark: 13,
			},
			{
				name: "wraScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 20,
			},
			{
				name: "fluencyScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 8,
			},
			{
				name: "wordSpellingScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 13,
			},
			{
				name: "narrativeExpositionScore",
				category: "Writing",
				weight: 17.5,
				passMark: 13,
			},
			{
				name: "rdComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 17.5,
				passMark: 2,
			},
		],
		passingTotal: 90,
	},

	B5: {
		components: [
			{
				name: "writtenVocabScore",
				category: "Vocab",
				weight: 15.0,
				passMark: 13,
			},
			{
				name: "wraScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 20,
			},
			{
				name: "fluencyScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 8,
			},
			{
				name: "wordSpellingScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 13,
			},
			{
				name: "narrativeExpositionScore",
				category: "Writing",
				weight: 17.5,
				passMark: 13,
			},
			{
				name: "rdComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 17.5,
				passMark: 2,
			},
		],
		passingTotal: 90,
	},

	B6: {
		components: [
			{
				name: "writtenVocabScore",
				category: "Vocab",
				weight: 15.0,
				passMark: 13,
			},
			{
				name: "wraScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 20,
			},
			{
				name: "fluencyScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 8,
			},
			{
				name: "wordSpellingScore",
				category: "PA/Phonics",
				weight: 16.67,
				passMark: 13,
			},
			{
				name: "narrativeExpositionScore",
				category: "Writing",
				weight: 17.5,
				passMark: 13,
			},
			{
				name: "rdComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 17.5,
				passMark: 2,
			},
		],
		passingTotal: 90,
	},

	C7: {
		components: [
			{
				name: "writtenVocabScore",
				category: "Vocab",
				weight: 15.0,
				passMark: 13,
			},
			{
				name: "wraFluencyScore",
				category: "PA/Phonics",
				weight: 17.5,
				passMark: 20,
			},
			{
				name: "wordSpellingScore",
				category: "PA/Phonics",
				weight: 17.5,
				passMark: 13,
			},
			{
				name: "narrativeExpositionScore",
				category: "Writing",
				weight: 25.0,
				passMark: 13,
			},
			{
				name: "rdComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 25.0,
				passMark: 2,
			},
		],
		passingTotal: 90,
	},

	C8: {
		components: [
			{
				name: "writtenVocabScore",
				category: "Vocab",
				weight: 15.0,
				passMark: 13,
			},
			{
				name: "wraFluencyScore",
				category: "PA/Phonics",
				weight: 17.5,
				passMark: 20,
			},
			{
				name: "wordSpellingScore",
				category: "PA/Phonics",
				weight: 17.5,
				passMark: 13,
			},
			{
				name: "narrativeExpositionScore",
				category: "Writing",
				weight: 25.0,
				passMark: 13,
			},
			{
				name: "rdComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 25.0,
				passMark: 2,
			},
		],
		passingTotal: 90,
	},

	C9: {
		components: [
			{
				name: "writtenVocabScore",
				category: "Vocab",
				weight: 15.0,
				passMark: 13,
			},
			{
				name: "wraFluencyScore",
				category: "PA/Phonics",
				weight: 17.5,
				passMark: 20,
			},
			{
				name: "wordSpellingScore",
				category: "PA/Phonics",
				weight: 17.5,
				passMark: 13,
			},
			{
				name: "narrativeExpositionScore",
				category: "Writing",
				weight: 25.0,
				passMark: 13,
			},
			{
				name: "rdComprehensionScore",
				category: "Listening / Reading Comprehension",
				weight: 25.0,
				passMark: 2,
			},
		],
		passingTotal: 90,
	},
};

const calculateBandScore = (assessment, bandConfig) => {
	const config = bandConfig[assessment.summaryBand];
	if (!config) return null;

	const results = config.components.map((comp) => {
		const score = assessment[comp.name];
		const passed =
			score !== null && score !== undefined && score >= comp.passMark;
		return {
			name: comp.name,
			category: comp.category,
			score,
			passMark: comp.passMark,
			weight: comp.weight,
			passed,
			weightedScore: passed ? comp.weight : 0,
		};
	});

	const failedComponents = results.filter((r) => !r.passed).map((r) => r.name);

	// A1 forgiveness: fail ONE from groupA OR ONE from groupB, not both
	let forgivenessApplied = false;
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
		// A2/A3 rule: fail ONE from groupA only
		const failedA = failedComponents.filter((c) => groupA.includes(c));
		const otherFails = failedComponents.filter((c) => !groupA.includes(c));
		forgivenessApplied = otherFails.length === 0 && failedA.length <= 1;
	}

	const totalScore = results.reduce((sum, r) => sum + r.weightedScore, 0);
	const passed = totalScore >= config.passingTotal || forgivenessApplied;

	return {
		band: assessment.summaryBand,
		totalScore: parseFloat(totalScore.toFixed(2)),
		passed,
		forgivenessApplied,
		componentResults: results,
		failedComponents,
	};
};

module.exports = { BAND_CONFIG, calculateBandScore };
