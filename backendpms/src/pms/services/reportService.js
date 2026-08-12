const Report = require("../models/Report");
const { resolveStudent } = require("./studentIdentityService");
const progressService = require("./progressService");
const aiService = require("./aiService");

const BAND_DESCRIPTIONS = {
	A1: "is in the early stages of their literacy journey",
	A2: "is developing foundational literacy skills",
	A3: "is building on early literacy foundations",
	B4: "has achieved a solid foundation in literacy",
	B5: "is progressing well in their literacy development",
	B6: "is demonstrating strong literacy skills",
	C7: "has achieved an advanced level of literacy",
	C8: "is performing at a high level of literacy proficiency",
	C9: "has achieved the highest level of literacy proficiency",
};

const SKILL_LABELS = {
	pictureNaming: "Picture Naming",
	pictureDescription: "Picture Description",
	paIdentification: "Phonological Awareness",
	wra: "Word Reading Accuracy",
	fluency: "Reading Fluency",
	wordSpelling: "Word Spelling",
	letterFormation: "Letter Formation",
	editDiagram1: "Editing Skills (Level 1)",
	editDiagram2: "Editing Skills (Level 2)",
	editDiagram3: "Editing Skills (Level 3)",
	narrative: "Narrative Writing",
	exposition: "Exposition Writing",
	persuasive: "Persuasive Writing",
	listeningComp: "Listening Comprehension",
	readingComp: "Reading Comprehension",
	writtenVocab: "Written Vocabulary",
};

// Builds a sanitised summary of the dashboard for the AI prompt — no PII
const sanitiseForAI = (dashboard) => {
	const componentResults = (dashboard.bandScore?.componentResults || [])
		.filter((c) => !c.skipped)
		.map((c) => ({
			component: SKILL_LABELS[c.name] || c.name,
			score: c.score,
			passMark: c.passMark,
			passed: c.passed,
		}));

	return {
		totalAssessments: dashboard.totalAssessments,
		currentBand: dashboard.currentBandLevel,
		latestBandLevel: dashboard.latestAssessment?.newBand,
		overallScore: dashboard.bandScore?.totalScore,
		passed: dashboard.bandScore?.passed,
		componentResults,
		strongestSkill: dashboard.skillBreakdown?.strongest
			? SKILL_LABELS[dashboard.skillBreakdown.strongest] ||
				dashboard.skillBreakdown.strongest
			: null,
		weakestSkill: dashboard.skillBreakdown?.weakest
			? SKILL_LABELS[dashboard.skillBreakdown.weakest] ||
				dashboard.skillBreakdown.weakest
			: null,
		progressOverTime: dashboard.progressOverTime,
	};
};

// Fallback rule-based text if AI is unavailable — still works for 1 assessment
const generateFallbackOverallProgress = (student, dashboard) => {
	const band = dashboard.currentBandLevel;
	const bandDesc =
		BAND_DESCRIPTIONS[band] || "is making progress in their literacy journey";
	const totalAssessments = dashboard.totalAssessments;

	let progress = `Your child ${bandDesc}. `;

	if (totalAssessments === 1) {
		progress += `This is their first assessment with us, and we are looking forward to tracking their growth over time.`;
	} else {
		progress += `Across ${totalAssessments} assessments, your child has continued to build on their literacy skills.`;
	}

	return progress;
};

const generateFallbackLiteracyGrowth = (dashboard) => {
	const strongest = dashboard.skillBreakdown?.strongest;
	const weakest = dashboard.skillBreakdown?.weakest;

	let growth = "";
	if (strongest) {
		growth += `Your child has shown particular strength in ${SKILL_LABELS[strongest] || strongest}. `;
	}
	if (weakest) {
		growth += `We will continue supporting growth in ${SKILL_LABELS[weakest] || weakest}.`;
	}
	return (
		growth || "Your child is making steady progress across all literacy areas."
	);
};

const generateFallbackInterventionAreas = (dashboard) => {
	const failed = (dashboard.bandScore?.componentResults || [])
		.filter((c) => !c.skipped && c.passed === false)
		.map((c) => SKILL_LABELS[c.name] || c.name);

	let interventions = "";
	if (failed.length > 0) {
		interventions += `Our teachers will focus on strengthening ${failed.slice(0, 2).join(" and ")} through targeted activities. `;
	}
	interventions += `Regular practice at home, such as reading together and encouraging writing activities, will greatly support your child's progress.`;
	return interventions;
};

// UC3: generate AI-powered parent-friendly report — works for any student with >=1 assessment
exports.generateReport = async (studentId, generatedBy) => {
	const student = await resolveStudent(studentId);
	if (!student) return null;

	const dashboard = await progressService.buildDashboard(studentId);

	if (!dashboard || dashboard.status === "assessment_pending") {
		return {
			status: "insufficient_data",
			message: "No assessment data available to generate report",
		};
	}

	let aiReport;
	try {
		const sanitised = sanitiseForAI(dashboard);
		aiReport = await aiService.generateParentReport(
			sanitised,
			dashboard.currentBandLevel,
		);
	} catch (err) {
		// AI unavailable — fall back to rule-based narrative so report generation never fully blocks
		aiReport = {
			overallProgress: generateFallbackOverallProgress(student, dashboard),
			literacyGrowth: generateFallbackLiteracyGrowth(dashboard),
			teacherObservations: "",
			interventionAreas: generateFallbackInterventionAreas(dashboard),
		};
	}

	const report = await Report.create({
		student: student._id,
		generatedBy: generatedBy || "System",
		overallProgress: aiReport.overallProgress,
		literacyGrowth: aiReport.literacyGrowth,
		teacherObservations: aiReport.teacherObservations,
		interventionAreas: aiReport.interventionAreas,
		isEdited: false,
	});

	return { status: "ok", report };
};

// UC5: get latest report for a student
exports.getLatestReport = async (studentId) => {
	const student = await resolveStudent(studentId);
	if (!student) return null;
	const report = await Report.findOne({ student: student._id })
		.sort({ createdAt: -1 })
		.populate("student", "studentId summaryBand schLevel");
	if (!report) return null;
	return report;
};

// UC5: edit report
exports.editReport = async (reportId, updates) => {
	const allowed = [
		"teacherObservations",
		"overallProgress",
		"literacyGrowth",
		"interventionAreas",
	];
	const filteredUpdates = {};
	for (const key of allowed) {
		if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
	}

	const expectedVersion = updates.expectedVersion;
	if (
		expectedVersion !== undefined &&
		(!Number.isInteger(expectedVersion) || expectedVersion < 0)
	) {
		const error = new Error("expectedVersion must be a non-negative integer");
		error.statusCode = 400;
		throw error;
	}

	filteredUpdates.isEdited = true;
	filteredUpdates.editedAt = new Date();
	const filter = { _id: reportId };
	if (expectedVersion !== undefined) filter.__v = expectedVersion;

	const report = await Report.findOneAndUpdate(
		filter,
		{
			$set: filteredUpdates,
			$inc: { __v: 1 },
		},
		{
			returnDocument: "after",
			runValidators: true,
		},
	);

	if (
		!report &&
		expectedVersion !== undefined &&
		(await Report.exists({ _id: reportId }))
	) {
		const error = new Error(
			"Report was updated by another request; reload and try again",
		);
		error.statusCode = 409;
		throw error;
	}
	if (!report) return null;
	return report;
};
