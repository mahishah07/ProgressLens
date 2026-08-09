const {
  analyseEssay,
  buildDiffOperations,
  countErrors,
  detectComparisonErrors,
  isLikelyLetterReversal,
  isLikelyPhoneticError,
  mergeComparisonErrors,
  mergeGrammarErrors,
} = require("../src/services/essayAnalysisService");

describe("EPA classifier boundaries and invariants", () => {
  test.each([
    ["", "", []],
    ["the", "the", [{ type: "MATCH", expectedIndex: 0, actualIndex: 0 }]],
    ["the dog", "the", [{ type: "MATCH" }, { type: "DELETION", expected: "dog" }]],
    ["the", "the dog", [{ type: "MATCH" }, { type: "INSERTION", actual: "dog" }]],
  ])("buildDiffOperations handles token boundary %#", (expected, actual, expectedShape) => {
    const operations = buildDiffOperations(expected ? expected.split(" ") : [], actual ? actual.split(" ") : []);
    expect(operations).toHaveLength(expectedShape.length);
    expectedShape.forEach((shape, index) => expect(operations[index]).toMatchObject(shape));
  });

  test.each([
    ["dog", "bog", true],
    ["pad", "qad", true],
    ["dog", "dig", false],
    ["dog", "dog", false],
    ["dog", "do", false],
  ])("letter reversal classifier: %s/%s => %s", (expected, actual, result) => {
    expect(isLikelyLetterReversal(expected, actual)).toBe(result);
  });

  test.each([
    ["night", "nite", true],
    ["phone", "fone", true],
    ["dog", "cat", false],
    ["same", "same", false],
    ["", "word", false],
  ])("phonetic classifier: %s/%s => %s", (expected, actual, result) => {
    expect(isLikelyPhoneticError(expected, actual)).toBe(result);
  });

  test.each([
    ["gone", "gon", "DELETION", "Deletion"],
    ["dog", "dogg", "INSERTION", "Insertion"],
    ["dog", "bog", "LETTER_REVERSAL", "Letter reversal"],
    ["night", "nite", "PHONETIC_ERROR", "Phonetic"],
    ["apple", "axple", "SPELLING_ERROR", "Spelling"],
  ])("uses the highest-priority applicable category for %s/%s", (expected, actual, type, category) => {
    expect(detectComparisonErrors(expected, actual)).toEqual([
      expect.objectContaining({ type, category, expected, actual }),
    ]);
  });

  test("separates tense, capitalisation, and other grammar counts", () => {
    let errors = detectComparisonErrors("The dog runs", "the dog runs");
    errors = mergeGrammarErrors(errors, [
      { category: "Tense", actual: "go", expectedCorrection: "went", explanation: "Past tense is required.", actualIndex: 3 },
      { category: "Grammar", actual: "a", expectedCorrection: "an", explanation: "Use the correct article.", actualIndex: 4 },
    ], ["the", "dog", "runs", "go", "a"]);

    expect(countErrors(errors)).toMatchObject({
      tense: 1,
      capitalisation: 1,
      grammar: 1,
      total: 3,
    });
  });

  test("infers tense for backward-compatible OpenAI findings without a category", () => {
    const errors = mergeGrammarErrors([], [{
      actual: "go",
      expectedCorrection: "went",
      explanation: "Past tense is required.",
      actualIndex: 1,
    }], ["i", "go"]);
    expect(errors[0]).toMatchObject({ type: "TENSE_ERROR", category: "Tense" });
  });

  test("preserves an existing Mongo error ID when comparison improves its category", () => {
    const merged = mergeComparisonErrors([
      { _id: "mongo-error-id", type: "SPELLING_ERROR", category: "Spelling", actual: "gon", actualIndex: 1 },
    ], detectComparisonErrors("had gone", "had gon"));
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ _id: "mongo-error-id", type: "DELETION", expectedCorrection: "gone" });
  });

  test("keeps count and summary invariants for mixed errors", () => {
    const result = analyseEssay({
      essayText: "the bog went nite nite",
      expectedText: "The dog went night",
    });
    expect(result.errorCounts.total).toBe(result.errors.length);
    expect(result.summary.errorCount).toBe(result.errors.length);
    expect(Object.values(result.errorCounts).every(Number.isFinite)).toBe(true);
    expect(Object.values(result.errorCounts).every((value) => value >= 0)).toBe(true);
  });
});
