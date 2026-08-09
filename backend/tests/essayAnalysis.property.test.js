const {
  analyseEssay,
  countErrors,
} = require("../src/services/essayAnalysisService");

const {
  buildErrorChartData,
} = require("../src/services/chartService");

const ERROR_TYPES = [
  "SPELLING_ERROR",
  "COMMON_TYPO",
  "PHONETIC_ERROR",
  "INSERTION",
  "REPETITION",
  "DELETION",
  "LETTER_REVERSAL",
  "TENSE_ERROR",
  "CAPITALIZATION_ERROR",
  "GRAMMAR_ERROR",
];

function createRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function generateErrors(seed, amount) {
  const random = createRandom(seed);
  const errors = [];

  for (let index = 0; index < amount; index += 1) {
    const type =
      ERROR_TYPES[
        Math.floor(random() * ERROR_TYPES.length)
      ];

    errors.push({
      type,
      actual: `word-${index}`,
      actualIndex: index,
    });
  }

  return errors;
}

function expectedCategoryCounts(errors) {
  const expected = {
    spelling: 0,
    phonetic: 0,
    insertion: 0,
    deletion: 0,
    letterReversal: 0,
    tense: 0,
    capitalisation: 0,
    grammar: 0,
    total: errors.length,
  };

  for (const error of errors) {
    if (
      error.type === "SPELLING_ERROR" ||
      error.type === "COMMON_TYPO"
    ) {
      expected.spelling += 1;
    }

    if (error.type === "PHONETIC_ERROR") {
      expected.phonetic += 1;
    }

    if (
      error.type === "INSERTION" ||
      error.type === "REPETITION"
    ) {
      expected.insertion += 1;
    }

    if (error.type === "DELETION") {
      expected.deletion += 1;
    }

    if (error.type === "LETTER_REVERSAL") {
      expected.letterReversal += 1;
    }

    if (error.type === "TENSE_ERROR") {
      expected.tense += 1;
    }

    if (error.type === "CAPITALIZATION_ERROR") {
      expected.capitalisation += 1;
    }

    if (error.type === "GRAMMAR_ERROR") {
      expected.grammar += 1;
    }
  }

  return expected;
}

