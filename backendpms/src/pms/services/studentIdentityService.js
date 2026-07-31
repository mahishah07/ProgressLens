const mongoose = require("mongoose");
const Student = require("../models/Student");

async function resolveStudent(identifier) {
  const value = String(identifier || "").trim();
  if (!value) return null;

  const byBusinessId = await Student.findOne({ studentId: value });
  if (byBusinessId) return byBusinessId;
  if (mongoose.isValidObjectId(value)) return Student.findById(value);
  return null;
}

module.exports = { resolveStudent };
