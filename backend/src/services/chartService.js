const CHART_CATEGORIES = [
  { key: "letterReversal", label: "Letter Reversals", color: "#0B4F9C" },
  { key: "spelling", label: "Spelling", color: "#7E3CC8" },
  { key: "phonetic", label: "Phonetic", color: "#B965F5" },
  { key: "insertion", label: "Insertions", color: "#E39000" },
  { key: "deletion", label: "Deletions", color: "#00695C" },
  { key: "tense", label: "Tense", color: "#D94F70" },
  { key: "capitalisation", label: "Capitalisation", color: "#2F80ED" },
  { key: "grammar", label: "Grammar", color: "#22A06B" },
];

function buildErrorChartData(errorCounts) {
  const total = CHART_CATEGORIES.reduce((sum, category) => sum + Number(errorCounts?.[category.key] || 0), 0);
  return CHART_CATEGORIES.map((category) => {
    const count = Number(errorCounts?.[category.key] || 0);
    return { ...category, count, percentage: total === 0 ? 0 : Number(((count / total) * 100).toFixed(1)) };
  });
}

module.exports = { buildErrorChartData, CHART_CATEGORIES };
