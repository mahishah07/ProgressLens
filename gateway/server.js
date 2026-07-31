const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const http = require("http");
const https = require("https");
const express = require("express");
const cors = require("cors");

function appendForwardedFor(existing, address) {
  return [existing, address].filter(Boolean).join(", ");
}

function createStreamingProxy({ target, rewritePath = (path) => path }) {
  const targetUrl = new URL(target);
  const transport = targetUrl.protocol === "https:" ? https : http;

  return (req, res) => {
    const path = rewritePath(req.originalUrl);
    const headers = {
      ...req.headers,
      host: targetUrl.host,
      "x-forwarded-host": req.headers.host || "",
      "x-forwarded-proto": req.protocol,
      "x-forwarded-for": appendForwardedFor(req.headers["x-forwarded-for"], req.socket.remoteAddress),
    };

    const proxyRequest = transport.request({
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || undefined,
      method: req.method,
      path,
      headers,
      timeout: 120000,
    }, (proxyResponse) => {
      res.status(proxyResponse.statusCode || 502);
      for (const [name, value] of Object.entries(proxyResponse.headers)) {
        if (value !== undefined) res.setHeader(name, value);
      }
      proxyResponse.pipe(res);
    });

    proxyRequest.on("timeout", () => proxyRequest.destroy(new Error("Upstream request timed out.")));
    proxyRequest.on("error", (error) => {
      if (!res.headersSent) {
        res.status(502).json({ success: false, error: "Upstream service unavailable.", details: error.message });
      } else {
        res.destroy(error);
      }
    });
    req.pipe(proxyRequest);
  };
}

function createGatewayApp(options = {}) {
  const progressTarget = options.progressTarget || process.env.PROGRESS_API_URL || "http://127.0.0.1:5001";
  const errorAnalyserTarget = options.errorAnalyserTarget || process.env.ERROR_ANALYSER_API_URL || "http://127.0.0.1:5002";
  const app = express();

  app.use(cors());
  app.get("/health", (req, res) => res.json({
    status: "ok",
    services: { progressMonitoring: progressTarget, errorAnalyser: errorAnalyserTarget },
  }));

  app.use("/api/error-analyser", createStreamingProxy({
    target: errorAnalyserTarget,
    rewritePath: (path) => path.replace(/^\/api\/error-analyser(?=\/|$)/, "/api"),
  }));
  app.use("/api", createStreamingProxy({ target: progressTarget }));

  app.use((req, res) => res.status(404).json({ message: "Gateway route not found" }));
  return app;
}

const app = createGatewayApp();

function startServer() {
  const port = Number(process.env.GATEWAY_PORT || 5000);
  return app.listen(port, "0.0.0.0", () => console.log(`ProgressLens gateway running on port ${port}`));
}

if (require.main === module) startServer();

module.exports = { app, createGatewayApp, createStreamingProxy, startServer };
