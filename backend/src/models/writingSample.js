const mongoose = require("mongoose");

const writingSampleSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    answerKey: { type: mongoose.Schema.Types.ObjectId, ref: "AnswerKey", default: null, index: true },
    originalName: { type: String, required: true },
    savedName: { type: String, default: "" },
    savedPath: { type: String, default: "" },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileData: { type: Buffer, required: true, select: false },
    ocrText: { type: String, default: "" },
    handwrittenText: { type: String, default: "" },
    cleanedText: { type: String, default: "" },
    expectedText: { type: String, default: "" },
    recommendedIntervention: { type: String, default: "" },
    status: { type: String, enum: ["uploaded", "analysed", "failed"], default: "uploaded" },
    processingError: { type: String, default: "" },
    ocrCompletedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

writingSampleSchema.index({ student: 1, createdAt: -1 });
module.exports = mongoose.model("WritingSample", writingSampleSchema);
