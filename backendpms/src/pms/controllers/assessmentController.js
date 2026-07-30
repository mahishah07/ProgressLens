const Assessment = require("../models/Assessment");

// GET /api/assessments  (optional ?student=<id>&subject=<subject> filters)
exports.getAssessments = async (req, res) => {
	try {
		const filter = {};
		if (req.query.student) filter.student = req.query.student;
		if (req.query.subject) filter.subject = req.query.subject;

		const assessments = await Assessment.find(filter)
			.populate("student", "name studentId classGroup")
			.sort({ assessmentDate: -1 });
		res.json(assessments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// GET /api/assessments/:id
exports.getAssessmentById = async (req, res) => {
	try {
		const assessment = await Assessment.findById(req.params.id).populate(
			"student",
			"name studentId classGroup",
		);
		if (!assessment)
			return res.status(404).json({ message: "Assessment not found" });
		res.json(assessment);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// POST /api/assessments
exports.createAssessment = async (req, res) => {
	try {
		const assessment = await Assessment.create(req.body);
		res.status(201).json(assessment);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

// PUT /api/assessments/:id
exports.updateAssessment = async (req, res) => {
	try {
		const assessment = await Assessment.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			},
		);
		if (!assessment)
			return res.status(404).json({ message: "Assessment not found" });
		res.json(assessment);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

// DELETE /api/assessments/:id
exports.deleteAssessment = async (req, res) => {
	try {
		const assessment = await Assessment.findByIdAndDelete(req.params.id);
		if (!assessment)
			return res.status(404).json({ message: "Assessment not found" });
		res.json({ message: "Assessment deleted" });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// GET /api/assessments/student/:studentId/progress
exports.getStudentProgress = async (req, res) => {
	try {
		const assessments = await Assessment.find({
			student: req.params.studentId,
		}).sort({
			assessmentDate: 1,
		});
		res.json(assessments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
