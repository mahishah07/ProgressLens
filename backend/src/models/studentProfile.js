const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    age: { type: Number, min: 3, max: 25 },
    yearLevel: { type: String, trim: true, default: "" },
    language: { type: String, trim: true, default: "English (L1)" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
