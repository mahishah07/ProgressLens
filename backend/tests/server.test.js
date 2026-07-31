const request = require("supertest");
const app = require("../src/app");

describe("Basic server test", () => {
  test("GET / should return API running message", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("DAS Error Pattern Analysis API is running");
  });

  test("GET /api/health should return backend status ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.message).toBe("Backend is running");
  });

  test("Unknown route should return 404", async () => {
    const response = await request(app).get("/wrong-route");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Route not found");
  });
});
