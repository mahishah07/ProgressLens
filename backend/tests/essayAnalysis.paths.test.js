const {
  detectComparisonErrors,
  isLikelyLetterReversal,
  isLikelyPhoneticError,
  mergeComparisonErrors,
  mergeGrammarErrors,
  countErrors,
} = require("../src/services/essayAnalysisService");

describe("EC-011 - comparison alignment paths", () => {
  test("handles two empty strings", () => {
    const errors = detectComparisonErrors("", "");

    expect(errors).toEqual([]);
  });

  test("handles identical text without producing errors", () => {
    const errors = detectComparisonErrors(
      "the dog ran home",
      "the dog ran home"
    );

    expect(errors).toEqual([]);
  });

  test("detects an inserted word at the beginning", () => {
    const errors = detectComparisonErrors(
      "dog ran home",
      "the dog ran home"
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "INSERTION",
          actual: "the",
        }),
      ])
    );
  });

  test("detects an inserted word at the end", () => {
    const errors = detectComparisonErrors(
      "the dog ran",
      "the dog ran home"
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "INSERTION",
          actual: "home",
        }),
      ])
    );
  });

  test("detects a deleted word at the beginning", () => {
    const errors = detectComparisonErrors(
      "the dog ran home",
      "dog ran home"
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "DELETION",
          expected: "the",
        }),
      ])
    );
  });

  test("detects a deleted word at the end", () => {
    const errors = detectComparisonErrors(
      "the dog ran home",
      "the dog ran"
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "DELETION",
          expected: "home",
        }),
      ])
    );
  });

  test("detects an insertion between matching words", () => {
    const errors = detectComparisonErrors(
      "the dog ran home",
      "the big dog ran home"
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "INSERTION",
          actual: "big",
        }),
      ])
    );
  });

  test("detects a deletion between matching words", () => {
    const errors = detectComparisonErrors(
      "the big dog ran home",
      "the dog ran home"
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "DELETION",
          expected: "big",
        }),
      ])
    );
  });

  test("handles errors in more than one location", () => {
    const errors = detectComparisonErrors(
      "the dog ran home today",
      "the bog ran today"
    );

    expect(errors.length).toBeGreaterThanOrEqual(2);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actual: "bog",
          expected: "dog",
        }),
        expect.objectContaining({
          type: "DELETION",
          expected: "home",
        }),
      ])
    );
  });

  test("handles repeated neighbouring words without losing alignment", () => {
    const errors = detectComparisonErrors(
      "the dog ran home",
      "the dog dog ran home"
    );

    expect(
      errors.filter(
        (error) => error.type === "INSERTION"
      )
    ).toHaveLength(1);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "INSERTION",
          actual: "dog",
        }),
      ])
    );
  });
});

