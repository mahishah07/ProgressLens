const fs = require("fs");
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

function createOcrServiceError(message = "OCR service is currently unavailable.") {
  const error = new Error(message);
  error.statusCode = 503;
  return error;
}

function textFromSpans(content, spans = []) {
  // If content is not a string, there is nothing safe to extract.
  if (typeof content !== "string") {
    return "";
  }

  // Default parameters only handle undefined, not null.
  // So explicitly check that spans is an array.
  if (!Array.isArray(spans)) {
    return "";
  }

  return spans
    .filter((span) => {
      // Ignore null, undefined, or malformed span objects.
      if (!span || typeof span !== "object") {
        return false;
      }

      const { offset, length } = span;

      // Offset and length must be valid numbers.
      if (!Number.isInteger(offset) || !Number.isInteger(length)) {
        return false;
      }

      // They cannot be negative.
      if (offset < 0 || length < 0) {
        return false;
      }

      // Ignore spans starting outside the content.
      if (offset >= content.length) {
        return false;
      }

      return true;
    })
    .map(({ offset, length }) =>
      content.slice(offset, offset + length)
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDocument(source) {
  try{
  // Multer supplies an object containing mimetype, buffer, path, etc.
  const file =
    source &&
    typeof source === "object" &&
    !Buffer.isBuffer(source)
      ? source
      : null;

  // TXT files already contain text and should not be sent to Azure OCR.
  if (file?.mimetype === "text/plain") {
    const buffer = file.buffer || await fs.promises.readFile(file.path);

    return {
      content: buffer.toString("utf8"),
      handwrittenText: "",
      tables: [],
    };
  }

  const endpoint =
    process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key =
    process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error("Azure endpoint or key is missing in .env");
  }

  const client = new DocumentAnalysisClient(
    endpoint,
    new AzureKeyCredential(key)
  );

  let input;

  if (file?.buffer) {
    input = file.buffer;
  } else if (file?.path) {
    input = fs.createReadStream(file.path);
  } else if (Buffer.isBuffer(source)) {
    input = source;
  } else {
    input = fs.createReadStream(source);
  }

  const poller = await client.beginAnalyzeDocument(
    "prebuilt-layout",
    input
  );

  const result = await poller.pollUntilDone();
  if (!result || typeof result !== "object") {
  throw createOcrServiceError(
    "Document OCR service returned an invalid result."
  );
}
  const content = result.content || "";

  const handwrittenText = (result.styles || [])
    .filter((style) => style.isHandwritten)
    .map((style) => textFromSpans(content, style.spans))
    .filter(Boolean)
    .join(" ");

  return {
    content,
    handwrittenText,
    tables: result.tables || [],
  };
}
catch (error) {
  console.error(
      "Azure OCR failed:",
      error?.message || error
    );

    throw createOcrServiceError(
      "Document OCR service is currently unavailable."
    );
  }
}
async function extractTextFromPdf(filePath) {
  return (await extractDocument(filePath)).content;
}

module.exports = { extractDocument, extractTextFromPdf, textFromSpans };
