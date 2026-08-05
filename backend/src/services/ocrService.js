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
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  if (!endpoint || !key) throw new Error("Azure endpoint or key is missing in .env");

  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
  const input = Buffer.isBuffer(source) ? source : fs.createReadStream(source);
  const poller = await client.beginAnalyzeDocument("prebuilt-layout", input);
  const result = await poller.pollUntilDone();
  const content = result.content || "";
  const handwrittenText = (result.styles || [])
    .filter((style) => style.isHandwritten)
    .map((style) => textFromSpans(content, style.spans))
    .filter(Boolean)
    .join(" ");
  return { content, handwrittenText, tables: result.tables || [] };
}

async function extractTextFromPdf(filePath) {
  return (await extractDocument(filePath)).content;
}

module.exports = { extractDocument, extractTextFromPdf, textFromSpans };
