const studentRepository = require("../repositories/studentRepository");

async function createStudent(req, res, next) {
  try {
    const { studentId, name, age, yearLevel, language } = req.body;
    if (!studentId?.trim() || !name?.trim()) return res.status(400).json({ success: false, error: "studentId and name are required." });
    const student = await studentRepository.create({ studentId: studentId.trim(), name: name.trim(), age, yearLevel, language });
    return res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, error: "Student profile already exists." });
    return next(error);
  }
}

async function findStudent(req, res, next) {
    try {

        const query = String(req.query.q || "").trim();

        if (!query) {
            return res.status(400).json({
                success: false,
                error: "Search query q is required."
            });
        }

        const students = await studentRepository.search(query);

        return res.json({
            success: true,
            data: students
        });

    } catch (error) {
        next(error);
    }
}

module.exports = { createStudent, findStudent };
