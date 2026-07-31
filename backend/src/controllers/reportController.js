const mongoose = require("mongoose");
const studentRepository = require("../repositories/studentRepository");
const reportRepository = require("../repositories/reportRepository");
const writingSampleRepository = require("../repositories/writingSampleRepository");
const { buildErrorChartData } = require("../services/chartService");
const { analyseReportWithOpenAi } = require("../services/interventionRecommendationService");

function formatRecommendation(recommendation) {
  const sections = [recommendation.overview, `Dominant pattern: ${recommendation.dominantPattern}`];
  for (const intervention of recommendation.interventions) {
    sections.push(
      `${intervention.title}: ${intervention.rationale}`,
      `Activities: ${intervention.activities.join("; ")}`,
      `Frequency: ${intervention.frequency}`
    );
  }
  if (recommendation.educatorCaution) sections.push(`Educator note: ${recommendation.educatorCaution}`);
  return sections.filter(Boolean).join("\n");
}

async function getReport(req, res, next) {
  try {
    const report = await reportRepository.findById(req.params.reportId);
    if (!report) return res.status(404).json({ success: false, error: "Report not found." });
    return res.json({ success: true, data: report });
  } catch (error) { return next(error); }
}

async function listReports(req, res, next) {
  try {
    const student = await studentRepository.findByStudentId(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, error: "Student profile not found." });
    return res.json({ success: true, data: await reportRepository.findByStudent(student._id) });
  } catch (error) { return next(error); }
}

async function reviewReport(req, res, next) {
  try {
    const { reviewStatus, educatorSummary, errors } = req.body;
    const updates = { reviewStatus, educatorSummary };
    if (Array.isArray(errors)) updates.errors = errors;
    if (reviewStatus === "finalised") updates.finalisedAt = new Date();
    const report = await reportRepository.updateReview(req.params.reportId, updates);
    if (!report) return res.status(404).json({ success: false, error: "Report not found." });
    return res.json({ success: true, data: report });
  } catch (error) { return next(error); }
}

async function analyseReport(req, res, next) {
  try {
    const report = await reportRepository.findById(req.params.reportId);
    if (!report) return res.status(404).json({ success: false, error: "Report not found." });
    const chartData = report.chartData?.length ? report.chartData : buildErrorChartData(report.errorCounts);
    const openAiAnalysis = await analyseReportWithOpenAi({
      studentId: report.student.studentId,
      sourceText: report.writingSample.cleanedText || report.writingSample.ocrText,
      errors: report.errors,
      tokens: report.tokens,
      errorCounts: report.errorCounts,
      chartData,
    });
    const corrections = new Map(openAiAnalysis.corrections.map((correction) => [correction.errorId, correction]));
    const errors = report.errors.map((error) => {
      const correction = corrections.get(String(error._id));
      return {
        ...error,
        expectedCorrection: correction.expectedCorrection,
        correctionExplanation: correction.explanation,
        correctionSource: "openai",
      };
    });
    let updated;
    await mongoose.connection.transaction(async (session) => {
      updated = await reportRepository.saveOpenAiAnalysis(
        report._id,
        report.writingSample._id,
        errors,
        openAiAnalysis.correctedText,
        openAiAnalysis.recommendation,
        session
      );
      const writingSample = await writingSampleRepository.markAnalysed(report.writingSample._id, {
        expectedText: openAiAnalysis.correctedText,
        recommendedIntervention: formatRecommendation(openAiAnalysis.recommendation),
      }, session);
      if (!updated || !writingSample) throw new Error("Analysis could not be saved to both records.");
    });
    return res.json({ success: true, data: updated });
  } catch (error) { return next(error); }
}

async function downloadWritingSample(req, res, next) {
  try {
    const sample = await writingSampleRepository.findFileById(req.params.sampleId);
    if (!sample) return res.status(404).json({ success: false, error: "Writing sample not found." });
    if (!sample.fileData) return res.status(410).json({ success: false, error: "The stored file is not available for this writing sample." });
    res.setHeader("Content-Type", sample.mimeType);
    res.setHeader("Content-Length", String(sample.fileSize));
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(sample.originalName)}`);
    return res.send(sample.fileData);
  } catch (error) { return next(error); }
}

module.exports = { getReport, listReports, reviewReport, analyseReport, downloadWritingSample, formatRecommendation };
