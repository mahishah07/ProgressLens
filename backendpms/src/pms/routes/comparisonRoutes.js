const express = require("express");
const router = express.Router();
const { compareAssessments } = require("../controllers/comparisonController");

router.get("/:studentId", compareAssessments);

module.exports = router;
