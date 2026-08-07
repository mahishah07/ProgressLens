const Metaphone = require("natural/lib/natural/phonetics/metaphone");
const { cleanText, tokenizeWords, tokenizeSentences } = require("../utils/textProcessing");

const metaphone = new Metaphone();
const COMMON_TYPOS = {
  teh: "the", recieve: "receive", becuase: "because", alot: "a lot",
  wierd: "weird", seperate: "separate", freind: "friend", thier: "their",
  goverment: "government", saterday: "saturday", verry: "very",
  icecreem: "icecream", bushs: "bushes", helpd: "helped", dawg: "dog",
};
const REVERSAL_MAP = { b: "d", d: "b", p: "q", q: "p", m: "w", w: "m" };

function isLikelyLetterReversal(expectedWord, actualWord) {
  if (!expectedWord || !actualWord || expectedWord.length !== actualWord.length || expectedWord === actualWord) return false;
  let differences = 0;
  for (let index = 0; index < expectedWord.length; index += 1) {
    if (expectedWord[index] !== actualWord[index]) {
      differences += 1;
      if (REVERSAL_MAP[expectedWord[index]] !== actualWord[index]) return false;
    }
  }
  return differences > 0;
}

function isLikelyPhoneticError(expectedWord, actualWord) {
  if (!expectedWord || !actualWord || expectedWord === actualWord) return false;
  const expectedCode = metaphone.process(expectedWord);
  const actualCode = metaphone.process(actualWord);
  return expectedCode.length > 0 && expectedCode === actualCode;
}

function detectRepeatedWords(tokens) {
  return tokens.flatMap((token, index) => index > 0 && token === tokens[index - 1]
    ? [{ type: "REPETITION", category: "Insertion", message: `Repeated word "${token}" detected.`, actual: token, tokenIndex: index, actualIndex: index }]
    : []);
}

function detectCommonTypos(tokens) {
  return tokens.flatMap((token, index) => COMMON_TYPOS[token]
    ? [{ type: "COMMON_TYPO", category: "Spelling", message: `"${token}" may be a spelling error. Suggested correction: "${COMMON_TYPOS[token]}".`, actual: token, suggestion: COMMON_TYPOS[token], tokenIndex: index, actualIndex: index }]
    : []);
}

function buildDiffOperations(expectedTokens, actualTokens) {
  const matrix = Array.from({ length: expectedTokens.length + 1 }, () => Array(actualTokens.length + 1).fill(0));
  for (let i = 0; i <= expectedTokens.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= actualTokens.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= expectedTokens.length; i += 1) {
    for (let j = 1; j <= actualTokens.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (expectedTokens[i - 1] === actualTokens[j - 1] ? 0 : 1)
      );
    }
  }

  const operations = [];
  let i = expectedTokens.length;
  let j = actualTokens.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expectedTokens[i - 1] === actualTokens[j - 1]) {
      operations.unshift({ type: "MATCH", expected: expectedTokens[i - 1], actual: actualTokens[j - 1], expectedIndex: i - 1, actualIndex: j - 1 });
      i -= 1; j -= 1;
    } else if (i > 0 && j > 0 && matrix[i][j] === matrix[i - 1][j - 1] + 1) {
      operations.unshift({ type: "SUBSTITUTION", expected: expectedTokens[i - 1], actual: actualTokens[j - 1], expectedIndex: i - 1, actualIndex: j - 1 });
      i -= 1; j -= 1;
    } else if (i > 0 && matrix[i][j] === matrix[i - 1][j] + 1) {
      operations.unshift({ type: "DELETION", expected: expectedTokens[i - 1], actual: null, expectedIndex: i - 1, actualIndex: j });
      i -= 1;
    } else {
      operations.unshift({ type: "INSERTION", expected: null, actual: actualTokens[j - 1], expectedIndex: i, actualIndex: j - 1 });
      j -= 1;
    }
  }
  return operations;
}

