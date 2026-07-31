function cleanOcrText(rawText) {
  if (!rawText) return "";
  return rawText
    .replace(/\\/g, "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !/^[=/#|]+$/.test(line.trim()))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = { cleanOcrText };
