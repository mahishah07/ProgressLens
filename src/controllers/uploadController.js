const uploadAssignment = (req, res) => { // Create a function to handle uploaded assignments
  if (!req.file) { // Check if no file was uploaded
    return res.status(400).json({ error: "No PDF file uploaded" }); // Send error if file is missing
  }

  const uploadedFileInfo = { // Create a simple object with information about the uploaded file
    originalName: req.file.originalname, // Store the original filename from the user's computer
    savedName: req.file.filename, // Store the new filename saved in our backend
    fileType: req.file.mimetype, // Store the file type, should be application/pdf
    fileSize: req.file.size, // Store the file size in bytes
    savedPath: req.file.path, // Store the location where the file was saved
  };

  return res.status(201).json({ // Send success response
    message: "PDF uploaded successfully", // Message to show upload worked
    file: uploadedFileInfo, // Send back the uploaded file information
  });
};

module.exports = { uploadAssignment }; // Export this function so uploadRoutes.js can use it