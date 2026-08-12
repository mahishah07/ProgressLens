const express = require("express");
const router = express.Router();
const { generateRecommendations } = require("../controllers/aiController");

router.post("/:studentId/recommendations", generateRecommendations);
const { getDashboardSummary } = require("../controllers/aiController");
router.get("/:studentId/dashboard-summary", getDashboardSummary);

module.exports = router;
