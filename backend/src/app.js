const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("./config/env");
const routes = require("./routes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.status(200).json({ message: "DAS Error Pattern Analysis API is running" }));
app.use(routes);
app.use("/api/uploads", uploadRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  if (error instanceof multer.MulterError) statusCode = 400;
  if (error.name === "ValidationError" || error.name === "CastError") statusCode = 400;
  if (process.env.NODE_ENV !== "test" && statusCode >= 500) console.error(error);
  return res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? "Writing sample processing failed." : error.message,
    ...(process.env.NODE_ENV === "development" && statusCode >= 500 ? { details: error.message } : {}),
  });
});

module.exports = app;
