const express = require("express");
const router = express.Router();
const {
	getStudentOverview,
	getProgressDashboard,
	searchStudents,
} = require("../controllers/progressController");

router.get("/search", searchStudents);
router.get("/:studentId/overview", getStudentOverview);
router.get("/:studentId/dashboard", getProgressDashboard);

module.exports = router;
