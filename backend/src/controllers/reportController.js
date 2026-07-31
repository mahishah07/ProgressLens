const studentRepository = require("../repositories/studentRepository");
const reportRepository = require("../repositories/reportRepository");
const { buildErrorChartData } = require("../services/chartService");
const { analyseReportWithOpenAi } = require("../services/interventionRecommendationService");

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
    const updated = await reportRepository.saveOpenAiAnalysis(
      report._id,
      report.writingSample._id,
      errors,
      openAiAnalysis.recommendation
    );
    return res.json({ success: true, data: updated });
  } catch (error) { return next(error); }
}

module.exports = { getReport, listReports, reviewReport, analyseReport };
