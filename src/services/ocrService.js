//fs = file sys, read the uploaded PDF file from the backend folder.
const fs = require("fs"); 

// DocumentAnalysisClient sends the PDF to Azure for OCR.
const { AzureKeyCredential, 
    DocumentAnalysisClient
} = require("@azure/ai-form-recognizer");

// This function receives the path of the uploaded PDF.
async function extractTextFromPdf(filePath) {
  // Get the endpoint from .env.
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;

  // Get the secret key from .env.
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  // If either value is missing, stop and show a clear error.
  if (!endpoint || !key) {
    throw new Error("Azure endpoint or key is missing in .env");
  }

  // Create the Azure client (logging in to your Azure OCR service)
  const client = new DocumentAnalysisClient(
    endpoint,
    new AzureKeyCredential(key)
  );

  // Open the uploaded PDF file.
  const fileStream = fs.createReadStream(filePath);

  // Send the PDF to Azure's Read OCR model.
  // prebuilt-read is used to extract printed/handwritten text.
  const poller = await client.beginAnalyzeDocument(
    "prebuilt-read",
    fileStream
  );

  // Azure OCR can take a few seconds, so wait until it is done.
  const result = await poller.pollUntilDone();

  // result.content contains all extracted text in one string.
  const extractedText = result.content || "";

  // Return only the extracted essay text.
  return extractedText;
}

// Export this function so the upload controller can use it.
module.exports = {
  extractTextFromPdf,
};