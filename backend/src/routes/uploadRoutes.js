const express = require("express"); // Import Express so we can create routes

const upload = require("../middleware/upload"); // Import the Multer upload setup

const { uploadAssignment } = require("../controllers/uploadController"); // Import the upload controller function

const router = express.Router(); // Create an Express router

router.post("/assignment", upload.single("assignment"), uploadAssignment); // Create POST /api/uploads/assignment route

module.exports = router; // Export the router so app.js can connect it