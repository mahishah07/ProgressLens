const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/pms/config/db");
const { notFound, errorHandler } = require("./src/pms/error/errorHandling");
const studentRoutes = require("./src/pms/routes/studentRoutes");
const assessmentRoutes = require("./src/pms/routes/assessmentRoutes");
const progressRoutes = require("./src/pms/routes/progressRoutes");
const comparisonRoutes = require("./src/pms/routes/comparisonRoutes");
const reportRoutes = require("./src/pms/routes/reportRoutes");
const aiRoutes = require("./src/pms/routes/aiRoutes");

let sheetsRoutes = null;
let sheetsSync = null;
try {
  sheetsRoutes = require("./src/pms/routes/sheetsRoutes");
  sheetsSync = require("./src/pms/services/sheetsSync");
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND" || !error.message.includes("googleapis")) throw error;
  console.warn("Google Sheets integration is disabled because googleapis is not installed.");
}

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/", (req, res) => res.json({ message: "DAS Progress Monitoring System API is running" }));
  app.use("/api/students", studentRoutes);
  app.use("/api/assessments", assessmentRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/comparison", comparisonRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/ai", aiRoutes);
  if (sheetsRoutes) app.use("/api/sheets", sheetsRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

const app = createApp();

async function startServer() {
  await connectDB();
  if (process.env.NODE_ENV === "production" && sheetsSync) sheetsSync.startPolling(30);
  const port = Number(process.env.PMS_PORT || 5001);
  return app.listen(port, "0.0.0.0", () => console.log(`Progress Monitoring API running on port ${port}`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Unable to start Progress Monitoring: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, createApp, startServer };
