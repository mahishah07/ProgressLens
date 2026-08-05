const fs = require("fs");
const { extractDocument } = require("./ocrService");
const { cleanOcrText } = require("./textCleanService");
const answerKeyRepository = require("../repositories/answerKeyRepository");

function extractAnswers(tables) {
  for (const table of tables || []) {
    const header = table.cells.find((cell) => /actual\s*answer/i.test(cell.content || ""));
    if (!header) continue;
    const answers = table.cells
      .filter((cell) => cell.columnIndex === header.columnIndex && cell.rowIndex > header.rowIndex)
      .sort((a, b) => a.rowIndex - b.rowIndex)
      .map((cell) => cleanOcrText(cell.content))
      .filter(Boolean);
    if (answers.length) return answers;
  }
  return [];
}

async function processAnswerKey({ title, file }, dependencies = {}) {
  const analyseDocument = dependencies.extractDocument || extractDocument;
  const repository = dependencies.answerKeyRepository || answerKeyRepository;
  const readFile = dependencies.readFile || fs.promises.readFile;
  const document = await analyseDocument(file.buffer || file.path);
  const ocrText = cleanOcrText(document.content);
  const answers = extractAnswers(document.tables);
  const expectedText = answers.join(" ") || ocrText;
  if (!expectedText) {
    const error = new Error("No expected answers were found in the uploaded answer key.");
    error.statusCode = 422;
    throw error;
  }
  const answerKey = await repository.create({
    title: title || file.originalname,
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    fileData: file.buffer || await readFile(file.path),
    ocrText,
    expectedText,
    answers,
    ocrCompletedAt: new Date(),
  });
  const response = answerKey.toObject ? answerKey.toObject() : { ...answerKey };
  delete response.fileData;
  return response;
}

module.exports = { processAnswerKey, extractAnswers };