describe("EC-012 - error classification precedence", () => {
  test("classifies dog to bog as a letter reversal instead of generic spelling", () => {
    expect(
      isLikelyLetterReversal("dog", "bog")
    ).toBe(true);

    const errors = detectComparisonErrors(
      "the dog ran",
      "the bog ran"
    );

    expect(errors).toHaveLength(1);

    expect(errors[0]).toMatchObject({
      type: "LETTER_REVERSAL",
      category: "Letter reversal",
      expected: "dog",
      actual: "bog",
    });

    expect(errors[0].type).not.toBe(
      "SPELLING_ERROR"
    );
  });

  test("classifies night to nite as phonetic instead of generic spelling", () => {
    expect(
      isLikelyPhoneticError("night", "nite")
    ).toBe(true);

    const errors = detectComparisonErrors(
      "good night",
      "good nite"
    );

    expect(errors).toHaveLength(1);

    expect(errors[0]).toMatchObject({
      type: "PHONETIC_ERROR",
      category: "Phonetic",
      expected: "night",
      actual: "nite",
    });

    expect(errors[0].type).not.toBe(
      "SPELLING_ERROR"
    );
  });

  test("classifies a missing letter as deletion instead of spelling", () => {
    const errors = detectComparisonErrors(
      "had gone missing",
      "had gon missing"
    );

    expect(errors).toHaveLength(1);

    expect(errors[0]).toMatchObject({
      type: "DELETION",
      expected: "gone",
      actual: "gon",
    });

    expect(errors[0].type).not.toBe(
      "SPELLING_ERROR"
    );
  });

  test("classifies an extra letter as insertion instead of spelling", () => {
    const errors = detectComparisonErrors(
      "the dog ran",
      "the dogg ran"
    );

    expect(errors).toHaveLength(1);

    expect(errors[0]).toMatchObject({
      type: "INSERTION",
      expected: "dog",
      actual: "dogg",
    });

    expect(errors[0].type).not.toBe(
      "SPELLING_ERROR"
    );
  });

  test("uses spelling as fallback for an unclassified substitution", () => {
    const errors = detectComparisonErrors(
      "the apple fell",
      "the axple fell"
    );

    expect(errors).toHaveLength(1);

    expect(errors[0]).toMatchObject({
      type: "SPELLING_ERROR",
      category: "Spelling",
      expected: "apple",
      actual: "axple",
    });
  });
});

describe("EC-013 - duplicate error prevention", () => {
  test("does not add the same logical comparison error twice", () => {
    const existing = [
      {
        _id: "error-1",
        type: "SPELLING_ERROR",
        category: "Spelling",
        actual: "bog",
        actualIndex: 1,
        expectedCorrection: "dog",
      },
    ];

    const comparison =
      detectComparisonErrors(
        "the dog ran",
        "the bog ran"
      );

    const firstMerge =
      mergeComparisonErrors(
        existing,
        comparison
      );

    const secondMerge =
      mergeComparisonErrors(
        firstMerge,
        comparison
      );

    expect(secondMerge).toHaveLength(1);

    expect(
      secondMerge.filter(
        (error) =>
          error.actual === "bog"
      )
    ).toHaveLength(1);
  });

  test("keeps genuinely different errors", () => {
    const existing = [
      {
        _id: "error-1",
        type: "SPELLING_ERROR",
        category: "Spelling",
        actual: "bog",
        actualIndex: 1,
      },
    ];

    const comparison =
      detectComparisonErrors(
        "the dog went night",
        "the bog went nite"
      );

    const merged =
      mergeComparisonErrors(
        existing,
        comparison
      );

    expect(
      merged.some(
        (error) =>
          error.actual === "bog"
      )
    ).toBe(true);

    expect(
      merged.some(
        (error) =>
          error.actual === "nite"
      )
    ).toBe(true);

    expect(merged.length).toBeGreaterThanOrEqual(
      2
    );
  });

  test("countErrors remains consistent after merging", () => {
    const existing = [
      {
        _id: "error-1",
        type: "SPELLING_ERROR",
        category: "Spelling",
        actual: "bog",
        actualIndex: 1,
      },
    ];

    const comparison =
      detectComparisonErrors(
        "the dog went night",
        "the bog went nite"
      );

    const merged =
      mergeComparisonErrors(
        existing,
        comparison
      );

    const counts =
      countErrors(merged);

    expect(counts.total).toBe(
      merged.length
    );
  });
});

