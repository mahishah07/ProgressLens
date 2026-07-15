const comparisonService = require("../services/comparisonService");

// UC4: GET /api/comparison/:studentId
exports.compareAssessments = async (req, res) => {
	try {
		const result = await comparisonService.compareAssessments(
			req.params.studentId,
		);

		if (!result) {
			return res.status(404).json({ message: "Student not found" });
		}

		if (result.status === "insufficient_data") {
			return res.status(200).json(result);
		}

		res.json(result);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
