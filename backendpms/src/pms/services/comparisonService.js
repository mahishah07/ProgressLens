const Assessment = require("../models/Assessment");
const Student = require("../models/Student");
const { resolveStudent } = require("./studentIdentityService");
const { calculateBandScore } = require("./bandScoring");

const BAND_ORDER = ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"];

const getBandIndex = (band) => BAND_ORDER.indexOf(band);

const getBandChange = (earlier, later) => {
	if (!earlier || !later) return null;
	const diff = getBandIndex(later) - getBandIndex(earlier);
	if (diff > 0) return { direction: "improved", steps: diff };
	if (diff < 0) return { direction: "declined", steps: Math.abs(diff) };
	return { direction: "same", steps: 0 };
};

// Get pass/fail component results for one assessment
const getComponentResults = (assessment, bandLevel, schLevel) => {
	const scored = calculateBandScore(assessment, bandLevel, schLevel);
	if (!scored) return {};
	const map = {};
	scored.componentResults.forEach((c) => {
		map[c.name] = {
			score: c.score,
			passMark: c.passMark,
			passed: c.passed,
			skipped: c.skipped,
		};
	});
	return map;
};

// Union of components tested in either assessment, with pass/fail + variance
const getComponentComparison = (earlierResults, laterResults) => {
	const allNames = new Set([
		...Object.keys(earlierResults),
		...Object.keys(laterResults),
	]);
	const comparison = {};

	for (const name of allNames) {
		const before = earlierResults[name];
		const after = laterResults[name];

		const beforeTaken = before && !before.skipped && before.score !== null;
		const afterTaken = after && !after.skipped && after.score !== null;

		if (beforeTaken && afterTaken) {
			const change = parseFloat((after.score - before.score).toFixed(2));
			comparison[name] = {
				before: before.score,
				after: after.score,
				beforePassed: before.passed,
				afterPassed: after.passed,
				change,
				bothTaken: true,
			};
		} else if (beforeTaken || afterTaken) {
			comparison[name] = {
				before: beforeTaken ? before.score : null,
				after: afterTaken ? after.score : null,
				beforePassed: beforeTaken ? before.passed : null,
				afterPassed: afterTaken ? after.passed : null,
				change: null,
				bothTaken: false,
			};
		}
	}

	return comparison;
};

// Count components that flipped from fail->pass or pass->fail
const getPassFailTransitions = (componentComparison) => {
	let newlyPassing = 0;
	let newlyFailing = 0;

	for (const comp of Object.values(componentComparison)) {
		if (!comp.bothTaken) continue;
		if (comp.beforePassed === false && comp.afterPassed === true)
			newlyPassing++;
		if (comp.beforePassed === true && comp.afterPassed === false)
			newlyFailing++;
	}

	return { newlyPassing, newlyFailing };
};

// UC4: compare two selected assessments for a student
exports.compareAssessments = async (
	studentId,
	assessmentIdA,
	assessmentIdB,
) => {
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

	// Resolve which two assessments to compare
	let earliest, latest;
	if (assessmentIdA && assessmentIdB) {
		const a = assessments.find((x) => x._id.toString() === assessmentIdA);
		const b = assessments.find((x) => x._id.toString() === assessmentIdB);
		if (!a || !b) {
			return {
				status: "insufficient_data",
				message: "Invalid assessment selection",
				student,
			};
		}
		// force chronological order
		if (new Date(a.assessmentDate) <= new Date(b.assessmentDate)) {
			earliest = a;
			latest = b;
		} else {
			earliest = b;
			latest = a;
		}
	} else {
		earliest = assessments[0];
		latest = assessments[assessments.length - 1];
	}

	if (earliest._id.toString() === latest._id.toString()) {
		return {
			status: "insufficient_data",
			message: "Select two different assessments",
			student,
		};
	}

	const earlierBand = earliest.summaryBand || student.summaryBand;
	const laterBand = latest.summaryBand || student.summaryBand;

	const earlierResults = getComponentResults(
		earliest,
		earlierBand,
		student.schLevel,
	);
	const laterResults = getComponentResults(latest, laterBand, student.schLevel);

	const bandChange = getBandChange(
		earliest.newBand || earlierBand,
		latest.newBand || laterBand,
	);

	const componentComparison = getComponentComparison(
		earlierResults,
		laterResults,
	);
	const transitions = getPassFailTransitions(componentComparison);

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
		componentComparison,
		transitions,
		assessmentHistory: assessments.map((a) => ({
			_id: a._id,
			semester: a.semester,
			assessmentDate: a.assessmentDate,
			newBand: a.newBand,
			summaryBand: a.summaryBand || student.summaryBand,
			teacherComments: a.teacherComments,
		})),
		selectedA: {
			_id: earliest._id,
			semester: earliest.semester,
			teacherComments: earliest.teacherComments,
		},
		selectedB: {
			_id: latest._id,
			semester: latest.semester,
			teacherComments: latest.teacherComments,
		},
	};
};
