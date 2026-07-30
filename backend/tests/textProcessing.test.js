const {
    cleanText,
    tokenizeWords,
    tokenizeSentences,
  } = require("../src/utils/textProcessing");
  
  describe("Text processing utility functions", () => {
    test("cleanText should trim, lowercase, and normalise spaces", () => {
      const input = "  Hello,\n\nWORLD!   ";
      const result = cleanText(input);
  
      expect(result).toBe("hello, world!");
    });
  
    test("cleanText should return empty string for non-string input", () => {
      expect(cleanText(null)).toBe("");
      expect(cleanText(undefined)).toBe("");
      expect(cleanText(123)).toBe("");
    });
  
    test("tokenizeWords should split cleaned text into words", () => {
      const input = "The dog runs quickly.";
      const result = tokenizeWords(input);
  
      expect(result).toEqual(["the", "dog", "runs", "quickly"]);
    });
  
    test("tokenizeWords should return empty array for empty text", () => {
      expect(tokenizeWords("")).toEqual([]);
      expect(tokenizeWords("   ")).toEqual([]);
    });
  
    test("tokenizeSentences should split paragraph into sentences", () => {
      const input = "This is sentence one. This is sentence two!";
      const result = tokenizeSentences(input);
  
      expect(result.length).toBe(2);
      expect(result[0]).toBe("This is sentence one.");
      expect(result[1]).toBe("This is sentence two!");
    });
  });