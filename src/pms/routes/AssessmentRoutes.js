const express = require("express");
const router = express.Router();
const {
	getAssessments,
	getAssessmentById,
	createAssessment,
	updateAssessment,
	deleteAssessment,
	getStudentProgress,
} = require("../controllers/assessmentController");

router.route("/").get(getAssessments).post(createAssessment);
router.get("/student/:studentId/progress", getStudentProgress);
router
	.route("/:id")
	.get(getAssessmentById)
	.put(updateAssessment)
	.delete(deleteAssessment);

module.exports = router;
