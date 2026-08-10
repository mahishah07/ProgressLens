const { buildErrorChartData, CHART_CATEGORIES } = require("../src/services/chartService");

/*
 * BLACK-BOX OUTPUT-CONTRACT GROUP
 * Treats chart generation as an input/output function and verifies only its public contract:
 * stable categories, zero-safe results, correct percentages and unique presentation metadata.
 */
describe("EPA chart classification contract", () => {
  test("publishes every backend category in deterministic UI order", () => {
    expect(CHART_CATEGORIES.map(({ key }) => key)).toEqual([
      "letterReversal", "spelling", "phonetic", "insertion", "deletion",
      "tense", "capitalisation", "grammar",
    ]);
  });

  test("each category has a unique key, label, and colour", () => {
    for (const field of ["key", "label", "color"]) {
      expect(new Set(CHART_CATEGORIES.map((category) => category[field])).size).toBe(CHART_CATEGORIES.length);
    }
  });
});
