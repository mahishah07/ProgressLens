const regexpTokenizerModule = require("natural/lib/natural/tokenizers/regexp_tokenizer");
const SentenceTokenizer = require("natural/lib/natural/tokenizers/sentence_tokenizer");

// WordTokenizer is exported from regexp_tokenizer.js
const WordTokenizer = regexpTokenizerModule.WordTokenizer;

const wordTokenizer = new WordTokenizer();

const sentenceTokenizer = new SentenceTokenizer([
  "e.g.",
  "i.e.",
  "Dr.",
  "Mr.",
  "Mrs.",
  "Ms.",
]);

function cleanText(text) {
  if (typeof text !== "string") {
    return "";
  }

  return text
    .normalize("NFKC")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenizeWords(text) {
  const cleanedText = cleanText(text);

  if (cleanedText.length === 0) {
    return [];
  }

  return wordTokenizer.tokenize(cleanedText);
}

function tokenizeSentences(text) {
  if (typeof text !== "string") {
    return [];
  }

  const normalisedText = text
    .normalize("NFKC")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalisedText.length === 0) {
    return [];
  }

  return sentenceTokenizer.tokenize(normalisedText);
}

module.exports = {
  cleanText,
  tokenizeWords,
  tokenizeSentences,
};