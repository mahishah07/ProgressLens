const reportService = require("../services/reportService");

// UC3: POST /api/reports/:studentId/generate
exports.generateReport = async (req, res) => {
	try {
		const result = await reportService.generateReport(
			req.params.studentId,
			req.body.generatedBy,
		);

		if (!result) return res.status(404).json({ message: "Student not found" });

		if (result.status === "insufficient_data") {
			return res.status(200).json(result);
		}

		res.status(201).json(result);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// UC5: GET /api/reports/:studentId/latest
exports.getLatestReport = async (req, res) => {
	try {
		const report = await reportService.getLatestReport(req.params.studentId);
		if (!report)
			return res
				.status(404)
				.json({ message: "No report found for this student" });
		res.json(report);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// UC5: PUT /api/reports/:reportId/edit
exports.editReport = async (req, res) => {
	try {
		const report = await reportService.editReport(
			req.params.reportId,
			req.body,
		);
		if (!report) return res.status(404).json({ message: "Report not found" });
		res.json(report);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};
