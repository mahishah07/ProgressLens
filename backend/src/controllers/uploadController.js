const { processWritingSample } = require("../services/reportPipelineService");

async function uploadAssignment(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No writing sample uploaded." });
    if (typeof req.body.studentId !== "string" || !req.body.studentId.trim()) {
      return res.status(400).json({ success: false, error: "studentId is required." });
    }
    const result = await processWritingSample({
      studentId: req.body.studentId.trim(),
      expectedText: req.body.expectedText || "",
      file: req.file,
    });
    return res.status(201).json({ success: true, message: "Writing sample uploaded, scanned, analysed, and saved.", data: result });
  } catch (error) {
    return next(error);
  }
}

module.exports = { uploadAssignment };