function convertDiffToErrors(operations) {
  return operations.flatMap((operation) => {
    if (operation.type === "MATCH") return [];
    if (operation.type === "DELETION") return [{ ...operation, category: "Deletion", message: `Missing expected word "${operation.expected}".` }];
    if (operation.type === "INSERTION") return [{ ...operation, category: "Insertion", message: `Extra word "${operation.actual}" detected.` }];

    const shared = { expected: operation.expected, actual: operation.actual, suggestion: operation.expected, expectedIndex: operation.expectedIndex, actualIndex: operation.actualIndex };
    if (isLikelyLetterReversal(operation.expected, operation.actual)) {
      return [{ ...shared, type: "LETTER_REVERSAL", category: "Letter reversal", message: `Possible letter reversal: expected "${operation.expected}", but found "${operation.actual}".` }];
    }
    if (isLikelyPhoneticError(operation.expected, operation.actual)) {
      return [{ ...shared, type: "PHONETIC_ERROR", category: "Phonetic", message: `Phonetically similar spelling: expected "${operation.expected}", but found "${operation.actual}".` }];
    }
    return [{ ...shared, type: "SPELLING_ERROR", category: "Spelling", message: `Possible spelling error: expected "${operation.expected}", but found "${operation.actual}".` }];
  });
}

function detectComparisonErrors(expectedText, actualText) {
  return convertDiffToErrors(buildDiffOperations(tokenizeWords(expectedText), tokenizeWords(actualText)));
}

function deduplicateErrors(errors) {
  const seen = new Set();
  return errors.filter((error) => {
    const key = `${error.category}:${error.actualIndex ?? error.tokenIndex}:${error.actual}:${error.expected}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeComparisonErrors(existingErrors, comparisonErrors) {
  const merged = existingErrors.map((error) => ({ ...error }));

  for (const comparisonError of comparisonErrors) {
    const matchIndex = merged.findIndex((error) => comparisonError.actual === null
      ? error.type === "DELETION" && error.expectedIndex === comparisonError.expectedIndex && error.expected === comparisonError.expected
      : error.actualIndex === comparisonError.actualIndex && error.actual === comparisonError.actual
    );

    if (matchIndex >= 0) {
      merged[matchIndex] = {
        ...merged[matchIndex],
        ...comparisonError,
        expectedCorrection: merged[matchIndex].expectedCorrection || comparisonError.expected || comparisonError.suggestion,
      };
    } else {
      merged.push({
        ...comparisonError,
        expectedCorrection: comparisonError.expected || comparisonError.suggestion,
        correctionExplanation: comparisonError.message,
        correctionSource: "openai",
      });
    }
  }

  return deduplicateErrors(merged);
}

function countErrors(errors) {
  const counts = { spelling: 0, phonetic: 0, insertion: 0, deletion: 0, letterReversal: 0, total: errors.length };
  for (const error of errors) {
    if (["SPELLING_ERROR", "COMMON_TYPO"].includes(error.type)) counts.spelling += 1;
    if (error.type === "PHONETIC_ERROR") counts.phonetic += 1;
    if (["INSERTION", "REPETITION"].includes(error.type)) counts.insertion += 1;
    if (error.type === "DELETION") counts.deletion += 1;
    if (error.type === "LETTER_REVERSAL") counts.letterReversal += 1;
  }
  return counts;
}

function analyseEssay({ essayText, expectedText }) {
  const cleanedText = cleanText(essayText);
  const tokens = tokenizeWords(essayText);
  const sentences = tokenizeSentences(essayText);
  let errors = detectRepeatedWords(tokens).concat(detectCommonTypos(tokens));
  if (typeof expectedText === "string" && expectedText.trim()) errors = errors.concat(detectComparisonErrors(expectedText, essayText));
  errors = deduplicateErrors(errors);
  const errorCounts = countErrors(errors);
  return { cleanedText, tokens, sentences, errors, errorCounts, summary: { wordCount: tokens.length, sentenceCount: sentences.length, errorCount: errors.length } };
}

module.exports = {
  analyseEssay, detectRepeatedWords, detectCommonTypos, detectComparisonErrors,
  isLikelyLetterReversal, isLikelyPhoneticError, buildDiffOperations, countErrors,
  mergeComparisonErrors,
};
