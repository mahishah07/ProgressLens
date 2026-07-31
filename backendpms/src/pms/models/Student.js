const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
	{
		centreId: {
			type: String,
			trim: true,
		},
		teacherId: {
			type: String,
			trim: true,
		},
		studentId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		schoolId: {
			type: String,
			trim: true,
		},
		age: {
			type: Number,
		},
		schLevel: {
			type: String,
			trim: true,
			enum: ["Primary", "Secondary"],
		},
		enrollmentDate: {
			type: Date,
			default: Date.now,
		},
		summaryBand: {
			type: String,
			enum: ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"],
		},
		progress: {
			type: String,
			enum: ["Moved up", "Same level"],
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
	},
	{ timestamps: true },
);

// studentSchema.index({ studentId: 1 });
// studentSchema.index({ classGroup: 1 });

module.exports = mongoose.model("Student", studentSchema);
