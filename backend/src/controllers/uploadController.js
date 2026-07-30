// Import the OCR function.
// This function sends the uploaded PDF to Azure and gets back text.
const { extractTextFromPdf } = require("../services/ocrService");
const { cleanOcrText } = require("../services/textCleanService");
const { checkSpelling } = require("../services/spellCheckService");

// This function runs after Multer successfully saves the uploaded PDF.
const uploadAssignment = async (req, res) => {
  try {
    // If no file was uploaded, return an error.
    if (!req.file) {
      return res.status(400).json({
        error: "No PDF file uploaded",
      });
    }

    // Save basic information about the uploaded PDF.
    const uploadedFileInfo = {
      originalName: req.file.originalname,
      savedName: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      savedPath: req.file.path,
    };

    // Send the saved PDF to Azure OCR.
    // Azure will extract handwriting/printed text.
    const extractedText = await extractTextFromPdf(req.file.path);
    const cleanedText = cleanOcrText(extractedText);
    const spellingErrors = await checkSpelling(cleanedText);

    // Return upload info + extracted text.
    return res.status(201).json({
      message: "PDF uploaded and text extracted successfully",
      file: uploadedFileInfo,
      cleanedText: cleanedText,
      spellingErrors: spellingErrors,
    });
  } catch (error) {
    // If Azure or upload processing fails, show error details.
    return res.status(500).json({
      error: "Failed to upload PDF or extract text",
      details: error.message,
    });
  }
};

module.exports = {
  uploadAssignment,
};