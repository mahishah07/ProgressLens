const Report = require("../models/Report");
const Student = require("../models/Student");
const comparisonService = require("./comparisonService");

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
	phonics: "Phonics",
	wra: "Word Reading Accuracy",
	fluency: "Reading Fluency",
	wordSpelling: "Word Spelling",
	letterFormation: "Letter Formation",
	ed1: "Editing Skills (Level 1)",
	ed2: "Editing Skills (Level 2)",
	ed3: "Editing Skills (Level 3)",
	narrative: "Narrative Writing",
	exposition: "Exposition Writing",
	persuasive: "Persuasive Writing",
	lsComprehension: "Listening Comprehension",
	rdComprehension: "Reading Comprehension",
};

const generateOverallProgress = (student, comparison) => {
	const band = student.summaryBand;
	const bandDesc =
		BAND_DESCRIPTIONS[band] || "is making progress in their literacy journey";
	const totalAssessments = comparison.totalAssessments;
	const scoreChange = comparison.overallScore?.change;
	const bandChange = comparison.bandChange;

	let progress = `Your child ${bandDesc}. `;

	if (totalAssessments === 1) {
		progress += `This is their first assessment with us, and we are looking forward to tracking their growth over time.`;
	} else {
		progress += `Over ${totalAssessments} assessments, `;
		if (bandChange?.direction === "improved") {
			progress += `your child has moved up ${bandChange.steps} band level${bandChange.steps > 1 ? "s" : ""}, which is a wonderful achievement. `;
		} else if (bandChange?.direction === "same") {
			progress += `your child has maintained a consistent band level. `;
		} else if (bandChange?.direction === "declined") {
			progress += `your child has faced some challenges and we are working to provide additional support. `;
		}

		if (scoreChange !== null && scoreChange !== undefined) {
			if (scoreChange > 0) {
				progress += `Their overall assessment scores have improved by ${scoreChange} points, showing great dedication and effort.`;
			} else if (scoreChange < 0) {
				progress += `Their overall scores have dipped slightly, and our teachers are focused on providing targeted support.`;
			} else {
				progress += `Their overall scores have remained stable across assessments.`;
			}
		}
	}

	return progress;
};

const generateLiteracyGrowth = (comparison) => {
	const skillChanges = comparison.skillChanges;
	if (!skillChanges) return "Literacy assessment data is being gathered.";

	const improved = Object.entries(skillChanges)
		.filter(([_, v]) => v.improved === true)
		.map(([k]) => SKILL_LABELS[k] || k);

	const needsWork = Object.entries(skillChanges)
		.filter(([_, v]) => v.improved === false)
		.map(([k]) => SKILL_LABELS[k] || k);

	let growth = "";

	if (improved.length > 0) {
		growth += `Your child has shown improvement in the following areas: ${improved.slice(0, 3).join(", ")}${improved.length > 3 ? ", and more" : ""}. `;
	}

	if (needsWork.length > 0) {
		growth += `Areas where we will continue to provide support include: ${needsWork.slice(0, 3).join(", ")}${needsWork.length > 3 ? ", and others" : ""}.`;
	}

	return (
		growth || "Your child is making steady progress across all literacy areas."
	);
};

const generateInterventionAreas = (comparison) => {
	const proficiency = comparison.proficiencyChange?.later;
	const errorReduction = comparison.errorReduction;

	let interventions = "";

	if (proficiency?.weakest) {
		const skillLabel =
			SKILL_LABELS[proficiency.weakest.skill] || proficiency.weakest.skill;
		interventions += `Our teachers will focus on strengthening your child's ${skillLabel} skills through targeted activities and exercises. `;
	}

	if (errorReduction && !errorReduction.improved) {
		interventions += `We will also be providing additional support to help reduce errors in written work. `;
	}

	interventions += `Regular practice at home, such as reading together and encouraging writing activities, will greatly support your child's progress.`;

	return interventions;
};

// UC3: generate parent-friendly report
const aiService = require("./aiService");

// UC3: generate AI-powered parent-friendly report
exports.generateReport = async (studentId, generatedBy) => {
	const student = await Student.findById(studentId);
	if (!student) return null;

	const comparison = await comparisonService.compareAssessments(studentId);
	if (!comparison || comparison.status === "insufficient_data") {
		return {
			status: "insufficient_data",
			message: "No assessment data available to generate report",
		};
	}

	const aiReport = await aiService.generateParentReport(
		comparison,
		student.summaryBand,
	);

	const report = await Report.create({
		student: studentId,
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
	const report = await Report.findOne({ student: studentId })
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

	filteredUpdates.isEdited = true;
	filteredUpdates.editedAt = new Date();

	const report = await Report.findByIdAndUpdate(reportId, filteredUpdates, {
		new: true,
		runValidators: true,
	});

	if (!report) return null;
	return report;
};
