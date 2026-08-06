const path = require("path");
const multer = require("multer");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedFiles = new Map([
  [".pdf", new Set(["application/pdf"])],
  [".jpg", new Set(["image/jpeg"])],
  [".jpeg", new Set(["image/jpeg"])],
  [".png", new Set(["image/png"])],
  [".tif", new Set(["image/tiff"])],
  [".tiff", new Set(["image/tiff"])],
  [".bmp", new Set(["image/bmp"])],
  [".txt", new Set(["text/plain"])],
  [
    ".docx",
    new Set([
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
  ],
]);

const upload = multer({
  storage: multer.memoryStorage(),

  // Extra byte lets an exact 10 MB file complete.
  limits: {
    fileSize: MAX_FILE_SIZE + 1,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    const extension = path.extname(
      file.originalname
    ).toLowerCase();

    const allowedMimeTypes = allowedFiles.get(extension);

    if (allowedMimeTypes?.has(file.mimetype)) {
      return callback(null, true);
    }

    const error = new Error(
      "Only PDF, DOCX, TXT, PNG, JPEG, TIFF, and BMP files are allowed."
    );

    error.statusCode = 415;
    return callback(error);
  },
});

function enforceFileSizeLimit(req, res, next) {
  if (req.file && req.file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: "File must not exceed 10 MB.",
    });
  }

  return next();
}

module.exports = upload;
module.exports.enforceFileSizeLimit = enforceFileSizeLimit;
module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
module.exports.allowedFiles = allowedFiles;