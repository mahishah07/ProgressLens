jest.mock("../src/repositories/reportRepository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByStudent: jest.fn(),
  updateReview: jest.fn(),
  saveOpenAiAnalysis: jest.fn(),
}));

jest.mock("../src/repositories/writingSampleRepository", () => ({
  create: jest.fn(),
  markAnalysed: jest.fn(),
  findFileById: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");

const reportRepository = require(
  "../src/repositories/reportRepository"
);

const writingSampleRepository = require(
  "../src/repositories/writingSampleRepository"
);

function createCastError(value) {
  const error = new Error(
    `Cast to ObjectId failed for value "${value}"`
  );

  error.name = "CastError";
  error.path = "_id";
  error.value = value;

  return error;
}

describe("Malformed MongoDB ID handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/reports/:reportId returns 400 for a malformed ID", async () => {
    reportRepository.findById.mockRejectedValue(
      createCastError("not-a-valid-id")
    );

    const response = await request(app).get(
      "/api/reports/not-a-valid-id"
    );

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toEqual(expect.any(String));

    expect(reportRepository.findById).toHaveBeenCalledWith(
      "not-a-valid-id"
    );
  });

  test("PATCH /api/reports/:reportId/review returns 400 for a malformed ID", async () => {
    reportRepository.updateReview.mockRejectedValue(
      createCastError("not-a-valid-id")
    );

    const response = await request(app)
      .patch("/api/reports/not-a-valid-id/review")
      .send({
        reviewStatus: "in_review",
        educatorSummary: "Review in progress.",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toEqual(expect.any(String));

    expect(reportRepository.updateReview).toHaveBeenCalledWith(
      "not-a-valid-id",
      expect.objectContaining({
        reviewStatus: "in_review",
        educatorSummary: "Review in progress.",
      })
    );
  });

  test("GET /api/writing-samples/:sampleId/file returns 400 for a malformed ID", async () => {
    writingSampleRepository.findFileById.mockRejectedValue(
      createCastError("not-a-valid-id")
    );

    const response = await request(app).get(
      "/api/writing-samples/not-a-valid-id/file"
    );

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toEqual(expect.any(String));

    expect(
      writingSampleRepository.findFileById
    ).toHaveBeenCalledWith("not-a-valid-id");
  });

  test("the server remains usable after receiving a malformed ID", async () => {
    reportRepository.findById.mockRejectedValue(
      createCastError("bad-id")
    );

    const invalidResponse = await request(app).get(
      "/api/reports/bad-id"
    );

    expect(invalidResponse.statusCode).toBe(400);

    const healthResponse = await request(app).get(
      "/api/health"
    );

    expect(healthResponse.statusCode).toBe(200);
    expect(healthResponse.body.status).toBe("ok");
  });
});