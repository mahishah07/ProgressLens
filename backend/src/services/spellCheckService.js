let spellChecker = null;

async function loadSpellChecker() {
  if (spellChecker) {
    return spellChecker;
  }

  const nspellModule = await import("nspell");
  const dictionaryModule = await import("dictionary-en");

  const nspell = nspellModule.default || nspellModule;
  const dictionary = dictionaryModule.default || dictionaryModule;

  spellChecker = nspell(dictionary);

  spellChecker.add("Regina");
  spellChecker.add("Talia");
  spellChecker.add("Meena");
  spellChecker.add("Lena");
  spellChecker.add("Chan");
  spellChecker.add("CBA");
  spellChecker.add("maths");
  spellChecker.add("Weighted");
  spellChecker.add("Assessment");

  return spellChecker;
}

function getWordsFromText(text) {
  if (!text) {
    return [];
  }

  const words = text.match(/[A-Za-z']+/g);

  if (!words) {
    return [];
  }

  return words;
}

async function checkSpelling(text) {
  const spell = await loadSpellChecker();

  const words = getWordsFromText(text);

  const errors = [];
  const seenWords = new Set();

  for (const word of words) {
    const lowerWord = word.toLowerCase();

    if (word.length <= 1) {
      continue;
    }

    if (seenWords.has(lowerWord)) {
      continue;
    }

    if (spell.correct(word)) {
      continue;
    }

    seenWords.add(lowerWord);

    errors.push({
      word: word,
      suggestions: spell.suggest(word).slice(0, 5),
    });
  }

  return errors;
}

module.exports = {
  checkSpelling,
};
