const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Student",
			required: true,
		},
		generatedBy: {
			type: String,
			trim: true,
		},
		overallProgress: {
			type: String,
			trim: true,
		},
		literacyGrowth: {
			type: String,
			trim: true,
		},
		teacherObservations: {
			type: String,
			trim: true,
		},
		interventionAreas: {
			type: String,
			trim: true,
		},
		isEdited: {
			type: Boolean,
			default: false,
		},
		editedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

reportSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
