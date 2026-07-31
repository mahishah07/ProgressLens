const StudentProfile = require("../models/studentProfile");

function create(data) { return StudentProfile.create(data); }
function findByStudentId(studentId) { return StudentProfile.findOne({ studentId }); }
function search(query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return StudentProfile.find({ $or: [{ name: new RegExp(escaped, "i") }, { studentId: new RegExp(escaped, "i") }] }).limit(20).lean();
}

module.exports = { create, findByStudentId, search };
