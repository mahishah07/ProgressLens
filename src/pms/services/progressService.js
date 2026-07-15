const Assessment = require("../models/Assessment");
const Student = require("../models/Student");

const BAND_ORDER = ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"];

const getBandIndex = (band) => BAND_ORDER.indexOf(band);

const getSkillScores = (assessment) => ({
	pictureDescription: assessment.pictureDescriptionScore ?? null,
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

const getSkillBreakdown = (skillScores) => {
	const entries = Object.entries(skillScores).filter(([_, v]) => v !== null);
	if (entries.length === 0)
		return { strongest: null, weakest: null, breakdown: {} };

	const sorted = [...entries].sort(([, a], [, b]) => b - a);
	return {
		strongest: sorted[0][0],
		weakest: sorted[sorted.length - 1][0],
		breakdown: Object.fromEntries(entries),
	};
};

// UC2: retrieve full assessment history + build dashboard data
exports.buildDashboard = async (studentId) => {
	const student = await Student.findById(studentId);
	if (!student) return null;

	const assessments = await Assessment.find({ student: studentId }).sort({
		assessmentDate: 1,
	});

	if (assessments.length === 0) {
		return { status: "assessment_pending", student };
	}

	const latest = assessments[assessments.length - 1];
	const skillScores = getSkillScores(latest);
	const skillBreakdown = getSkillBreakdown(skillScores);
	const averageScore = calculateAverageScore(skillScores);

	const progressOverTime = assessments.map((a) => ({
		semester: a.semester,
		term: a.term,
		assessmentDate: a.assessmentDate,
		averageScore: calculateAverageScore(getSkillScores(a)),
		summaryBand: a.summaryBand || null,
	}));

	const bandProgression = assessments
		.filter((a) => a.summaryBand)
		.map((a) => ({
			semester: a.semester,
			band: a.summaryBand,
			bandIndex: getBandIndex(a.summaryBand),
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
		latestAssessment: {
			_id: latest._id,
			semester: latest.semester,
			term: latest.term,
			assessmentDate: latest.assessmentDate,
			assessedBy: latest.assessedBy,
			teacherComments: latest.teacherComments,
			aiInsights: latest.aiInsights,
			averageScore,
			skillScores,
		},
		skillBreakdown,
		progressOverTime,
		bandProgression,
		assessmentHistory: assessments,
		totalAssessments: assessments.length,
	};
};

// UC1: student overview (lighter version)
exports.getStudentOverview = async (studentId) => {
	const student = await Student.findById(studentId);
	if (!student) return null;

	const latest = await Assessment.findOne({ student: studentId }).sort({
		assessmentDate: -1,
	});

	return {
		student,
		currentBandLevel: student.summaryBand,
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
	if (filters.studentId) query.studentId = new RegExp(filters.studentId, "i");

	return await Student.find(query).sort({ createdAt: -1 });
};
