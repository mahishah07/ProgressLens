const request = require("supertest");
const app = require("../src/app");

describe("Writing sample upload route", () => {
  test("requires a file", async () => {
    const response = await request(app).post("/api/uploads/writing-sample").field("studentId", "DAS-001");
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("No writing sample uploaded.");
  });

  test("rejects unsupported file formats", async () => {
    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "DAS-001")
      .attach("assignment", Buffer.from("essay"), { filename: "essay.txt", contentType: "text/plain" });
    expect(response.statusCode).toBe(415);
  });
});