describe("EC-016 - countErrors property tests", () => {
  test("generated error arrays always produce the correct total", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const amount = seed % 41;
      const errors = generateErrors(seed, amount);
      const counts = countErrors(errors);

      expect(counts.total).toBe(errors.length);
    }
  });

  test("generated category counts match independently calculated counts", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const amount = (seed * 7) % 51;
      const errors = generateErrors(seed, amount);

      const actual = countErrors(errors);
      const expected = expectedCategoryCounts(errors);

      expect(actual).toEqual(expected);
    }
  });

  test("sum of individual category counts equals total", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const errors = generateErrors(
        seed,
        (seed * 11) % 61
      );

      const counts = countErrors(errors);

      const categoryTotal =
        counts.spelling +
        counts.phonetic +
        counts.insertion +
        counts.deletion +
        counts.letterReversal +
        counts.tense +
        counts.capitalisation +
        counts.grammar;

      expect(categoryTotal).toBe(counts.total);
    }
  });

  test("generated counts never contain negative values or NaN", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const errors = generateErrors(
        seed,
        (seed * 13) % 71
      );

      const counts = countErrors(errors);

      for (const value of Object.values(counts)) {
        expect(Number.isNaN(value)).toBe(false);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("EC-017 - chart property tests", () => {
  test("chart counts always match error counts", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const errors = generateErrors(
        seed,
        (seed * 17) % 61
      );

      const counts = countErrors(errors);
      const chartData = buildErrorChartData(counts);

      for (const chartItem of chartData) {
        expect(chartItem.count).toBe(
          counts[chartItem.key] || 0
        );
      }
    }
  });

  test("chart count total equals number of generated errors", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const errors = generateErrors(
        seed,
        (seed * 19) % 51
      );

      const counts = countErrors(errors);
      const chartData = buildErrorChartData(counts);

      const chartTotal = chartData.reduce(
        (sum, item) => sum + item.count,
        0
      );

      expect(chartTotal).toBe(errors.length);
      expect(chartTotal).toBe(counts.total);
    }
  });

  test("chart percentages are approximately 100 percent when errors exist", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const errors = generateErrors(
        seed,
        (seed % 50) + 1
      );

      const counts = countErrors(errors);
      const chartData = buildErrorChartData(counts);

      const percentageTotal = chartData.reduce(
        (sum, item) => sum + item.percentage,
        0
      );

      expect(
        Math.abs(percentageTotal - 100)
      ).toBeLessThanOrEqual(0.5);
    }
  });

  test("chart percentages are all zero when there are no errors", () => {
    const counts = countErrors([]);
    const chartData = buildErrorChartData(counts);

    expect(counts.total).toBe(0);

    expect(
      chartData.every(
        (item) => item.percentage === 0
      )
    ).toBe(true);
  });

  test("chart percentages never contain NaN or negative values", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const errors = generateErrors(
        seed,
        seed % 41
      );

      const chartData = buildErrorChartData(
        countErrors(errors)
      );

      for (const item of chartData) {
        expect(
          Number.isNaN(item.percentage)
        ).toBe(false);

        expect(
          item.percentage
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("EC-018 - analyseEssay consistency properties", () => {
  test.each([
    [
      "The dog ran home.",
      "The dog ran home.",
    ],
    [
      "The bog ran home.",
      "The dog ran home.",
    ],
    [
      "The dogg ran home.",
      "The dog ran home.",
    ],
    [
      "The dog ran.",
      "The dog ran home.",
    ],
    [
      "The dog ran home quickly.",
      "The dog ran home.",
    ],
    [
      "The dog went nite.",
      "The dog went night.",
    ],
    [
      "Teh dog dog ran home.",
      "The dog ran home.",
    ],
    [
      "The Sun rises.",
      "The sun rises.",
    ],
  ])(
    "keeps errors, counts and summary consistent for %s",
    (essayText, expectedText) => {
      const result = analyseEssay({
        essayText,
        expectedText,
      });

      expect(result.errorCounts.total).toBe(
        result.errors.length
      );

      expect(result.summary.errorCount).toBe(
        result.errors.length
      );

      expect(result.summary.wordCount).toBe(
        result.tokens.length
      );

      expect(
        result.summary.sentenceCount
      ).toBe(result.sentences.length);
    }
  );

  test("generated repeated-word essays keep totals consistent", () => {
    for (let amount = 1; amount <= 50; amount += 1) {
      const words = [];

      for (let index = 0; index < amount; index += 1) {
        words.push(`word${index}`);
        words.push(`word${index}`);
      }

      const essayText = words.join(" ");

      const result = analyseEssay({
        essayText,
      });

      expect(result.errorCounts.total).toBe(
        result.errors.length
      );

      expect(result.summary.errorCount).toBe(
        result.errors.length
      );

      expect(result.summary.wordCount).toBe(
        result.tokens.length
      );
    }
  });

  test("analysis without expected text remains internally consistent", () => {
    const essays = [
      "",
      "hello",
      "dog dog",
      "teh dog runs",
      "teh teh dog dog",
      "the quick brown fox jumps",
    ];

    for (const essayText of essays) {
      const result = analyseEssay({
        essayText,
      });

      expect(result.errorCounts.total).toBe(
        result.errors.length
      );

      expect(result.summary.errorCount).toBe(
        result.errors.length
      );

      expect(result.summary.wordCount).toBe(
        result.tokens.length
      );

      expect(
        result.summary.sentenceCount
      ).toBe(result.sentences.length);
    }
  });

  test("analysis with expected text has category counts that sum to total", () => {
    const cases = [
      {
        expectedText: "the dog ran home",
        essayText: "the bog ran home",
      },
      {
        expectedText: "good night",
        essayText: "good nite",
      },
      {
        expectedText: "the dog ran home",
        essayText: "the dog ran",
      },
      {
        expectedText: "the dog ran",
        essayText: "the dogg ran",
      },
      {
        expectedText: "the sun rises",
        essayText: "the Sun rises",
      },
    ];

    for (const testCase of cases) {
      const result = analyseEssay(testCase);

      const counts = result.errorCounts;

      const categoryTotal =
        counts.spelling +
        counts.phonetic +
        counts.insertion +
        counts.deletion +
        counts.letterReversal +
        counts.tense +
        counts.capitalisation +
        counts.grammar;

      expect(categoryTotal).toBe(
        counts.total
      );

      expect(counts.total).toBe(
        result.errors.length
      );
    }
  });
});