const { processWritingSample } = require("../services/reportPipelineService");
const { processAnswerKey } = require("../services/answerKeyService");
const answerKeyRepository = require("../repositories/answerKeyRepository");

async function uploadAssignment(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No writing sample uploaded." });
    if (typeof req.body.studentId !== "string" || !req.body.studentId.trim()) {
      return res.status(400).json({ success: false, error: "studentId is required." });
    }
    const result = await processWritingSample({
      studentId: req.body.studentId.trim(),
      answerKeyId: req.body.answerKeyId || "",
      expectedText: req.body.expectedText || "",
      file: req.file,
    });
    return res.status(201).json({ success: true, message: "Writing sample uploaded, scanned, and saved. It is ready for analysis.", data: result });
  } catch (error) {
    return next(error);
  }
}

async function uploadAnswerKey(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No answer key uploaded." });
    const result = await processAnswerKey({ title: String(req.body.title || "").trim(), file: req.file });
    return res.status(201).json({ success: true, message: "Answer key uploaded, scanned, and saved.", data: result });
  } catch (error) { return next(error); }
}

async function downloadAnswerKey(req, res, next) {
  try {
    const answerKey = await answerKeyRepository.findFileById(req.params.answerKeyId);
    if (!answerKey) return res.status(404).json({ success: false, error: "Answer key not found." });
    res.setHeader("Content-Type", answerKey.mimeType);
    res.setHeader("Content-Length", String(answerKey.fileSize));
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(answerKey.originalName)}`);
    return res.send(answerKey.fileData);
  } catch (error) { return next(error); }
}

module.exports = { uploadAssignment, uploadAnswerKey, downloadAnswerKey };
