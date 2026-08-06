jest.mock("../src/services/reportPipelineService", () => ({
  processWritingSample: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");

const {
  processWritingSample,
} = require("../src/services/reportPipelineService");

const LIMIT = 10 * 1024 * 1024;

beforeEach(() => {
  jest.clearAllMocks();

  processWritingSample.mockResolvedValue({
    student: {
      id: "student-db-id",
      studentId: "DAS-001",
      name: "Test Student",
    },
    writingSample: {
      _id: "sample-id",
      status: "uploaded",
    },
    report: {
      _id: "report-id",
    },
  });
});

describe("Writing sample upload route", () => {
  test("requires a file", async () => {
    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "DAS-001");

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "No writing sample uploaded."
    );

    expect(processWritingSample).not.toHaveBeenCalled();
  });

  test("rejects unsupported file formats", async () => {
    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "DAS-001")
      .attach("assignment", Buffer.from("invalid file"), {
        filename: "malware.exe",
        contentType: "application/octet-stream",
      });

    expect(response.statusCode).toBe(415);
    expect(processWritingSample).not.toHaveBeenCalled();
  });

  test.each([
    ["PDF", "essay.pdf", "application/pdf"],
    ["TXT", "essay.txt", "text/plain"],
    [
      "DOCX",
      "essay.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    ["JPEG with .jpg", "essay.jpg", "image/jpeg"],
    ["JPEG with .jpeg", "essay.jpeg", "image/jpeg"],
    ["PNG", "essay.png", "image/png"],
    ["TIFF", "essay.tiff", "image/tiff"],
    ["BMP", "essay.bmp", "image/bmp"],
  ])(
    "accepts a supported %s file",
    async (_, filename, contentType) => {
      const response = await request(app)
        .post("/api/uploads/writing-sample")
        .field("studentId", "DAS-001")
        .attach(
          "assignment",
          Buffer.from("test file content"),
          {
            filename,
            contentType,
          }
        );

      expect(response.statusCode).toBe(201);

      expect(processWritingSample).toHaveBeenCalledTimes(1);

      expect(processWritingSample).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: "DAS-001",
          file: expect.objectContaining({
            originalname: filename,
            mimetype: contentType,
          }),
        })
      );
    }
  );

  test.each([
    ["PDF extension with TXT MIME", "essay.pdf", "text/plain"],
    ["TXT extension with PDF MIME", "essay.txt", "application/pdf"],
    ["JPG extension with PNG MIME", "essay.jpg", "image/png"],
    ["PNG extension with JPEG MIME", "essay.png", "image/jpeg"],
    [
      "DOCX extension with old DOC MIME",
      "essay.docx",
      "application/msword",
    ],
  ])(
    "rejects a MIME mismatch: %s",
    async (_, filename, contentType) => {
      const response = await request(app)
        .post("/api/uploads/writing-sample")
        .field("studentId", "DAS-001")
        .attach("assignment", Buffer.from("invalid"), {
          filename,
          contentType,
        });

      expect(response.statusCode).toBe(415);
      expect(processWritingSample).not.toHaveBeenCalled();
    }
  );

  test.each([
    ["just below", LIMIT - 1, 201],
    ["exactly at", LIMIT, 201],
    ["just above", LIMIT + 1, 400],
  ])(
    "handles a file %s the 10 MB limit",
    async (_, size, expectedStatus) => {
      const response = await request(app)
        .post("/api/uploads/writing-sample")
        .field("studentId", "DAS-001")
        .attach("assignment", Buffer.alloc(size), {
          filename: "sample.pdf",
          contentType: "application/pdf",
        });

      expect(response.statusCode).toBe(expectedStatus);

      if (expectedStatus === 201) {
        expect(processWritingSample).toHaveBeenCalledTimes(1);
      } else {
        expect(processWritingSample).not.toHaveBeenCalled();
      }
    }
  );
});