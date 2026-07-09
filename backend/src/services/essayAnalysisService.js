const {
    cleanText,
    tokenizeWords,
    tokenizeSentences,
  } = require("../utils/textProcessing");
  
  // Simple typo dictionary for prototype.
  // You can expand this later using nspell or your DAS error categories.
  const COMMON_TYPOS = {
    teh: "the",
    recieve: "receive",
    becuase: "because",
    alot: "a lot",
    wierd: "weird",
    seperate: "separate",
    freind: "friend",
    thier: "their",
    goverment: "government",
  };
  
  // Letter reversal pairs common in dyslexia-related writing analysis.
  const REVERSAL_MAP = {
    b: "d",
    d: "b",
    p: "q",
    q: "p",
    m: "w",
    w: "m",
  };
  
  function isLikelyLetterReversal(expectedWord, actualWord) {
    if (!expectedWord || !actualWord) {
      return false;
    }
  
    if (expectedWord.length !== actualWord.length) {
      return false;
    }
  
    if (expectedWord === actualWord) {
      return false;
    }
  
    let differentLetters = 0;
  
    for (let i = 0; i < expectedWord.length; i++) {
      const expectedChar = expectedWord[i];
      const actualChar = actualWord[i];
  
      if (expectedChar !== actualChar) {
        differentLetters++;
  
        const expectedReversal = REVERSAL_MAP[expectedChar];
  
        if (expectedReversal !== actualChar) {
          return false;
        }
      }
    }
  
    return differentLetters > 0;
  }
  
  function detectRepeatedWords(tokens) {
    const errors = [];
  
    for (let i = 1; i < tokens.length; i++) {
      if (tokens[i] === tokens[i - 1]) {
        errors.push({
          type: "REPETITION",
          category: "Insertion",
          message: `Repeated word "${tokens[i]}" detected.`,
          actual: tokens[i],
          tokenIndex: i,
        });
      }
    }
  
    return errors;
  }
  
  function detectCommonTypos(tokens) {
    const errors = [];
  
    tokens.forEach((token, index) => {
      if (COMMON_TYPOS[token]) {
        errors.push({
          type: "COMMON_TYPO",
          category: "Spelling",
          message: `"${token}" may be a spelling error. Suggested correction: "${COMMON_TYPOS[token]}".`,
          actual: token,
          suggestion: COMMON_TYPOS[token],
          tokenIndex: index,
        });
      }
    });
  
    return errors;
  }
  
  // This builds a simple difference table between expected text and student text.
  // It is used to detect insertion/deletion/substitution errors.
  function buildDiffOperations(expectedTokens, actualTokens) {
    const m = expectedTokens.length;
    const n = actualTokens.length;
  
    // dp[i][j] stores the LCS length from expectedTokens[i:] and actualTokens[j:].
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        if (expectedTokens[i] === actualTokens[j]) {
          dp[i][j] = 1 + dp[i + 1][j + 1];
        } else {
          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }
  
    const operations = [];
    let i = 0;
    let j = 0;
  
    while (i < m && j < n) {
      if (expectedTokens[i] === actualTokens[j]) {
        operations.push({
          type: "MATCH",
          expected: expectedTokens[i],
          actual: actualTokens[j],
          expectedIndex: i,
          actualIndex: j,
        });
  
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        operations.push({
          type: "DELETION",
          expected: expectedTokens[i],
          actual: null,
          expectedIndex: i,
          actualIndex: j,
        });
  
        i++;
      } else {
        operations.push({
          type: "INSERTION",
          expected: null,
          actual: actualTokens[j],
          expectedIndex: i,
          actualIndex: j,
        });
  
        j++;
      }
    }
  
    while (i < m) {
      operations.push({
        type: "DELETION",
        expected: expectedTokens[i],
        actual: null,
        expectedIndex: i,
        actualIndex: j,
      });
  
      i++;
    }
  
    while (j < n) {
      operations.push({
        type: "INSERTION",
        expected: null,
        actual: actualTokens[j],
        expectedIndex: i,
        actualIndex: j,
      });
  
      j++;
    }
  
    return operations;
  }
  
  function convertDiffToErrors(operations) {
    const errors = [];
    let index = 0;
  
    while (index < operations.length) {
      const current = operations[index];
      const next = operations[index + 1];
  
      // Ignore correct matching words.
      if (current.type === "MATCH") {
        index++;
        continue;
      }
  
      // A deletion followed by an insertion usually means the student replaced one word with another.
      if (
        current.type === "DELETION" &&
        next &&
        next.type === "INSERTION"
      ) {
        const expectedWord = current.expected;
        const actualWord = next.actual;
  
        if (isLikelyLetterReversal(expectedWord, actualWord)) {
          errors.push({
            type: "LETTER_REVERSAL",
            category: "Letter reversal",
            message: `Possible letter reversal: expected "${expectedWord}", but found "${actualWord}".`,
            expected: expectedWord,
            actual: actualWord,
            expectedIndex: current.expectedIndex,
            actualIndex: next.actualIndex,
          });
        } else {
          errors.push({
            type: "SUBSTITUTION",
            category: "Substitution",
            message: `Expected "${expectedWord}", but found "${actualWord}".`,
            expected: expectedWord,
            actual: actualWord,
            expectedIndex: current.expectedIndex,
            actualIndex: next.actualIndex,
          });
        }
  
        index += 2;
        continue;
      }
  
      if (current.type === "DELETION") {
        errors.push({
          type: "DELETION",
          category: "Deletion",
          message: `Missing expected word "${current.expected}".`,
          expected: current.expected,
          actual: null,
          expectedIndex: current.expectedIndex,
        });
      }
  
      if (current.type === "INSERTION") {
        errors.push({
          type: "INSERTION",
          category: "Insertion",
          message: `Extra word "${current.actual}" detected.`,
          expected: null,
          actual: current.actual,
          actualIndex: current.actualIndex,
        });
      }
  
      index++;
    }
  
    return errors;
  }
  
  function detectComparisonErrors(expectedText, actualText) {
    const expectedTokens = tokenizeWords(expectedText);
    const actualTokens = tokenizeWords(actualText);
  
    const operations = buildDiffOperations(expectedTokens, actualTokens);
    const errors = convertDiffToErrors(operations);
  
    return errors;
  }
  
  function analyseEssay({ essayText, expectedText }) {
    const cleanedText = cleanText(essayText);
    const tokens = tokenizeWords(essayText);
    const sentences = tokenizeSentences(essayText);
  
    let errors = [];
  
    // Detect errors that do not need reference text.
    errors = errors.concat(detectRepeatedWords(tokens));
    errors = errors.concat(detectCommonTypos(tokens));
  
    // Detect comparison-based errors only if expectedText is provided.
    if (typeof expectedText === "string" && expectedText.trim().length > 0) {
      errors = errors.concat(detectComparisonErrors(expectedText, essayText));
    }
  
    return {
      cleanedText,
      tokens,
      sentences,
      summary: {
        wordCount: tokens.length,
        sentenceCount: sentences.length,
        errorCount: errors.length,
      },
      errors,
    };
  }
  
  module.exports = {
    analyseEssay,
    detectRepeatedWords,
    detectCommonTypos,
    detectComparisonErrors,
    isLikelyLetterReversal,
  };