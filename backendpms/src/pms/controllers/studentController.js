const Student = require("../models/Student");
const { resolveStudent } = require("../services/studentIdentityService");

// GET /api/students
exports.getStudents = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const skip = (page - 1) * limit;

		const students = await Student.find()
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Student.countDocuments();

		res.json({
			students,
			total,
			page,
			pages: Math.ceil(total / limit),
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// GET /api/students/:id
exports.getStudentById = async (req, res) => {
	try {
		const student = await resolveStudent(req.params.id);
		if (!student) return res.status(404).json({ message: "Student not found" });
		res.json(student);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// POST /api/students
exports.createStudent = async (req, res) => {
	try {
		const student = await Student.create(req.body);
		res.status(201).json(student);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
	try {
		const existing = await resolveStudent(req.params.id);
		if (!existing) return res.status(404).json({ message: "Student not found" });
		const student = await Student.findByIdAndUpdate(existing._id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!student) return res.status(404).json({ message: "Student not found" });
		res.json(student);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
	try {
		const existing = await resolveStudent(req.params.id);
		if (!existing) return res.status(404).json({ message: "Student not found" });
		const student = await Student.findByIdAndDelete(existing._id);
		if (!student) return res.status(404).json({ message: "Student not found" });
		res.json({ message: "Student deleted" });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// POST /api/students/bulk
exports.bulkCreateStudents = async (req, res) => {
	try {
		const students = await Student.insertMany(req.body, { ordered: false });
		res.status(201).json(students);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

exports.getCentres = async (req, res) => {
	try {
		const centres = await Student.distinct("centreId");
		res.json(centres);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
