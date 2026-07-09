const express = require("express");
const routes = require("./routes");

const app = express();

// Allows backend to read JSON request bodies.
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "DAS Error Pattern Analysis API is running",
  });
});

app.use(routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

module.exports = app;