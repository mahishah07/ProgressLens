const Assessment = require("../models/Assessment");
const Student = require("../models/Student");
const { resolveStudent } = require("./studentIdentityService");

const BAND_ORDER = ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"];

const getBandIndex = (band) => BAND_ORDER.indexOf(band);

const getBandChange = (earlier, later) => {
	if (!earlier || !later) return null;
	const diff = getBandIndex(later) - getBandIndex(earlier);
	if (diff > 0) return { direction: "improved", steps: diff };
	if (diff < 0) return { direction: "declined", steps: Math.abs(diff) };
	return { direction: "same", steps: 0 };
};

const getSkillScores = (assessment) => ({
	pictureNaming: assessment.pictureNamingScore ?? null,
	pictureDescription: assessment.pictureDescriptionScore ?? null,
	paIdentification: assessment.paIdentificationScore ?? null,
	phonics: assessment.phonicsScore ?? null,
	wra: assessment.wraScore ?? null,
	fluency: assessment.fluencyMark ?? null,
	wordSpelling: assessment.wordSpellingScore ?? null,
	letterFormation: assessment.letterFormationScore ?? null,
	ed1: assessment.ed1Score ?? null,
	ed2: assessment.ed2Score ?? null,
	ed3: assessment.ed3Score ?? null,
	narrative: assessment.narrativeScore ?? null,
	exposition: assessment.expositionScore ?? null,
	persuasive: assessment.persuasiveScore ?? null,
	lsComprehension: assessment.lsComprehensionScore ?? null,
	rdComprehension: assessment.rdComprehensionScore ?? null,
});

const getAverage = (scores) => {
	const values = Object.values(scores).filter((v) => v !== null);
	if (values.length === 0) return null;
	return parseFloat(
		(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
	);
};

const getSkillChanges = (earlierScores, laterScores) => {
	const changes = {};
	for (const skill of Object.keys(laterScores)) {
		const before = earlierScores[skill];
		const after = laterScores[skill];
		if (before === null || after === null) {
			changes[skill] = { before, after, change: null, improved: null };
		} else {
			const change = parseFloat((after - before).toFixed(2));
			changes[skill] = {
				before,
				after,
				change,
				improved: change > 0,
			};
		}
	}
	return changes;
};

const getErrorReduction = (earlierScores, laterScores) => {
	const errorFields = ["ed1", "ed2", "ed3"];
	let totalBefore = 0;
	let totalAfter = 0;
	let count = 0;

	for (const field of errorFields) {
		const before = earlierScores[field];
		const after = laterScores[field];
		if (before !== null && after !== null) {
			totalBefore += before;
			totalAfter += after;
			count++;
		}
	}

	if (count === 0) return null;
	return {
		before: parseFloat((totalBefore / count).toFixed(2)),
		after: parseFloat((totalAfter / count).toFixed(2)),
		reduction: parseFloat(((totalBefore - totalAfter) / count).toFixed(2)),
		improved: totalAfter < totalBefore,
	};
};

const getSkillProficiency = (scores) => {
	const entries = Object.entries(scores).filter(([_, v]) => v !== null);
	if (entries.length === 0) return { strongest: null, weakest: null };
	const sorted = [...entries].sort(([, a], [, b]) => b - a);
	return {
		strongest: { skill: sorted[0][0], score: sorted[0][1] },
		weakest: {
			skill: sorted[sorted.length - 1][0],
			score: sorted[sorted.length - 1][1],
		},
	};
};

// UC4: compare all assessments for a student
exports.compareAssessments = async (studentId) => {
	const student = await resolveStudent(studentId);
	if (!student) return null;

	const assessments = await Assessment.find({ student: student._id }).sort({
		assessmentDate: 1,
	});

	if (assessments.length < 1) {
		return {
			status: "insufficient_data",
			message: "At least one assessment is required for comparison",
			student,
		};
	}

	const earliest = assessments[0];
	const latest = assessments[assessments.length - 1];

	const earlierScores = getSkillScores(earliest);
	const laterScores = getSkillScores(latest);

	const earlierAvg = getAverage(earlierScores);
	const laterAvg = getAverage(laterScores);

	const overallScoreChange =
		earlierAvg !== null && laterAvg !== null
			? parseFloat((laterAvg - earlierAvg).toFixed(2))
			: null;

	const bandChange = getBandChange(
		earliest.newBand || student.summaryBand,
		latest.newBand || student.summaryBand,
	);

	const skillChanges = getSkillChanges(earlierScores, laterScores);
	const errorReduction = getErrorReduction(earlierScores, laterScores);
	const earlierProficiency = getSkillProficiency(earlierScores);
	const laterProficiency = getSkillProficiency(laterScores);

	// performance variance across all assessments
	const allAverages = assessments
		.map((a) => getAverage(getSkillScores(a)))
		.filter((v) => v !== null);
	const mean = allAverages.reduce((a, b) => a + b, 0) / allAverages.length;
	const variance =
		allAverages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
		allAverages.length;
	const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

	// per-assessment progression
	const progressionSteps = [];
	for (let i = 0; i < assessments.length - 1; i++) {
		const from = assessments[i];
		const to = assessments[i + 1];
		const fromAvg = getAverage(getSkillScores(from));
		const toAvg = getAverage(getSkillScores(to));
		const scoreChange =
			fromAvg !== null && toAvg !== null
				? parseFloat((toAvg - fromAvg).toFixed(2))
				: null;

		progressionSteps.push({
			step: i + 1,
			from: {
				assessmentId: from._id,
				semester: from.semester,
				date: from.assessmentDate,
				band: from.newBand || null,
				avgScore: fromAvg,
			},
			to: {
				assessmentId: to._id,
				semester: to.semester,
				date: to.assessmentDate,
				band: to.newBand || null,
				avgScore: toAvg,
			},
			bandChange: getBandChange(from.newBand, to.newBand),
			scoreChange,
			improved: scoreChange !== null ? scoreChange > 0 : null,
		});
	}

	return {
		status: "ok",
		student: {
			_id: student._id,
			studentId: student.studentId,
			summaryBand: student.summaryBand,
		},
		totalAssessments: assessments.length,
		comparisonPeriod: {
			from: earliest.semester,
			to: latest.semester,
		},
		bandChange,
		overallScore: {
			earliest: earlierAvg,
			latest: laterAvg,
			change: overallScoreChange,
			improved: overallScoreChange !== null ? overallScoreChange > 0 : null,
		},
		errorReduction,
		skillChanges,
		proficiencyChange: {
			earlier: earlierProficiency,
			later: laterProficiency,
		},
		varianceAnalysis: {
			mean: parseFloat(mean.toFixed(2)),
			stdDev,
			allScores: allAverages,
		},
		progressionSteps,
		assessmentHistory: assessments.map((a) => ({
			_id: a._id,
			semester: a.semester,
			assessmentDate: a.assessmentDate,
			newBand: a.newBand,
			averageScore: getAverage(getSkillScores(a)),
		})),
	};
};
