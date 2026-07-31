const fs = require("fs");
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

async function extractTextFromPdf(filePath) {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  if (!endpoint || !key) throw new Error("Azure endpoint or key is missing in .env");

  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
  const poller = await client.beginAnalyzeDocument("prebuilt-read", fs.createReadStream(filePath));
  const result = await poller.pollUntilDone();
  return result.content || "";
}

module.exports = { extractTextFromPdf };
