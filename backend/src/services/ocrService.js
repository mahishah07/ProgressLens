const fs = require("fs");
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

function textFromSpans(content, spans = []) {
  return spans
    .map(({ offset, length }) => content.slice(offset, offset + length))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDocument(source) {
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

async function extractTextFromPdf(filePath) {
  return (await extractDocument(filePath)).content;
}

module.exports = { extractDocument, extractTextFromPdf, textFromSpans };
