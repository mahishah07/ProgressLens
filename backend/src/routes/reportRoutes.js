const express = require("express");
const { getReport, listReports, reviewReport, analyseReport } = require("../controllers/reportController");

const router = express.Router();
router.get("/reports/:reportId", getReport);
router.patch("/reports/:reportId/review", reviewReport);
router.post("/reports/:reportId/analyse", analyseReport);
router.get("/students/:studentId/reports", listReports);

module.exports = router;
