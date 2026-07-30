const express = require("express");
const router = express.Router();
const { generateRecommendations } = require("../controllers/aiController");

router.post("/:studentId/recommendations", generateRecommendations);

module.exports = router;
