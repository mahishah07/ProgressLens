const express = require("express");
const { getReport, listReports, reviewReport, analyseReport, downloadWritingSample } = require("../controllers/reportController");

const router = express.Router();
router.get("/reports/:reportId", getReport);
router.get("/error/:reportId/dashboard", getReport);
router.patch("/reports/:reportId/review", reviewReport);
router.post(["/reports/:reportId/analyse", "/reports/:reportId/analyze", "/error/:reportId/analyze"], analyseReport);
router.get("/students/:studentId/reports", listReports);
router.get("/writing-samples/:sampleId/file", downloadWritingSample);

module.exports = router;
