const mongoose = require("mongoose");

const detectedErrorSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    category: { type: String, required: true },
    message: { type: String, required: true },
    expected: { type: String, default: null },
    actual: { type: String, default: null },
    suggestion: { type: String, default: null },
    suggestions: [{ type: String }],
    expectedCorrection: { type: String, default: null },
    correctionExplanation: { type: String, default: "" },
    correctionSource: { type: String, enum: ["", "openai"], default: "" },
    expectedIndex: { type: Number, default: null },
    actualIndex: { type: Number, default: null },
    tokenIndex: { type: Number, default: null },
    reviewStatus: { type: String, enum: ["pending", "accepted", "rejected", "edited"], default: "pending" },
    educatorNotes: { type: String, default: "" },
  },
  { _id: true }
);

const analysisReportSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    writingSample: { type: mongoose.Schema.Types.ObjectId, ref: "WritingSample", required: true, unique: true },
    answerKey: { type: mongoose.Schema.Types.ObjectId, ref: "AnswerKey", default: null, index: true },
    expectedText: { type: String, default: "" },
    tokens: [{ type: String }],
    sentences: [{ type: String }],
    errors: [detectedErrorSchema],
    summary: {
      wordCount: { type: Number, default: 0 },
      sentenceCount: { type: Number, default: 0 },
      errorCount: { type: Number, default: 0 },
    },
    errorCounts: {
      spelling: { type: Number, default: 0 },
      phonetic: { type: Number, default: 0 },
      insertion: { type: Number, default: 0 },
      deletion: { type: Number, default: 0 },
      letterReversal: { type: Number, default: 0 },
      tense: { type: Number, default: 0 },
      capitalisation: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    chartData: [{
      key: { type: String, required: true },
      label: { type: String, required: true },
      count: { type: Number, required: true },
      percentage: { type: Number, required: true },
      color: { type: String, required: true },
    }],
    interventionRecommendation: {
      status: { type: String, enum: ["pending", "completed", "failed", "not_configured"], default: "pending" },
      overview: { type: String, default: "" },
      dominantPattern: { type: String, default: "" },
      interventions: [{
        title: { type: String, required: true },
        rationale: { type: String, required: true },
        activities: [{ type: String }],
        frequency: { type: String, required: true },
      }],
      educatorCaution: { type: String, default: "" },
      model: { type: String, default: "" },
      generatedAt: { type: Date, default: null },
      error: { type: String, default: "" },
    },
    reviewStatus: { type: String, enum: ["pending", "in_review", "finalised"], default: "pending" },
    educatorSummary: { type: String, default: "" },
    openAiAnalysedAt: { type: Date, default: null },
    analysedAt: { type: Date, required: true },
    finalisedAt: { type: Date, default: null },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

analysisReportSchema.index({ student: 1, createdAt: -1 });
module.exports = mongoose.model("AnalysisReport", analysisReportSchema);
