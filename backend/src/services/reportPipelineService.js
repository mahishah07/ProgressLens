const { extractTextFromPdf } = require("./ocrService");
const { cleanOcrText } = require("./textCleanService");
const { checkSpelling } = require("./spellCheckService");
const { analyseEssay, countErrors } = require("./essayAnalysisService");
const { buildErrorChartData } = require("./chartService");
const studentRepository = require("../repositories/studentRepository");
const writingSampleRepository = require("../repositories/writingSampleRepository");
const reportRepository = require("../repositories/reportRepository");

function mergeDictionaryErrors(analysis, spellingErrors) {
  const errors = [...analysis.errors];
  for (const spellingError of spellingErrors) {
    const actual = spellingError.word.toLowerCase();
    const tokenIndex = analysis.tokens.findIndex((token) => token === actual);
    const duplicate = errors.some((error) => error.actual === actual && error.actualIndex === tokenIndex);
    if (!duplicate) {
      errors.push({
        type: "SPELLING_ERROR",
        category: "Spelling",
        message: `"${spellingError.word}" may be a spelling error.`,
        actual,
        suggestion: spellingError.suggestions[0] || null,
        suggestions: spellingError.suggestions,
        tokenIndex,
        actualIndex: tokenIndex,
      });
    }
  }
  return { ...analysis, errors, errorCounts: countErrors(errors), summary: { ...analysis.summary, errorCount: errors.length } };
}

async function processWritingSample(input, dependencies = {}) {
  const students = dependencies.studentRepository || studentRepository;
  const samples = dependencies.writingSampleRepository || writingSampleRepository;
  const reports = dependencies.reportRepository || reportRepository;
  const ocr = dependencies.extractText || extractTextFromPdf;
  const spellCheck = dependencies.checkSpelling || checkSpelling;

  const student = await students.findByStudentId(input.studentId);
  if (!student) {
    const error = new Error("Student profile not found.");
    error.statusCode = 404;
    throw error;
  }

  const extractedText = await ocr(input.file.path);
  const cleanedText = cleanOcrText(extractedText);
  if (!cleanedText) {
    const error = new Error("No readable text was found in the uploaded writing sample.");
    error.statusCode = 422;
    throw error;
  }

  const analysis = mergeDictionaryErrors(
    analyseEssay({ essayText: cleanedText, expectedText: input.expectedText }),
    await spellCheck(cleanedText)
  );
  const chartData = buildErrorChartData(analysis.errorCounts);
  const ocrCompletedAt = new Date();
  const writingSample = await samples.create({
    student: student._id,
    originalName: input.file.originalname,
    savedName: input.file.filename,
    savedPath: input.file.path,
    mimeType: input.file.mimetype,
    fileSize: input.file.size,
    ocrText: extractedText,
    cleanedText,
    status: "uploaded",
    ocrCompletedAt,
  });
  const report = await reports.create({
    student: student._id,
    writingSample: writingSample._id,
    expectedText: input.expectedText || "",
    tokens: analysis.tokens,
    sentences: analysis.sentences,
    errors: analysis.errors,
    summary: analysis.summary,
    errorCounts: analysis.errorCounts,
    chartData,
    analysedAt: new Date(),
  });
  await samples.markAnalysed(writingSample._id);

  return {
    student: { id: student._id, studentId: student.studentId, name: student.name },
    writingSample: writingSample.toObject ? writingSample.toObject() : writingSample,
    report: report.toObject ? report.toObject() : report,
  };
}

module.exports = { processWritingSample, mergeDictionaryErrors };
