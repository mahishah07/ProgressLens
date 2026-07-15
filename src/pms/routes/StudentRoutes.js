const express = require("express");
const router = express.Router();
const {
	getStudents,
	getStudentById,
	createStudent,
	updateStudent,
	deleteStudent,
} = require("../controllers/studentController");

router.post(
	"/bulk",
	require("../controllers/studentController").bulkCreateStudents,
);
router.route("/").get(getStudents).post(createStudent);
router
	.route("/:id")
	.get(getStudentById)
	.put(updateStudent)
	.delete(deleteStudent);

module.exports = router;
