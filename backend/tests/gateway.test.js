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
    progressApp.all("/api/{*path}", (req, res) => res.json({ service: "progress", path: req.path }));

    const errorApp = express();
    errorApp.use(express.raw({ type: "*/*", limit: "1mb" }));
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
