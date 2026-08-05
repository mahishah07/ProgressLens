const express = require("express");
const upload = require("../middleware/upload");
const { uploadAssignment, uploadAnswerKey, downloadAnswerKey } = require("../controllers/uploadController");

const router = express.Router();
router.post("/writing-sample", upload.single("assignment"), uploadAssignment);
router.post("/answer-key", upload.single("answerKey"), uploadAnswerKey);
router.get("/answer-keys/:answerKeyId/file", downloadAnswerKey);

module.exports = router;
