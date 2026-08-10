const http = require("http");
const express = require("express");
const request = require("supertest");
const {
  createGatewayApp,
} = require("../../gateway/server");

function listen(app) {
  return new Promise((resolve) => {
    const server = http
      .createServer(app)
      .listen(
        0,
        "127.0.0.1",
        () => resolve(server)
      );
  });
}

function closeServer(server) {
  if (!server) {
    return Promise.resolve();
  }

  if (
    typeof server.closeAllConnections === "function"
  ) {
    server.closeAllConnections();
  }

  return new Promise((resolve) => {
    server.close(resolve);
  });
}

function urlFor(server) {
  return `http://127.0.0.1:${server.address().port}`;
}

function createProgressApp() {
  const app = express();

  app.get("/", (req, res) => {
    res.json({
      status: "ok",
    });
  });

  app.all("/api/{*path}", (req, res) => {
    res.json({
      service: "progress",
      path: req.path,
      requestId:
        req.headers["x-request-id"] || null,
    });
  });

  return app;
}

function createErrorApp() {
  const app = express();

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
    });
  });

  app.all("/api/{*path}", (req, res) => {
    res.json({
      service: "error-analyser",
      path: req.path,
      requestId:
        req.headers["x-request-id"] || null,
    });
  });

  return app;
}

