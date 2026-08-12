const Assessment = require("../models/Assessment");
const Student = require("../models/Student");
const { resolveStudent } = require("./studentIdentityService");

const { calculateBandScore } = require("./bandScoring");

const BAND_ORDER = ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"];

const getBandIndex = (band) => BAND_ORDER.indexOf(band);

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
});

const calculateAverageScore = (skillScores) => {
	const values = Object.values(skillScores).filter((v) => v !== null);
	if (values.length === 0) return null;
	return parseFloat(
		(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
	);
};

const getSkillBreakdownFromBandScore = (bandScore) => {
	if (!bandScore) return { strongest: null, weakest: null, breakdown: {} };

	const tested = bandScore.componentResults.filter(
		(c) =>
			!c.skipped &&
			c.score !== null &&
			c.score !== undefined &&
			c.name !== "writtenVocab",
	);

	if (tested.length === 0)
		return { strongest: null, weakest: null, breakdown: {} };

	const sorted = [...tested].sort((a, b) => b.score - a.score);

	return {
		strongest: sorted[0].name,
		weakest: sorted[sorted.length - 1].name,
		breakdown: Object.fromEntries(tested.map((c) => [c.name, c.score])),
	};
};

// UC2: retrieve full assessment history + build dashboard data
exports.buildDashboard = async (studentId) => {
	const student = await resolveStudent(studentId);
	if (!student) return null;
	const studentMongoId = student._id;

	const assessments = await Assessment.find({ student: studentMongoId }).sort({
		assessmentDate: 1,
	});

	if (assessments.length === 0) {
		return {
			status: "assessment_pending",
			student: {
				_id: student._id,
				studentId: student.studentId,
				centreId: student.centreId,
				teacherId: student.teacherId,
				schLevel: student.schLevel,
				summaryBand: student.summaryBand,
			},
			currentBandLevel: student.summaryBand,
		};
	}

	const latest = assessments[assessments.length - 1];
	const bandScore = calculateBandScore(
		latest,
		latest.summaryBand || student.summaryBand,
		student.schLevel,
	);
	const skillScores = getSkillScores(latest);
	const skillBreakdown = getSkillBreakdownFromBandScore(bandScore);
	const averageScore = calculateAverageScore(skillScores);

	const progressOverTime = assessments.map((a) => {
		const bandLevel = a.summaryBand || student.summaryBand;
		const scored = calculateBandScore(a, bandLevel, student.schLevel);
		return {
			semester: a.semester,
			term: a.term,
			assessmentDate: a.assessmentDate,
			weightedScore: scored ? scored.totalScore : null,
			summaryBand: a.summaryBand || null,
			newBand: a.newBand || null,
		};
	});

	const componentTrend = assessments.map((a) => {
		const bandForThisAssessment = a.summaryBand || student.summaryBand;
		const scored = calculateBandScore(
			a,
			bandForThisAssessment,
			student.schLevel,
		);
		return {
			semester: a.semester,
			assessmentDate: a.assessmentDate,
			components: scored
				? scored.componentResults.map((c) => ({
						name: c.name,
						score: c.score,
						passMark: c.passMark,
						result: c.skipped ? null : c.passed ? 1 : 0,
					}))
				: [],
		};
	});

	const bandProgression = assessments
		.filter((a) => a.newBand)
		.map((a) => ({
			semester: a.semester,
			band: a.newBand,
			bandIndex: getBandIndex(a.newBand),
		}));

	return {
		status: "ok",
		student: {
			_id: student._id,
			studentId: student.studentId,
			centreId: student.centreId,
			teacherId: student.teacherId,
			schLevel: student.schLevel,
			summaryBand: student.summaryBand,
			progress: student.progress,
		},
		currentBandLevel: student.summaryBand,
		bandScore,
		componentTrend,
		latestAssessment: {
			_id: latest._id,
			semester: latest.semester,
			newBand: latest.newBand,
			term: latest.term,
			assessmentDate: latest.assessmentDate,
			assessedBy: latest.assessedBy,
			teacherComments: latest.teacherComments,
			aiInsights: latest.aiInsights,
			weightedScore: bandScore ? bandScore.totalScore : null,
			skillScores,
		},
		skillBreakdown,
		progressOverTime,
		bandProgression,
		assessmentHistory: assessments
			.map((a) => {
				const bandForThisAssessment = a.summaryBand || student.summaryBand;
				const aScore = calculateBandScore(
					a,
					bandForThisAssessment,
					student.schLevel,
				);
				return {
					_id: a._id,
					semester: a.semester,
					assessmentDate: a.assessmentDate,
					newBand: a.newBand,
					summaryBand: a.summaryBand || student.summaryBand,
					assessedBy: a.assessedBy,
					teacherComments: a.teacherComments,
					aiInsights: a.aiInsights,
					bandScore: aScore,
					weightedScore: aScore ? aScore.totalScore : null,
					passed: aScore ? aScore.passed : null,
				};
			})
			.reverse(),
		totalAssessments: assessments.length,
	};
};

// UC1: student overview (lighter version)
exports.getStudentOverview = async (studentId) => {
	const student = await resolveStudent(studentId);
	if (!student) return null;

	const latest = await Assessment.findOne({ student: student._id }).sort({
		assessmentDate: -1,
	});

	let bandScore = null;
	if (latest && student) {
		try {
			bandScore = calculateBandScore(
				latest,
				latest.summaryBand || student.summaryBand,
				student.schLevel,
			);
		} catch (err) {
			bandScore = null;
		}
	}

	return {
		student: {
			_id: student._id,
			studentId: student.studentId,
			centreId: student.centreId,
			teacherId: student.teacherId,
			schLevel: student.schLevel,
			summaryBand: student.summaryBand,
			progress: student.progress,
		},
		currentBandLevel: student.summaryBand,
		latestNewBand: latest ? latest.newBand : null,
		bandScore,
		lastAssessmentDate: latest ? latest.assessmentDate : null,
		lastSemester: latest ? latest.semester : null,
		assessedBy: latest ? latest.assessedBy : null,
		hasAssessments: !!latest,
	};
};

// search/filter students
exports.searchStudents = async (filters) => {
	const query = {};
	if (filters.centreId) query.centreId = filters.centreId;
	if (filters.teacherId) query.teacherId = filters.teacherId;
	if (filters.schLevel) query.schLevel = filters.schLevel;
	if (filters.summaryBand) query.summaryBand = filters.summaryBand;
	if (filters.progress) query.progress = filters.progress;
	if (typeof filters.studentId === "string" && filters.studentId) {
		const literal = filters.studentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		query.studentId = new RegExp(literal.slice(0, 100), "i");
	}

	return await Student.find(query).sort({ createdAt: -1 });
};
