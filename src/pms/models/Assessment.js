const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Student",
			required: true,
		},
		subject: {
			type: String,
			required: true,
			trim: true, // e.g. "Literacy", "Numeracy"
		},
		levelAchieved: {
			type: String,
			enum: [
				"A1",
				"A2",
				"A3",
				"B1",
				"B2",
				"B3",
				"B4",
				"B5",
				"B6",
				"C1",
				"C2",
				"C3",
				"C4",
				"C5",
				"C6",
				"C7",
				"C8",
				"C9",
			],
			required: true,
		},
		score: {
			type: Number,
			min: 0,
			max: 100,
		},
		assessmentDate: {
			type: Date,
			required: true,
			default: Date.now,
		},
		term: {
			type: String, // e.g. "2026-T2"
			trim: true,
		},
		assessedBy: {
			type: String, // teacher name
			trim: true,
		},
		comments: {
			type: String,
			trim: true,
		},
		aiInsights: {
			type: String, // placeholder slot for AI-generated insights feature
			trim: true,
		},
	},
	{ timestamps: true },
);

assessmentSchema.index({ student: 1, assessmentDate: -1 });
assessmentSchema.index({ subject: 1, term: 1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
