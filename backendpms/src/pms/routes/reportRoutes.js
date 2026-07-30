const express = require("express");
const router = express.Router();
const {
	generateReport,
	getLatestReport,
	editReport,
} = require("../controllers/reportController");

router.post("/:studentId/generate", generateReport);
router.get("/:studentId/latest", getLatestReport);
router.put("/:reportId/edit", editReport);

module.exports = router;
