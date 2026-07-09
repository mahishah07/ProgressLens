const { analyseEssay } = require("../services/essayAnalysisService");

function analyseEssayController(req, res) {
  const { essayText, expectedText } = req.body;

  if (typeof essayText !== "string" || essayText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "essayText is required and must be a non-empty string.",
    });
  }

  const result = analyseEssay({
    essayText,
    expectedText,
  });

  return res.status(200).json({
    success: true,
    data: result,
  });
}

module.exports = {
  analyseEssayController,
};