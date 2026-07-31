const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
module.exports = {
  port: process.env.PORT || 5002,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/progresslens",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-5.6-terra",
};
