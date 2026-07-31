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
});
