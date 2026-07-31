const express = require("express");
const { analyseEssayController } = require("../controllers/analysisController");

const router = express.Router();

router.post(["/analyse", "/analyze"], analyseEssayController);

module.exports = router;
