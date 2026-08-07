const AnalysisReport = require("../models/analysisReport");

function create(data) { return AnalysisReport.create(data); }
function findById(id) { return AnalysisReport.findById(id).populate("student").populate("writingSample").populate("answerKey", "title originalName expectedText answers").lean(); }
function findByStudent(studentId) { return AnalysisReport.find({ student: studentId }).sort({ createdAt: -1 }).populate("writingSample").populate("answerKey", "title originalName expectedText answers").lean(); }
function updateReview(id, updates) { return AnalysisReport.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean(); }
function saveOpenAiAnalysis(id, writingSampleId, errors, expectedText, recommendation, session = null, metrics = {}) {
  return AnalysisReport.findOneAndUpdate(
    { _id: id, writingSample: writingSampleId },
    {
      errors,
      expectedText,
      interventionRecommendation: recommendation,
      openAiAnalysedAt: new Date(),
      ...(metrics.errorCounts ? { errorCounts: metrics.errorCounts } : {}),
      ...(metrics.chartData ? { chartData: metrics.chartData } : {}),
      ...(metrics.summary ? { summary: metrics.summary } : {}),
    },
    { returnDocument: "after", runValidators: true, session }
  ).populate("student").populate("writingSample").lean();
}

module.exports = { create, findById, findByStudent, updateReview, saveOpenAiAnalysis };
