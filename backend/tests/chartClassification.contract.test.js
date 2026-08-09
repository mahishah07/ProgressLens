const { buildErrorChartData, CHART_CATEGORIES } = require("../src/services/chartService");

describe("EPA chart classification contract", () => {
  test("publishes every backend category in deterministic UI order", () => {
    expect(CHART_CATEGORIES.map(({ key }) => key)).toEqual([
      "letterReversal", "spelling", "phonetic", "insertion", "deletion",
      "tense", "capitalisation", "grammar",
    ]);
  });

  test("returns zero-safe chart data for missing counts", () => {
    const chart = buildErrorChartData(undefined);
    expect(chart).toHaveLength(CHART_CATEGORIES.length);
    expect(chart.every((item) => item.count === 0 && item.percentage === 0)).toBe(true);
  });

  test("percentages use the category sum and remain consistent", () => {
    const chart = buildErrorChartData({ spelling: 1, tense: 2, capitalisation: 3, grammar: 4, total: 999 });
    expect(chart.find(({ key }) => key === "spelling").percentage).toBe(10);
    expect(chart.find(({ key }) => key === "tense").percentage).toBe(20);
    expect(chart.find(({ key }) => key === "capitalisation").percentage).toBe(30);
    expect(chart.find(({ key }) => key === "grammar").percentage).toBe(40);
    expect(chart.reduce((sum, item) => sum + item.count, 0)).toBe(10);
  });

  test("each category has a unique key, label, and colour", () => {
    for (const field of ["key", "label", "color"]) {
      expect(new Set(CHART_CATEGORIES.map((category) => category[field])).size).toBe(CHART_CATEGORIES.length);
    }
  });
});
