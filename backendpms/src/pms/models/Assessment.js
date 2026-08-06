const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Student",
			required: true,
		},
		semester: { type: String, trim: true },
		summaryBand: { type: String, trim: true },
		newBand: { type: String, trim: true },

		// Picture Naming
		pictureNamingScore: { type: Number, default: null },
		pictureNamingDate: { type: Date, default: null },
		pictureNamingProgress: { type: Boolean, default: null },

		// Picture Description
		pictureDescriptionScore: { type: Number, default: null },
		pictureDescriptionDate: { type: Date, default: null },
		pictureDescriptionProgress: { type: Boolean, default: null },

		// PA Identification
		paIdentificationScore: { type: Number, default: null },
		paIdentificationDate: { type: Date, default: null },
		paIdentificationProgress: { type: Boolean, default: null },

		// Phonics
		phonicsScore: { type: Number, default: null },
		phonicsDate: { type: Date, default: null },
		phonicsProgress: { type: Boolean, default: null },

		// Word Reading Accuracy
		wraScore: { type: Number, default: null },
		wraDate: { type: Date, default: null },
		wraProgress: { type: Boolean, default: null },

		// Fluency
		fluencyMark: { type: Number, default: null },
		fluencyProgress: { type: Boolean, default: null },

		// Word Spelling
		wordSpellingScore: { type: Number, default: null },
		wordSpellingDate: { type: Date, default: null },
		wordSpellingProgress: { type: Boolean, default: null },

		// Letter Formation
		letterFormationScore: { type: Number, default: null },
		letterFormationDate: { type: Date, default: null },
		letterFormationProgress: { type: Boolean, default: null },

		// Edit D1
		ed1Score: { type: Number, default: null },
		ed1Date: { type: Date, default: null },
		ed1Progress: { type: Boolean, default: null },

		// Edit D2
		ed2Score: { type: Number, default: null },
		ed2Date: { type: Date, default: null },
		ed2Progress: { type: Boolean, default: null },

		// Edit D3
		ed3Score: { type: Number, default: null },
		ed3Date: { type: Date, default: null },
		ed3Progress: { type: Boolean, default: null },

		// Narrative Writing
		narrativeScore: { type: Number, default: null },
		narrativeDate: { type: Date, default: null },
		narrativeProgress: { type: Boolean, default: null },

		// Exposition Writing
		expositionScore: { type: Number, default: null },
		expositionDate: { type: Date, default: null },
		expositionProgress: { type: Boolean, default: null },

		// Persuasive Writing
		persuasiveScore: { type: Number, default: null },
		persuasiveDate: { type: Date, default: null },
		persuasiveProgress: { type: Boolean, default: null },

		// Listening & Reading Comprehension
		lsComprehensionScore: { type: Number, default: null },
		lsComprehensionDate: { type: Date, default: null },
		lsComprehensionProgress: { type: Boolean, default: null },

		rdComprehensionScore: { type: Number, default: null },
		rdComprehensionDate: { type: Date, default: null },
		rdComprehensionProgress: { type: Boolean, default: null },

		// Months to 48 months
		monthsTo48: { type: Number, default: null },

		// Meta
		assessmentDate: { type: Date, default: Date.now },
		term: { type: String, trim: true },
		assessedBy: { type: String, trim: true },
		teacherComments: { type: String, trim: true },
		aiInsights: { type: String, trim: true },
	},
	{ timestamps: true },
);

assessmentSchema.index({ student: 1, assessmentDate: -1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
