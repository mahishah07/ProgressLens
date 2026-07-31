const express = require("express");
const upload = require("../middleware/upload");
const { uploadAssignment } = require("../controllers/uploadController");

const router = express.Router();
router.post("/writing-sample", upload.single("assignment"), uploadAssignment);

module.exports = router;
