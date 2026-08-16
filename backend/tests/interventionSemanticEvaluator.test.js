const {
  calculateBertScore,
  cosineSimilarity,
  evaluateBertScore,
  recommendationToText,
} = require("../src/utils/interventionSemanticEvaluator");

describe("BERT intervention recommendation evaluator", () => {
  test("calculates cosine similarity without assuming normalized vectors", () => {
    expect(cosineSimilarity([2, 0], [4, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  test("calculates token-level BERT precision, recall, and F1", () => {
    const score = calculateBertScore(
      [
        [1, 0],
        [0, 1],
      ],
      [[1, 0]]
    );

    expect(score.precision).toBeCloseTo(0.5);
    expect(score.recall).toBeCloseTo(1);
    expect(score.f1).toBeCloseTo(2 / 3);
  });

  test("selects the best educator reference and exposes an accuracy percentage", async () => {
    const embeddings = new Map([
      ["generated", [[1, 0]]],
      ["unrelated", [[0, 1]]],
      ["relevant", [[1, 0]]],
    ]);

    const result = await evaluateBertScore({
      candidate: "generated",
      references: ["unrelated", "relevant"],
      embedText: async (text) => embeddings.get(text),
    });

    expect(result.metric).toBe("BERTScore F1");
    expect(result.matchedReference).toBe("relevant");
    expect(result.f1).toBeCloseTo(1);
    expect(result.accuracyPercentage).toBe(100);
  });

  test("converts the complete intervention recommendation into evaluation text", () => {
    const text = recommendationToText({
      overview: "Spelling support is needed.",
      dominantPattern: "Spelling",
      interventions: [
        {
          title: "Word mapping",
          rationale: "Connect sounds and letters.",
          activities: ["Use sound boxes."],
          frequency: "Three times weekly.",
        },
      ],
      educatorCaution: "Review before use.",
    });

    expect(text).toContain("Word mapping");
    expect(text).toContain("Use sound boxes");
    expect(text).toContain("Review before use");
  });

  test("rejects an empty candidate or reference set", async () => {
    await expect(
      evaluateBertScore({ candidate: "", references: ["reference"] })
    ).rejects.toThrow("Candidate must be a non-empty string");

    await expect(
      evaluateBertScore({ candidate: "candidate", references: [] })
    ).rejects.toThrow("At least one reference is required");
  });
});
