const progressService = require("../services/progressService");

// UC1: GET /api/progress/:studentId/overview
exports.getStudentOverview = async (req, res) => {
	try {
		const result = await progressService.getStudentOverview(
			req.params.studentId,
		);
		if (!result) return res.status(404).json({ message: "Student not found" });
		res.json(result);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// UC2: GET /api/progress/:studentId/dashboard
exports.getProgressDashboard = async (req, res) => {
	try {
		const result = await progressService.buildDashboard(req.params.studentId);
		if (!result) return res.status(404).json({ message: "Student not found" });
		if (result.status === "assessment_pending") {
			return res.status(200).json({
				status: "assessment_pending",
				message: "No assessments found for this student",
				student: result.student,
			});
		}
		res.json(result);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// Search/filter: GET /api/progress/search?centreId=&teacherId=&summaryBand=&schLevel=
exports.searchStudents = async (req, res) => {
	try {
		const filters = req.query;
		const students = await progressService.searchStudents(filters);
		res.json(students);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
