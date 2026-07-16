const express = require("express"); // Import Express, which helps us build the backend server
const multer = require("multer"); // Import Multer so we can recognise Multer upload errors
const uploadRoutes = require("./routes/uploadRoutes"); // Import our upload routes from uploadRoutes.js
const app = express(); // Create the Express app

app.use(express.json()); // Allow the backend to read JSON data if needed later

app.get("/", (req, res) => { // Create a simple homepage route to check if backend is working
  res.send("ProgressLens backend is running"); // Send this text when someone visits http://localhost:5000
});

app.get("/health", (req, res) => { // Create another simple test route
  res.json({ message: "Backend is healthy" }); // Send a JSON response to show backend is alive
});

app.use("/api/uploads", uploadRoutes); // Connect all upload routes under /api/uploads

app.use((err, req, res, next) => { // This catches errors from Multer or other backend code
  if (err instanceof multer.MulterError) { // Check if the error came from Multer
    return res.status(400).json({ error: err.message }); // Send Multer error back to the user
  }

  if (err.message) { // Check if the error has a readable message
    return res.status(400).json({ error: err.message }); // Send that error message back to the user
  }

  return res.status(500).json({ error: "Something went wrong" }); // Send a general error if we do not know what happened
});

module.exports = app; // Export the app so server.js can use it