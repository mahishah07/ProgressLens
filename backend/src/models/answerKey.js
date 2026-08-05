const mongoose = require("mongoose");

const answerKeySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileData: { type: Buffer, required: true, select: false },
    ocrText: { type: String, required: true },
    expectedText: { type: String, required: true },
    answers: [{ type: String }],
    ocrCompletedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AnswerKey", answerKeySchema);
