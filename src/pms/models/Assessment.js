const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
	{
		semester: {
			type: String,
			required: true,
			trim: true,
		},
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Student",
			required: true,
		},
		pictureDescriptionScore: {
			type: Number,
			min: 0,
			max: 100,
		},
		pictureDescriptionDate: {
			type: Date,
			default: Date.now,
		},
		phonicsScore: {
			type: Number,
			min: 0,
			max: 100,
		},
		phonicsDate: {
			type: Date,
			default: Date.now,
		},
		wraScore: {
			type: Number,
			min: 0,
			max: 100,
		},
		wraDate: {
			type: Date,
			default: Date.now,
		},
		fluencyMark: {
			type: Number,
			min: 0,
			max: 100,
		},
		wordSpellingScore: {
			type: Number,
			min: 0,
			max: 100,
		},
		wordSpellingDate: {
			type: Date,
			default: Date.now,
		},
		letterFormationScore: {
			type: Number,
			min: 0,
			max: 100,
		},
		letterFormationDate: {
			type: Date,
			default: Date.now,
		},
		ed1Score: {
			type: Number,
			min: 0,
			max: 100,
		},
		ed1Date: {
			type: Date,
			default: Date.now,
		},
		ed2Score: {
			type: Number,
			min: 0,
			max: 100,
		},
		ed2Date: {
			type: Date,
			default: Date.now,
		},
		ed3Score: {
			type: Number,
			min: 0,
			max: 100,
		},
		ed3Date: {
			type: Date,
			default: Date.now,
		},
		narrativeScore: {
			type: Number,
			min: 0,
			max: 100,
		},
		narrativeDate: {
			type: Date,
			default: Date.now,
		},
		expositionScore: {
			type: Number,
			min: 0,
			max: 100,
		},
		expositionDate: {
			type: Date,
			default: Date.now,
		},
		persuasiveScore: {
			type: Number,
			min: 0,
			max: 100,
		},
		persuasiveDate: {
			type: Date,
			default: Date.now,
		},
		assessmentDate: {
			type: Date,
			required: true,
			default: Date.now,
		},
		term: {
			type: String, // Semester
			trim: true,
		},
		assessedBy: {
			type: String, // TeacherID
			trim: true,
		},
		teacherComments: {
			type: String,
			trim: true,
		},
		aiInsights: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true },
);

assessmentSchema.index({ student: 1, assessmentDate: -1 });
// assessmentSchema.index({ subject: 1, term: 1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
