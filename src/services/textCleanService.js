// This function cleans OCR formatting only.
// It does NOT correct spelling or grammar,
// because student mistakes must be preserved for analysis.
function cleanOcrText(rawText) {
  if (!rawText) {
    return "";
  }

  let text = rawText;

  // Remove backslash characters that OCR may randomly detect.
  // Example: "\ revised" becomes " revised"
  text = text.replace(/\\/g, "");

  // Convert Windows newlines to normal newlines.
  text = text.replace(/\r\n/g, "\n");

  // Remove lines that are only random symbols like "=" or "/".
  text = text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();

      if (trimmed === "") return true;

      // Remove lines that only contain these symbols.
      if (/^[=/#|]+$/.test(trimmed)) return false;

      return true;
    })
    .join("\n");

  // Remove extra spaces inside each line.
  text = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n");

  // Reduce too many blank lines.
  text = text.replace(/\n{3,}/g, "\n\n");

  // Remove empty space at start and end.
  text = text.trim();

  return text;
}

module.exports = {
  cleanOcrText,
};