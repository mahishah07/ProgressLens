const request = require("supertest");
const app = require("../src/app");

describe("Analysis API routes", () => {
  test("POST /api/analyse should return 400 if essayText is missing", async () => {
    const response = await request(app)
      .post("/api/analyse")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("essayText is required and must be a non-empty string.");
  });

  test("POST /api/analyse should analyse essay text", async () => {
    const response = await request(app)
      .post("/api/analyse")
      .send({
        essayText: "Teh dog dog ran home.",
        expectedText: "The dog ran home.",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("cleanedText");
    expect(response.body.data).toHaveProperty("tokens");
    expect(response.body.data).toHaveProperty("sentences");
    expect(response.body.data).toHaveProperty("summary");
    expect(response.body.data).toHaveProperty("errors");

    expect(Array.isArray(response.body.data.errors)).toBe(true);
    expect(response.body.data.summary.errorCount).toBeGreaterThan(0);
  });
});