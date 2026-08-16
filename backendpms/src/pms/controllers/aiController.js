const aiService = require("../services/aiService");
const comparisonService = require("../services/comparisonService");
const Assessment = require("../models/Assessment");

exports.getDashboardSummary = async (req, res) => {
	try {
		const progressService = require("../services/progressService");
		const aiService = require("../services/aiService");

		const dashboard = await progressService.buildDashboard(
			req.params.studentId,
		);
		if (!dashboard)
			return res.status(404).json({ message: "Student not found" });
		if (dashboard.status === "assessment_pending") {
			return res.status(200).json({ summary: null });
		}

		const sanitised = {
			currentBand: dashboard.currentBandLevel,
			overallScore: dashboard.bandScore?.totalScore,
			passed: dashboard.bandScore?.passed,
			strongestSkill: dashboard.skillBreakdown?.strongest,
			weakestSkill: dashboard.skillBreakdown?.weakest,
			totalAssessments: dashboard.totalAssessments,
		};

		const result = await aiService.generateDashboardSummary(sanitised);
		res.json(result);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

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
		if (process.env.NODE_ENV !== "test") {
			console.error("AI recommendations provider request failed");
		}
		res.status(500).json({ message: "Unable to generate recommendations" });
	}
};
