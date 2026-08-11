const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), override: true });
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const { createCorsOptions } = require("../config/cors");

function appendForwardedFor(existing, address) {
  return [existing, address].filter(Boolean).join(", ");
}

function requestServiceHealth(target, healthPath, timeoutMs = 2000) {
  const startedAt = Date.now();
  const targetUrl = new URL(healthPath, target);
  const transport = targetUrl.protocol === "https:" ? https : http;
  return new Promise((resolve) => {
    const request = transport.get(targetUrl, { timeout: timeoutMs }, (response) => {
      response.resume();
      const healthy = response.statusCode >= 200 && response.statusCode < 400;
      resolve({ status: healthy ? "up" : "down", statusCode: response.statusCode, latencyMs: Date.now() - startedAt });
    });
    request.on("timeout", () => request.destroy(new Error("Health check timed out.")));
    request.on("error", (error) => resolve({ status: "down", latencyMs: Date.now() - startedAt, error: error.code || error.message }));
  });
}

function createStreamingProxy({
  target,
  rewritePath = (path) => path,
  timeoutMs = 120000,
}) {
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
      "x-request-id": req.requestId,
    };

    const proxyRequest = transport.request({
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || undefined,
      method: req.method,
      path,
      headers,
      timeout: timeoutMs,
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
        res.status(502).json({ success: false, error: "Upstream service unavailable.", requestId: req.requestId });
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
  const proxyTimeoutMs = options.proxyTimeoutMs ?? options.timeoutMs ?? 120000;
  const app = express();

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    const startedAt = Date.now();
    res.on("finish", () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms ${req.requestId}`));
    next();
  });
  app.use(cors(createCorsOptions(options.env || process.env)));
  app.get("/health", async (req, res) => {
    const [progressMonitoring, errorAnalyser] = await Promise.all([
      requestServiceHealth(progressTarget, "/"),
      requestServiceHealth(errorAnalyserTarget, "/api/health"),
    ]);
    const healthy = progressMonitoring.status === "up" && errorAnalyser.status === "up";
    return res.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      services: { progressMonitoring, errorAnalyser },
      requestId: req.requestId,
    });
  });

  app.use(
  "/api/error-analyser",
  createStreamingProxy({
    target: errorAnalyserTarget,
    timeoutMs: proxyTimeoutMs,
    rewritePath: (path) =>
      path.replace(
        /^\/api\/error-analyser(?=\/|$)/,
        "/api"
      ),
  })
);

app.use(
  "/api",
  createStreamingProxy({
    target: progressTarget,
    timeoutMs: proxyTimeoutMs,
  })
);

  app.use((req, res) => res.status(404).json({ message: "Gateway route not found" }));
  app.use((error, req, res, next) => res.status(error.statusCode || 500).json({
    success: false,
    error: error.statusCode ? error.message : "Gateway request failed.",
    requestId: req.requestId,
  }));
  return app;
}

const app = createGatewayApp();
let server = null;
let keepAliveTimer = null;

function startServer() {
  const port = Number(process.env.GATEWAY_PORT || 5050);
  if (server) return server;
  server = app.listen(port, "0.0.0.0", () => console.log(`ProgressLens gateway running on port ${port}`));
  keepAliveTimer = setInterval(() => {}, 60000);
  return server;
}

function stopServer() {
  return new Promise((resolve, reject) => {
    if (!server) return resolve();
    server.close((error) => {
      if (error) return reject(error);
      server = null;
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      keepAliveTimer = null;
      return resolve();
    });
  });
}

if (require.main === module) {
  startServer();
  const shutdown = async (signal) => {
    console.log(`${signal} received; stopping gateway.`);
    await stopServer();
    process.exit(0);
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = { app, createGatewayApp, createStreamingProxy, requestServiceHealth, startServer, stopServer };
