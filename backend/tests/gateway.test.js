const http = require("http");
const express = require("express");
const request = require("supertest");
const { createGatewayApp } = require("../../gateway/server");

function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(0, "127.0.0.1", () => resolve(server));
  });
}

describe("ProgressLens API gateway", () => {
  let progressServer;
  let errorServer;
  let gateway;

  beforeAll(async () => {
    const progressApp = express();
    progressApp.use(express.json());
    progressApp.get("/", (req, res) => res.json({ status: "ok" }));
    progressApp.all("/api/{*path}", (req, res) => res.json({ service: "progress", path: req.path }));

    const errorApp = express();
    errorApp.use(express.raw({ type: "*/*", limit: "1mb" }));
    errorApp.get("/api/health", (req, res) => res.json({ status: "ok" }));
    errorApp.all("/api/{*path}", (req, res) => res.json({
      service: "error-analyser",
      path: req.path,
      bytes: Buffer.isBuffer(req.body) ? req.body.length : 0,
    }));

    progressServer = await listen(progressApp);
    errorServer = await listen(errorApp);
    gateway = createGatewayApp({
      progressTarget: `http://127.0.0.1:${progressServer.address().port}`,
      errorAnalyserTarget: `http://127.0.0.1:${errorServer.address().port}`,
    });
  });

  afterAll(async () => {
    await Promise.all([
      new Promise((resolve) => progressServer.close(resolve)),
      new Promise((resolve) => errorServer.close(resolve)),
    ]);
  });

  test("routes normal API calls to Progress Monitoring", async () => {
    const response = await request(gateway).get("/api/progress/student-1/dashboard");
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ service: "progress", path: "/api/progress/student-1/dashboard" });
  });

  test("checks both upstream services instead of reporting configuration only", async () => {
    const response = await request(gateway).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.services.progressMonitoring.status).toBe("up");
    expect(response.body.services.errorAnalyser.status).toBe("up");
  });

  test("returns 503 when an upstream service is unavailable", async () => {
    const degradedGateway = createGatewayApp({
      progressTarget: "http://127.0.0.1:1",
      errorAnalyserTarget: `http://127.0.0.1:${errorServer.address().port}`,
    });
    const response = await request(degradedGateway).get("/health");
    expect(response.statusCode).toBe(503);
    expect(response.body.status).toBe("degraded");
    expect(response.body.services.progressMonitoring.status).toBe("down");
  });

  test("rejects browser origins outside the configured allowlist", async () => {
    const response = await request(gateway).get("/health").set("Origin", "https://untrusted.example");
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("Origin is not allowed by CORS policy.");
  });

  test("rewrites the analyser namespace to its internal /api path", async () => {
    const response = await request(gateway).get("/api/error-analyser/reports/report-1");
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ service: "error-analyser", path: "/api/reports/report-1" });
  });

  test("streams an uploaded body to the Error Analyser", async () => {
    const response = await request(gateway)
      .post("/api/error-analyser/uploads/writing-sample")
      .set("Content-Type", "application/pdf")
      .send(Buffer.from("pdf-bytes"));
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ service: "error-analyser", bytes: 9 });
  });
});
