jest.mock("../src/services/ocrService", () => ({
  extractDocument: jest.fn(),
  extractTextFromPdf: jest.fn(),
  textFromSpans: jest.fn(),
}));

jest.mock("../src/repositories/studentRepository", () => ({
  create: jest.fn(),
  findByStudentId: jest.fn(),
  search: jest.fn(),
}));

jest.mock("../src/repositories/writingSampleRepository", () => ({
  create: jest.fn(),
  markAnalysed: jest.fn(),
  findFileById: jest.fn(),
}));

jest.mock("../src/repositories/reportRepository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByStudent: jest.fn(),
  updateReview: jest.fn(),
  saveOpenAiAnalysis: jest.fn(),
}));

jest.mock("../src/repositories/answerKeyRepository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findFileById: jest.fn(),
}));

const request = require("supertest");

const {
  extractDocument,
} = require("../src/services/ocrService");

const studentRepository = require(
  "../src/repositories/studentRepository"
);

const writingSampleRepository = require(
  "../src/repositories/writingSampleRepository"
);

const reportRepository = require(
  "../src/repositories/reportRepository"
);

const app = require("../src/app");

jest.setTimeout(30000);

describe("OCR failure integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    studentRepository.findByStudentId.mockResolvedValue({
      _id: "student-db-id",
      studentId: "OCR-FAIL-001",
      name: "OCR Failure Test Student",
    });
  });

  test.each([
    ["Azure 401 authentication failure", 401],
    ["Azure 429 rate limit failure", 429],
    ["Azure 500 server failure", 500],
  ])(
    "OCR-003 leaves no writing sample or report after %s",
    async (_, azureStatus) => {
      const error = new Error(
        `Azure OCR failed with ${azureStatus}`
      );

      error.statusCode = 503;
      error.azureStatusCode = azureStatus;

      extractDocument.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/uploads/writing-sample")
        .field("studentId", "OCR-FAIL-001")
        .attach(
          "assignment",
          Buffer.from("%PDF-1.4\nOCR failure fixture"),
          {
            filename: "ocr-failure.pdf",
            contentType: "application/pdf",
          }
        );

      expect(response.statusCode).toBe(503);
      expect(response.body.success).toBe(false);

      expect(
        writingSampleRepository.create
      ).not.toHaveBeenCalled();

      expect(
        reportRepository.create
      ).not.toHaveBeenCalled();

      expect(
        writingSampleRepository.markAnalysed
      ).not.toHaveBeenCalled();
    }
  );

  test("OCR-003 leaves no writing sample or report after timeout", async () => {
    const error = new Error(
      "Document OCR service is currently unavailable."
    );

    error.name = "AbortError";
    error.code = "ETIMEDOUT";
    error.statusCode = 503;

    extractDocument.mockRejectedValue(error);

    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "OCR-FAIL-001")
      .attach(
        "assignment",
        Buffer.from("%PDF-1.4\nOCR timeout fixture"),
        {
          filename: "ocr-timeout.pdf",
          contentType: "application/pdf",
        }
      );

    expect(response.statusCode).toBe(503);
    expect(response.body.success).toBe(false);

    expect(
      writingSampleRepository.create
    ).not.toHaveBeenCalled();

    expect(
      reportRepository.create
    ).not.toHaveBeenCalled();

    expect(
      writingSampleRepository.markAnalysed
    ).not.toHaveBeenCalled();
  });

  test("RP-008 rejects blank OCR text and creates no writing sample or report", async () => {
    extractDocument.mockResolvedValue({
      content: "",
      handwrittenText: "",
      tables: [],
    });

    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "OCR-FAIL-001")
      .attach(
        "assignment",
        Buffer.from("%PDF-1.4\nblank OCR fixture"),
        {
          filename: "blank-writing.pdf",
          contentType: "application/pdf",
        }
      );

    expect(response.statusCode).toBe(422);

    expect(response.body).toEqual({
      success: false,
      error:
        "No readable text was found in the uploaded writing sample.",
    });

    expect(
      writingSampleRepository.create
    ).not.toHaveBeenCalled();

    expect(
      reportRepository.create
    ).not.toHaveBeenCalled();

    expect(
      writingSampleRepository.markAnalysed
    ).not.toHaveBeenCalled();
  });

  test("RP-008 rejects whitespace-only OCR text and creates no writing sample or report", async () => {
    extractDocument.mockResolvedValue({
      content: "   \n\t   ",
      handwrittenText: "   ",
      tables: [],
    });

    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "OCR-FAIL-001")
      .attach(
        "assignment",
        Buffer.from("%PDF-1.4\nwhitespace fixture"),
        {
          filename: "whitespace-writing.pdf",
          contentType: "application/pdf",
        }
      );

    expect(response.statusCode).toBe(422);

    expect(
      writingSampleRepository.create
    ).not.toHaveBeenCalled();

    expect(
      reportRepository.create
    ).not.toHaveBeenCalled();

    expect(
      writingSampleRepository.markAnalysed
    ).not.toHaveBeenCalled();
  });

  test("OCR failure does not prevent the server from handling later requests", async () => {
    const error = new Error(
      "Document OCR service is currently unavailable."
    );

    error.statusCode = 503;

    extractDocument.mockRejectedValue(error);

    const failedResponse = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "OCR-FAIL-001")
      .attach(
        "assignment",
        Buffer.from("%PDF-1.4\nfailure fixture"),
        {
          filename: "failed.pdf",
          contentType: "application/pdf",
        }
      );

    expect(failedResponse.statusCode).toBe(503);

    const healthResponse = await request(app)
      .get("/api/health");

    expect(healthResponse.statusCode).toBe(200);
    expect(healthResponse.body.status).toBe("ok");

    expect(
      writingSampleRepository.create
    ).not.toHaveBeenCalled();

    expect(
      reportRepository.create
    ).not.toHaveBeenCalled();
  });
});