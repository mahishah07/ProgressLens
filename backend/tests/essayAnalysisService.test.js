const {
    analyseEssay,
    detectRepeatedWords,
    detectCommonTypos,
    detectComparisonErrors,
    isLikelyLetterReversal,
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