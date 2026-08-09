const { buildErrorChartData } = require("../src/services/chartService");

describe("Error pie chart data", () => {
  test("returns counts, percentages, labels, and colours", () => {
    const data = buildErrorChartData({ spelling: 3, phonetic: 1, insertion: 0, deletion: 0, letterReversal: 1 });
    expect(data.find((item) => item.key === "spelling")).toMatchObject({ count: 3, percentage: 60, label: "Spelling" });
    expect(data.reduce((sum, item) => sum + item.percentage, 0)).toBe(100);
    expect(data.every((item) => item.color.startsWith("#"))).toBe(true);
  });

  test("handles a report with no errors", () => {
    expect(buildErrorChartData({}).every((item) => item.percentage === 0)).toBe(true);
  });

  test("includes grammar errors in chart data", () => {
    const grammar = buildErrorChartData({ grammar: 2, spelling: 1 }).find((item) => item.key === "grammar");
    expect(grammar).toMatchObject({ label: "Grammar", count: 2, percentage: 66.7 });
  });

  test("keeps tense, capitalisation, and other grammar as separate chart categories", () => {
    const chart = buildErrorChartData({ tense: 2, capitalisation: 3, grammar: 1 });
    expect(chart.find((item) => item.key === "tense")).toMatchObject({ label: "Tense", count: 2, percentage: 33.3 });
    expect(chart.find((item) => item.key === "capitalisation")).toMatchObject({ label: "Capitalisation", count: 3, percentage: 50 });
    expect(chart.find((item) => item.key === "grammar")).toMatchObject({ label: "Grammar", count: 1, percentage: 16.7 });
  });
});
