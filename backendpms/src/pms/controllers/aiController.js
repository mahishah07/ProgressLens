const aiService = require("../services/aiService");
const comparisonService = require("../services/comparisonService");
const Assessment = require("../models/Assessment");

// UC6: POST /api/ai/:studentId/recommendations
exports.generateRecommendations = async (req, res) => {
	try {
		const comparison = await comparisonService.compareAssessments(
			req.params.studentId,
		);

		if (!comparison) {
			return res.status(404).json({ message: "Student not found" });
		}

		if (comparison.status === "insufficient_data") {
			return res.status(200).json({
				status: "insufficient_data",
				message:
					"Additional assessments are required to generate meaningful recommendations",
			});
		}

		const recommendations = await aiService.generateRecommendations(comparison);

		// save aiInsights to latest assessment
		const latest = await Assessment.findOne({
			student: comparison.student._id,
		}).sort({
			assessmentDate: -1,
		});
		if (latest) {
			latest.aiInsights = recommendations.summary;
			await latest.save();
		}

		res.json({ status: "ok", recommendations });
	} catch (err) {
		console.error("AI recommendations error:", err.message);
		res.status(500).json({ message: err.message });
	}
};
