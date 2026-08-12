const Assessment = require("../models/Assessment");
const mongoose = require("mongoose");
const { resolveStudent } = require("../services/studentIdentityService");
const Student = require("../models/Student");

const { calculateBandScore } = require("../services/bandScoring");
const BAND_ORDER = ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"];

// GET /api/assessments  (optional ?student=<id>&subject=<subject> filters)
exports.getAssessments = async (req, res) => {
	try {
		const filter = {};
		if (req.query.student) {
			const student = await resolveStudent(req.query.student);
			if (!student)
				return res.status(404).json({ message: "Student not found" });
			filter.student = student._id;
		}
		if (req.query.subject) filter.subject = req.query.subject;
		const assessments = await Assessment.find(filter);
		res.json(assessments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

exports.createAssessment = async (req, res) => {
	try {
		const student = await resolveStudent(req.body.student);
		if (!student) return res.status(404).json({ message: "Student not found" });

		const assessmentData = { ...req.body, student: student._id };

		const scored = calculateBandScore(
			assessmentData,
			req.body.summaryBand,
			student.schLevel,
		);
		if (scored) {
			const currentIndex = BAND_ORDER.indexOf(req.body.summaryBand);
			const nextBand = BAND_ORDER[currentIndex + 1];
			assessmentData.newBand =
				scored.passed && nextBand ? nextBand : req.body.summaryBand;
		} else {
			assessmentData.newBand = req.body.summaryBand;
		}

		const assessment = await Assessment.create(assessmentData);

		if (assessmentData.newBand !== student.summaryBand) {
			await Student.findByIdAndUpdate(student._id, {
				summaryBand: assessmentData.newBand,
			});
		}

		res.status(201).json(assessment);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

// GET /api/assessments/:id
exports.getAssessmentById = async (req, res) => {
	try {
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({ message: "Invalid assessment ID" });
		}
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

// PUT /api/assessments/:id
exports.updateAssessment = async (req, res) => {
	try {
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({ message: "Invalid assessment ID" });
		}
		const updates = { ...req.body };
		if (updates.student) {
			const student = await resolveStudent(updates.student);
			if (!student)
				return res.status(404).json({ message: "Student not found" });
			updates.student = student._id;
		}
		const assessment = await Assessment.findByIdAndUpdate(
			req.params.id,
			updates,
			{
				returnDocument: "after",
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
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({ message: "Invalid assessment ID" });
		}
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
		const student = await resolveStudent(req.params.studentId);
		if (!student) return res.status(404).json({ message: "Student not found" });
		const assessments = await Assessment.find({
			student: student._id,
		}).sort({
			assessmentDate: 1,
		});
		res.json(assessments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