describe("EC-014 - persisted error ID preservation", () => {
  test("preserves Mongo ID when spelling error becomes letter reversal", () => {
    const existing = [
      {
        _id: "mongo-error-id",
        type: "SPELLING_ERROR",
        category: "Spelling",
        actual: "bog",
        actualIndex: 1,
      },
    ];

    const comparison =
      detectComparisonErrors(
        "the dog ran",
        "the bog ran"
      );

    const merged =
      mergeComparisonErrors(
        existing,
        comparison
      );

    expect(merged).toHaveLength(1);

    expect(merged[0]).toMatchObject({
      _id: "mongo-error-id",
      type: "LETTER_REVERSAL",
      category: "Letter reversal",
      actual: "bog",
    });
  });

  test("preserves Mongo ID when spelling error becomes phonetic", () => {
    const existing = [
      {
        _id: "mongo-error-id",
        type: "SPELLING_ERROR",
        category: "Spelling",
        actual: "nite",
        actualIndex: 1,
      },
    ];

    const comparison =
      detectComparisonErrors(
        "good night today",
        "good nite today"
      );

    const merged =
      mergeComparisonErrors(
        existing,
        comparison
      );

    const error =
      merged.find(
        (item) =>
          item.actual === "nite"
      );

    expect(error).toMatchObject({
      _id: "mongo-error-id",
      type: "PHONETIC_ERROR",
      category: "Phonetic",
    });
  });
});

describe("EC-015 - grammar error merging paths", () => {
  test("adds a new tense error at the supplied token index", () => {
    const merged =
      mergeGrammarErrors(
        [],
        [
          {
            actual: "go",
            expectedCorrection: "went",
            explanation:
              "Past tense is required.",
            actualIndex: 1,
          },
        ],
        ["i", "go", "yesterday"]
      );

    expect(merged).toHaveLength(1);

    expect(merged[0]).toMatchObject({
      type: "TENSE_ERROR",
      category: "Tense",
      actual: "go",
      expectedCorrection: "went",
      actualIndex: 1,
    });
  });

  test("recovers the token location when the supplied grammar index is wrong", () => {
    const merged =
      mergeGrammarErrors(
        [],
        [
          {
            actual: "go",
            expectedCorrection: "went",
            explanation:
              "Past tense is required.",
            actualIndex: 99,
          },
        ],
        ["i", "go", "yesterday"]
      );

    const error =
      merged.find(
        (item) =>
          item.actual === "go"
      );

    expect(error).toBeDefined();

    expect(error.actualIndex).toBe(1);

    expect(error).toMatchObject({
      type: "TENSE_ERROR",
      expectedCorrection: "went",
    });
  });

  test("does not duplicate an existing error when grammar refers to the same token", () => {
    const existing = [
      {
        _id: "existing-error",
        type: "SPELLING_ERROR",
        category: "Spelling",
        actual: "go",
        actualIndex: 1,
      },
    ];

    const merged =
      mergeGrammarErrors(
        existing,
        [
          {
            actual: "go",
            expectedCorrection: "went",
            explanation:
              "Past tense is required.",
            actualIndex: 1,
          },
        ],
        ["i", "go", "yesterday"]
      );

    const errorsAtIndex =
      merged.filter(
        (error) =>
          error.actualIndex === 1 &&
          error.actual === "go"
      );

    expect(errorsAtIndex).toHaveLength(1);

    expect(errorsAtIndex[0]._id).toBe(
      "existing-error"
    );

    expect(errorsAtIndex[0]).toMatchObject({
      type: "TENSE_ERROR",
      expectedCorrection: "went",
    });
  });

  test("keeps separate grammar errors for separate tokens", () => {
    const merged =
      mergeGrammarErrors(
        [],
        [
          {
            actual: "go",
            expectedCorrection: "went",
            explanation:
              "Past tense is required.",
            actualIndex: 1,
          },
          {
            actual: "eat",
            expectedCorrection: "ate",
            explanation:
              "Past tense is required.",
            actualIndex: 3,
          },
        ],
        [
          "i",
          "go",
          "and",
          "eat",
          "yesterday",
        ]
      );

    expect(merged).toHaveLength(2);

    expect(merged).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actual: "go",
          expectedCorrection: "went",
          type: "TENSE_ERROR",
        }),
        expect.objectContaining({
          actual: "eat",
          expectedCorrection: "ate",
          type: "TENSE_ERROR",
        }),
      ])
    );

    expect(
      countErrors(merged)
    ).toMatchObject({
      tense: 2,
      total: 2,
    });
  });
});