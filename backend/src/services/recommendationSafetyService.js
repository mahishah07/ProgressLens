const prohibitedPatterns = [
  /\bdiagnos(?:e|ed|es|is)\b/i,
  /\bhas dyslexia\b/i,
  /\bhas adhd\b/i,
  /\bmedication\b/i,
  /\bprescribe(?:d|s)?\b/i,
  /\bdefinitely has\b/i,
];

function validateRecommendationSafety(
  recommendation,
  privateValues = []
) {
  const text = JSON.stringify(
    recommendation
  );

  const prohibitedMatch =
    prohibitedPatterns.find((pattern) =>
      pattern.test(text)
    );

  if (prohibitedMatch) {
    return {
      safe: false,
      reason:
        "The recommendation contains prohibited diagnostic or medical language.",
    };
  }

  const normalisedText = text.toLowerCase();

  const leakedValue = privateValues.find(
    (value) =>
      value &&
      normalisedText.includes(
        String(value).toLowerCase()
      )
  );

  if (leakedValue) {
    return {
      safe: false,
      reason:
        "Private student data was included.",
    };
  }

  return {
    safe: true,
    reason: "",
  };
}

module.exports = {
  validateRecommendationSafety,
  prohibitedPatterns,
};