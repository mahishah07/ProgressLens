const {
  validateRecommendationSafety,
} = require(
  "../src/services/recommendationSafetyService"
);

function createValidRecommendation(
  overrides = {}
) {
  return {
    overview:
      "Practise spelling and word recognition.",
    dominantPattern: "Spelling",
    interventions: [
      {
        title: "Word mapping",
        rationale:
          "Reinforces sound and letter patterns.",
        activities: [
          "Map sounds to letters",
        ],
        frequency: "3 times/week",
      },
    ],
    educatorCaution:
      "The educator should review this recommendation.",
    ...overrides,
  };
}

describe("Recommendation safety validator", () => {
  test.each([
    "The student has dyslexia.",
    "The student has ADHD.",
    "This definitely diagnoses a learning disorder.",
    "The student is diagnosed with a disorder.",
    "Medication should be considered.",
    "A professional should prescribe medication.",
    "The student definitely has a disorder.",
  ])(
    "rejects unsafe recommendation: %s",
    (overview) => {
      const recommendation =
        createValidRecommendation({
          overview,
        });

      const result =
        validateRecommendationSafety(
          recommendation
        );

      expect(result).toEqual({
        safe: false,
        reason:
          "The recommendation contains prohibited diagnostic or medical language.",
      });
    }
  );

  test("rejects a raw student ID in the recommendation", () => {
    const recommendation =
      createValidRecommendation({
        overview:
          "Create a spelling plan for student DAS-001.",
      });

    const result =
      validateRecommendationSafety(
        recommendation,
        ["DAS-001", "Sarah Tan"]
      );

    expect(result).toEqual({
      safe: false,
      reason:
        "Private student data was included.",
    });
  });

  test("rejects a student name regardless of capitalisation", () => {
    const recommendation =
      createValidRecommendation({
        overview:
          "Create a plan for sarah tan.",
      });

    const result =
      validateRecommendationSafety(
        recommendation,
        ["DAS-001", "Sarah Tan"]
      );

    expect(result.safe).toBe(false);
    expect(result.reason).toBe(
      "Private student data was included."
    );
  });

  test("accepts a safe educational recommendation", () => {
    const recommendation =
      createValidRecommendation();

    const result =
      validateRecommendationSafety(
        recommendation,
        ["DAS-001", "Sarah Tan"]
      );

    expect(result).toEqual({
      safe: true,
      reason: "",
    });
  });

  test("does not treat ordinary educational caution as medical advice", () => {
    const recommendation =
      createValidRecommendation({
        educatorCaution:
          "Review this strategy alongside classroom evidence.",
      });

    const result =
      validateRecommendationSafety(
        recommendation,
        ["DAS-001", "Sarah Tan"]
      );

    expect(result.safe).toBe(true);
  });

  test.each([
    "",
    null,
    undefined,
  ])(
    "ignores empty private values: %s",
    (privateValue) => {
      const recommendation =
        createValidRecommendation();

      const result =
        validateRecommendationSafety(
          recommendation,
          [privateValue]
        );

      expect(result.safe).toBe(true);
    }
  );
});