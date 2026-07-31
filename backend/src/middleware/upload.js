const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadFolder = path.join(process.cwd(), "uploads", "assignments");
fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadFolder),
  filename: (req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const allowedFiles = new Map([
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".tif", "image/tiff"],
  [".tiff", "image/tiff"],
  [".bmp", "image/bmp"],
]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedFiles.get(extension) === file.mimetype) return callback(null, true);
    const error = new Error("Only PDF, PNG, JPEG, TIFF, and BMP writing samples are allowed.");
    error.statusCode = 415;
    return callback(error);
  },
});

module.exports = upload;
