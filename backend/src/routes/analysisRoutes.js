const express = require("express");
const { analyseEssayController } = require("../controllers/analysisController");

const router = express.Router();

// POST /api/analyse
router.post("/analyse", analyseEssayController);

module.exports = router;