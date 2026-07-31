const AnalysisReport = require("../models/analysisReport");

function create(data) { return AnalysisReport.create(data); }
function findById(id) { return AnalysisReport.findById(id).populate("student").populate("writingSample").lean(); }
function findByStudent(studentId) { return AnalysisReport.find({ student: studentId }).sort({ createdAt: -1 }).populate("writingSample").lean(); }
function updateReview(id, updates) { return AnalysisReport.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean(); }
function saveOpenAiAnalysis(id, writingSampleId, errors, recommendation) {
  return AnalysisReport.findOneAndUpdate(
    { _id: id, writingSample: writingSampleId },
    { errors, interventionRecommendation: recommendation, openAiAnalysedAt: new Date() },
    { returnDocument: "after", runValidators: true }
  ).populate("student").populate("writingSample").lean();
}

module.exports = { create, findById, findByStudent, updateReview, saveOpenAiAnalysis };