describe("Gateway robustness", () => {
  let progressServer;
  let errorServer;
  let progressTarget;
  let errorTarget;

  beforeAll(async () => {
    progressServer = await listen(
      createProgressApp()
    );

    errorServer = await listen(
      createErrorApp()
    );

    progressTarget = urlFor(progressServer);
    errorTarget = urlFor(errorServer);
  });

  afterAll(async () => {
    await Promise.all([
      closeServer(progressServer),
      closeServer(errorServer),
    ]);
  });

  describe("GW-004 - request identity", () => {
    test("generates a request ID when one is not supplied", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget: errorTarget,
      });

      const response = await request(gateway).get(
        "/api/progress/student-1/dashboard"
      );

      expect(response.statusCode).toBe(200);

      expect(
        response.headers["x-request-id"]
      ).toEqual(expect.any(String));

      expect(
        response.headers["x-request-id"].length
      ).toBeGreaterThan(0);

      expect(response.body.requestId).toBe(
        response.headers["x-request-id"]
      );
    });

    test("preserves a supplied request ID", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget: errorTarget,
      });

      const response = await request(gateway)
        .get(
          "/api/progress/student-1/dashboard"
        )
        .set(
          "X-Request-Id",
          "request-test-123"
        );

      expect(response.statusCode).toBe(200);

      expect(
        response.headers["x-request-id"]
      ).toBe("request-test-123");

      expect(response.body.requestId).toBe(
        "request-test-123"
      );
    });

    test("forwards generated request ID to Error Analyser", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget: errorTarget,
      });

      const response = await request(gateway).get(
        "/api/error-analyser/reports/report-1"
      );

      expect(response.statusCode).toBe(200);

      expect(
        response.headers["x-request-id"]
      ).toEqual(expect.any(String));

      expect(response.body.requestId).toBe(
        response.headers["x-request-id"]
      );
    });

    test("different requests receive different generated IDs", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget: errorTarget,
      });

      const first = await request(gateway).get(
        "/api/progress/student-1/dashboard"
      );

      const second = await request(gateway).get(
        "/api/progress/student-2/dashboard"
      );

      expect(
        first.headers["x-request-id"]
      ).toEqual(expect.any(String));

      expect(
        second.headers["x-request-id"]
      ).toEqual(expect.any(String));

      expect(
        first.headers["x-request-id"]
      ).not.toBe(
        second.headers["x-request-id"]
      );
    });
  });

  describe("GW-007 - upstream unavailable", () => {
    test("returns controlled 502 when Progress Monitoring is unavailable", async () => {
      const gateway = createGatewayApp({
        progressTarget:
          "http://127.0.0.1:1",
        errorAnalyserTarget: errorTarget,
      });

      const response = await request(gateway)
        .get(
          "/api/progress/student-1/dashboard"
        )
        .set(
          "X-Request-Id",
          "progress-failure-123"
        );

      expect(response.statusCode).toBe(502);

      expect(
        response.headers["x-request-id"]
      ).toBe("progress-failure-123");

      expect(response.body).toEqual(
        expect.objectContaining({
          requestId: "progress-failure-123",
        })
      );

      expect(response.body.error).toEqual(
        expect.any(String)
      );
    });

    test("returns controlled 502 when Error Analyser is unavailable", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget:
          "http://127.0.0.1:1",
      });

      const response = await request(gateway)
        .get(
          "/api/error-analyser/reports/report-1"
        )
        .set(
          "X-Request-Id",
          "error-failure-123"
        );

      expect(response.statusCode).toBe(502);

      expect(
        response.headers["x-request-id"]
      ).toBe("error-failure-123");

      expect(response.body).toEqual(
        expect.objectContaining({
          requestId: "error-failure-123",
        })
      );

      expect(response.body.error).toEqual(
        expect.any(String)
      );
    });

    test("gateway remains usable after an upstream connection failure", async () => {
      const gateway = createGatewayApp({
        progressTarget:
          "http://127.0.0.1:1",
        errorAnalyserTarget: errorTarget,
      });

      const failedResponse =
        await request(gateway).get(
          "/api/progress/student-1/dashboard"
        );

      expect(
        failedResponse.statusCode
      ).toBe(502);

      const workingResponse =
        await request(gateway).get(
          "/api/error-analyser/reports/report-1"
        );

      expect(
        workingResponse.statusCode
      ).toBe(200);

      expect(
        workingResponse.body.service
      ).toBe("error-analyser");
    });

    test("partial failure does not block the healthy Progress Monitoring service", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget:
          "http://127.0.0.1:1",
      });

      const failedResponse =
        await request(gateway).get(
          "/api/error-analyser/reports/report-1"
        );

      expect(
        failedResponse.statusCode
      ).toBe(502);

      const healthyResponse =
        await request(gateway).get(
          "/api/progress/student-1/dashboard"
        );

      expect(
        healthyResponse.statusCode
      ).toBe(200);

      expect(
        healthyResponse.body.service
      ).toBe("progress");
    });
  });

  describe("GW-008 - upstream timeout", () => {
    let slowServer;

    afterEach(async () => {
      await closeServer(slowServer);
      slowServer = null;
    });

    test(
      "returns 502 when an upstream exceeds the configured timeout",
      async () => {
        const slowApp = express();

        slowApp.get(
          "/api/{*path}",
          (req, res) => {
            setTimeout(() => {
              if (!res.headersSent) {
                res.json({
                    status: "slow",
              });
            }
          },1000)
        }
    );

        slowApp.get(
          "/",
          (req, res) => {
            res.json({
              status: "ok",
            });
          }
        );

        slowServer = await listen(slowApp);

        const slowTarget =
          urlFor(slowServer);

        const gateway = createGatewayApp({
          progressTarget: slowTarget,
          errorAnalyserTarget: errorTarget,
          proxyTimeoutMs: 100,
          timeoutMs: 100,
        });

        const response = await request(gateway)
          .get(
            "/api/progress/student-1/dashboard"
          )
          .set(
            "X-Request-Id",
            "timeout-request-123"
          );

        expect(
          response.statusCode
        ).toBe(502);

        expect(
          response.headers["x-request-id"]
        ).toBe(
          "timeout-request-123"
        );

        expect(response.body).toEqual(
          expect.objectContaining({
            requestId:
              "timeout-request-123",
          })
        );

        expect(
          response.body.error
        ).toEqual(expect.any(String));
      },
      5000
    );

    test("successful upstream response is not treated as a timeout", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget: errorTarget,
        proxyTimeoutMs: 100,
        timeoutMs: 100,
      });

      const response = await request(gateway)
        .get(
          "/api/progress/student-1/dashboard"
        )
        .set(
          "X-Request-Id",
          "normal-request-123"
        );

      expect(response.statusCode).toBe(200);

      expect(response.body.service).toBe(
        "progress"
      );

      expect(response.body.requestId).toBe(
        "normal-request-123"
      );
    });
  });

  describe("GW-009 - health decision table", () => {
    test("PMS up and EPA up returns 200 ok", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget: errorTarget,
      });

      const response = await request(gateway).get(
        "/health"
      );

      expect(response.statusCode).toBe(200);

      expect(response.body.status).toBe(
        "ok"
      );

      expect(
        response.body.services
          .progressMonitoring.status
      ).toBe("up");

      expect(
        response.body.services
          .errorAnalyser.status
      ).toBe("up");
    });

    test("PMS up and EPA down returns 503 degraded", async () => {
      const gateway = createGatewayApp({
        progressTarget,
        errorAnalyserTarget:
          "http://127.0.0.1:1",
      });

      const response = await request(gateway).get(
        "/health"
      );

      expect(response.statusCode).toBe(503);

      expect(response.body.status).toBe(
        "degraded"
      );

      expect(
        response.body.services
          .progressMonitoring.status
      ).toBe("up");

      expect(
        response.body.services
          .errorAnalyser.status
      ).toBe("down");
    });

    test("PMS down and EPA up returns 503 degraded", async () => {
      const gateway = createGatewayApp({
        progressTarget:
          "http://127.0.0.1:1",
        errorAnalyserTarget: errorTarget,
      });

      const response = await request(gateway).get(
        "/health"
      );

      expect(response.statusCode).toBe(503);

      expect(response.body.status).toBe(
        "degraded"
      );

      expect(
        response.body.services
          .progressMonitoring.status
      ).toBe("down");

      expect(
        response.body.services
          .errorAnalyser.status
      ).toBe("up");
    });

    test("PMS down and EPA down returns 503 degraded", async () => {
      const gateway = createGatewayApp({
        progressTarget:
          "http://127.0.0.1:1",
        errorAnalyserTarget:
          "http://127.0.0.1:1",
      });

      const response = await request(gateway).get(
        "/health"
      );

      expect(response.statusCode).toBe(503);

      expect(response.body.status).toBe(
        "degraded"
      );

      expect(
        response.body.services
          .progressMonitoring.status
      ).toBe("down");

      expect(
        response.body.services
          .errorAnalyser.status
      ).toBe("down");
    });
  });
});