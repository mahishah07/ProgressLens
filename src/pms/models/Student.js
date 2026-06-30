const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
	{
		studentId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		dateOfBirth: {
			type: Date,
		},
		classGroup: {
			type: String, // e.g. "P3A", "Sec2B"
			trim: true,
		},
		currentLevel: {
			type: String,
			enum: ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"],
			default: "A1",
		},
		parentName: {
			type: String,
			trim: true,
		},
		parentEmail: {
			type: String,
			trim: true,
			lowercase: true,
		},
		parentContact: {
			type: String,
			trim: true,
		},
		teacherInCharge: {
			type: String,
			trim: true,
		},
		enrollmentDate: {
			type: Date,
			default: Date.now,
		},
		active: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true },
);

// studentSchema.index({ studentId: 1 });
studentSchema.index({ classGroup: 1 });

module.exports = mongoose.model("Student", studentSchema);
