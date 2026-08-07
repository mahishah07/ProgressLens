const {
    analyseEssay,
    detectRepeatedWords,
    detectCommonTypos,
    detectComparisonErrors,
    isLikelyLetterReversal,
    isLikelyPhoneticError,
    mergeComparisonErrors,
    mergeGrammarErrors,
    countErrors,
  } = require("../src/services/essayAnalysisService");
  
  describe("Essay analysis service", () => {
    test("detectRepeatedWords should detect repeated words", () => {
      const tokens = ["i", "like", "like", "apples"];
      const errors = detectRepeatedWords(tokens);
  
      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe("REPETITION");
      expect(errors[0].actual).toBe("like");
    });
  
    test("detectCommonTypos should detect known typo", () => {
      const tokens = ["teh", "dog", "runs"];
      const errors = detectCommonTypos(tokens);
  
      expect(errors.length).toBe(1);
      expect(errors[0].type).toBe("COMMON_TYPO");
      expect(errors[0].actual).toBe("teh");
      expect(errors[0].suggestion).toBe("the");
    });
  
    test("isLikelyLetterReversal should detect b/d reversal", () => {
      const result = isLikelyLetterReversal("dog", "bog");
  
      expect(result).toBe(true);
    });

    test("isLikelyPhoneticError should detect phonetic spelling", () => {
      expect(isLikelyPhoneticError("night", "nite")).toBe(true);
    });

    test("detectComparisonErrors should classify spelling substitution", () => {
      const errors = detectComparisonErrors("apple", "axple");
      expect(errors[0].type).toBe("SPELLING_ERROR");
    });
  
    test("detectComparisonErrors should detect insertion", () => {
      const expectedText = "the dog ran home";
      const essayText = "the dog ran home quickly";
  
      const errors = detectComparisonErrors(expectedText, essayText);
  
      expect(errors.some((error) => error.type === "INSERTION")).toBe(true);
    });
  
    test("detectComparisonErrors should detect deletion", () => {
      const expectedText = "the dog ran home";
      const essayText = "the dog home";
  
      const errors = detectComparisonErrors(expectedText, essayText);
  
      expect(errors.some((error) => error.type === "DELETION")).toBe(true);
    });

    test("detectComparisonErrors should classify a missing letter as deletion", () => {
      const errors = detectComparisonErrors("had gone missing", "had gon missing");

      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: "DELETION",
        category: "Deletion",
        expected: "gone",
        actual: "gon",
      });
    });

    test("detectComparisonErrors should classify an extra letter as insertion", () => {
      const errors = detectComparisonErrors("the dog ran", "the dogg ran");

      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: "INSERTION",
        category: "Insertion",
        expected: "dog",
        actual: "dogg",
      });
    });

    test("mergeComparisonErrors upgrades a generic spelling error without losing its report ID", () => {
      const existing = [{
        _id: "error-id",
        type: "SPELLING_ERROR",
        category: "Spelling",
        actual: "bog",
        actualIndex: 1,
        expectedCorrection: "dog",
      }];
      const comparison = detectComparisonErrors("the dog", "the bog");
      const merged = mergeComparisonErrors(existing, comparison);

      expect(merged).toHaveLength(1);
      expect(merged[0]).toMatchObject({
        _id: "error-id",
        type: "LETTER_REVERSAL",
        category: "Letter reversal",
        expectedCorrection: "dog",
      });
    });

    test("mergeGrammarErrors classifies and counts a grammar correction", () => {
      const errors = mergeGrammarErrors([], [{
        actual: "go",
        expectedCorrection: "went",
        explanation: "Past tense is required.",
        actualIndex: 1,
      }], ["i", "go", "yesterday"]);

      expect(errors[0]).toMatchObject({
        type: "GRAMMAR_ERROR",
        category: "Grammar",
        actual: "go",
        expectedCorrection: "went",
        actualIndex: 1,
      });
      expect(countErrors(errors)).toMatchObject({ grammar: 1, total: 1 });
    });
  
    test("analyseEssay should return summary and errors", () => {
      const result = analyseEssay({
        essayText: "Teh dog dog ran home.",
        expectedText: "The dog ran home.",
      });
  
      expect(result.summary.wordCount).toBeGreaterThan(0);
      expect(result.summary.errorCount).toBeGreaterThan(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
