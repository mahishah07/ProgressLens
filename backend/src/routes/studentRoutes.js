const express = require("express");
const { createStudent, findStudent } = require("../controllers/studentController");

const router = express.Router();
router.post("/students", createStudent);
router.get("/students", findStudent);

module.exports = router;
