const Student = require("../models/Student");

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
		const student = await Student.findById(req.params.id);
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
		const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
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
		const student = await Student.findByIdAndDelete(req.params.id);
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
