const fs = require("fs");
const { extractDocument } = require("./ocrService");
const { cleanOcrText } = require("./textCleanService");
const { checkSpelling } = require("./spellCheckService");
const { analyseEssay, countErrors } = require("./essayAnalysisService");
const { buildErrorChartData } = require("./chartService");
const studentRepository = require("../repositories/studentRepository");
const writingSampleRepository = require("../repositories/writingSampleRepository");
const reportRepository = require("../repositories/reportRepository");
const answerKeyRepository = require("../repositories/answerKeyRepository");

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
  const ocr = dependencies.extractDocument || (dependencies.extractText
    ? async (filePath) => ({ content: await dependencies.extractText(filePath), handwrittenText: "", tables: [] })
    : extractDocument);
  const spellCheck = dependencies.checkSpelling || checkSpelling;
  const readFile = dependencies.readFile || fs.promises.readFile;
  const answerKeys = dependencies.answerKeyRepository || answerKeyRepository;

  const student = await students.findByStudentId(input.studentId);
  if (!student) {
    const error = new Error("Student profile not found.");
    error.statusCode = 404;
    throw error;
  }

  let answerKey = null;
  let expectedText = input.expectedText || "";
  if (input.answerKeyId) {
    answerKey = await answerKeys.findById(input.answerKeyId);
    if (!answerKey) {
      const error = new Error("Answer key not found.");
      error.statusCode = 404;
      throw error;
    }
    expectedText = answerKey.expectedText;
  }

  const document = await ocr(input.file.buffer || input.file.path);
  const extractedText = document.content || "";
  const handwrittenText = cleanOcrText(document.handwrittenText || "");
  const cleanedText = handwrittenText || cleanOcrText(extractedText);
  if (!cleanedText) {
    const error = new Error("No readable text was found in the uploaded writing sample.");
    error.statusCode = 422;
    throw error;
  }

  const analysis = mergeDictionaryErrors(
    analyseEssay({ essayText: cleanedText, expectedText }),
    await spellCheck(cleanedText)
  );
  const chartData = buildErrorChartData(analysis.errorCounts);
  const ocrCompletedAt = new Date();
  const fileData = input.file.buffer || await readFile(input.file.path);
  const writingSample = await samples.create({
    student: student._id,
    answerKey: answerKey?._id || null,
    originalName: input.file.originalname,
    savedName: input.file.filename || "",
    savedPath: input.file.path || "",
    mimeType: input.file.mimetype,
    fileSize: input.file.size,
    fileData,
    ocrText: extractedText,
    handwrittenText,
    cleanedText,
    expectedText,
    status: "uploaded",
    ocrCompletedAt,
  });
  const report = await reports.create({
    student: student._id,
    writingSample: writingSample._id,
    answerKey: answerKey?._id || null,
    expectedText,
    tokens: analysis.tokens,
    sentences: analysis.sentences,
    errors: analysis.errors,
    summary: analysis.summary,
    errorCounts: analysis.errorCounts,
    chartData,
    analysedAt: new Date(),
  });
  const writingSampleResponse = writingSample.toObject ? writingSample.toObject() : { ...writingSample };
  delete writingSampleResponse.fileData;

  return {
    student: { id: student._id, studentId: student.studentId, name: student.name },
    writingSample: writingSampleResponse,
    report: report.toObject ? report.toObject() : report,
  };
}

module.exports = { processWritingSample, mergeDictionaryErrors };
