const multer = require("multer"); // Import Multer so we can handle file uploads

const path = require("path"); // Import path so we can safely create folder/file paths

const fs = require("fs"); // Import fs so we can check and create folders

const uploadFolder = path.join(process.cwd(), "uploads", "assignments"); // Decide where uploaded PDFs will be stored

if (!fs.existsSync(uploadFolder)) { // Check if the uploads/assignments folder does not exist
  fs.mkdirSync(uploadFolder, { recursive: true }); // Create the folder if it does not exist
}

const storage = multer.diskStorage({ // Tell Multer to store files on disk, not just memory
  destination: (req, file, cb) => { // Decide which folder the uploaded file should go into
    cb(null, uploadFolder); // Save the uploaded file inside uploads/assignments
  },

  filename: (req, file, cb) => { // Decide what name the uploaded file should have
    const safeName = file.originalname.replace(/\s+/g, "_"); // Replace spaces in original filename with underscores
    const finalName = `${Date.now()}-${safeName}`; // Add current timestamp so filenames do not clash
    cb(null, finalName); // Tell Multer to use this final filename
  },
});

const fileFilter = (req, file, cb) => { // This function checks whether the uploaded file is allowed
  const isPdfMimeType = file.mimetype === "application/pdf"; // Check if the file says it is a PDF
  const isPdfExtension = path.extname(file.originalname).toLowerCase() === ".pdf"; // Check if the filename ends with .pdf

  if (isPdfMimeType && isPdfExtension) { // Only accept the file if both checks say PDF
    cb(null, true); // Accept the file
  } else { // If the file is not a PDF
    cb(new Error("Only PDF files are allowed")); // Reject the file with this error message
  }
};

const upload = multer({ // Create the final Multer upload middleware
  storage: storage, // Use the disk storage settings above
  fileFilter: fileFilter, // Use the PDF-only checker above
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

module.exports = upload; // Export upload so routes can use it