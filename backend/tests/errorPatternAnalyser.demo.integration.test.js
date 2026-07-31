const studentRepository = require("../src/repositories/studentRepository");
const reportRepository = require("../src/repositories/reportRepository");
const { processWritingSample } = require("../src/services/reportPipelineService");
const { analyseReportWithOpenAi } = require("../src/services/interventionRecommendationService");

jest.mock("../src/repositories/studentRepository", () => ({
  create: jest.fn(),
  findByStudentId: jest.fn(),
  search: jest.fn(),
}));

jest.mock("../src/repositories/reportRepository", () => ({
  findById: jest.fn(),
  findByStudent: jest.fn(),
  updateReview: jest.fn(),
  saveOpenAiAnalysis: jest.fn(),
}));

jest.mock("../src/services/reportPipelineService", () => ({
  processWritingSample: jest.fn(),
}));

jest.mock("../src/services/interventionRecommendationService", () => ({
  analyseReportWithOpenAi: jest.fn(),
}));

jest.mock("../src/middleware/upload", () => ({
  single: () => (req, res, next) => {
    req.file = {
      path: "/tmp/demo-writing-sample.png",
      originalname: "demo-writing-sample.png",
      filename: "demo-writing-sample.png",
      mimetype: "image/png",
      size: 1024,
    };
    next();
  },
}));

const request = require("supertest");
const app = require("../src/app");

const student = {
  _id: "student-db-id",
  studentId: "0707",
  name: "Student 0707",
};

const report = {
  _id: "report-db-id",
  student,
  writingSample: {
    _id: "sample-db-id",
    cleanedText: "last saterday i went to the park",
  },
  tokens: ["last", "saterday", "i", "went", "to", "the", "park"],
  errors: [{
    _id: "error-db-id",
    type: "SPELLING_ERROR",
    category: "Spelling",
    actual: "saterday",
    actualIndex: 1,
    message: "Possible spelling error.",
  }],
  errorCounts: {
    spelling: 1,
    phonetic: 0,
    insertion: 0,
    deletion: 0,
    letterReversal: 0,
    total: 1,
  },
  chartData: [{
    key: "spelling",
    label: "Spelling",
    count: 1,
    percentage: 100,
    color: "#7E3CC8",
  }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Error Pattern Analyser demo integration", () => {
  test("IT-01 creates a student profile through the API", async () => {
    studentRepository.create.mockResolvedValue(student);

    const response = await request(app).post("/api/students").send({
      studentId: "0707",
      name: "Student 0707",
      age: 9,
      yearLevel: "Primary 3",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).toEqual(student);
    expect(studentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      studentId: "0707",
      name: "Student 0707",
    }));
  });

  test("IT-02 rejects a duplicate student profile", async () => {
    studentRepository.create.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));

    const response = await request(app).post("/api/students").send({
      studentId: "0707",
      name: "Student 0707",
    });

    expect(response.statusCode).toBe(409);
    expect(response.body.error).toBe("Student profile already exists.");
  });

  test("IT-03 uploads and links a writing sample to the selected student", async () => {
    processWritingSample.mockResolvedValue({
      student,
      writingSample: { _id: "sample-db-id", status: "analysed" },
      report: { _id: "report-db-id", writingSample: "sample-db-id" },
    });

    const response = await request(app).post("/api/uploads/writing-sample").send({
      studentId: "0707",
      expectedText: "Last Saturday I went to the park.",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.report.writingSample).toBe("sample-db-id");
    expect(processWritingSample).toHaveBeenCalledWith(expect.objectContaining({
      studentId: "0707",
      expectedText: "Last Saturday I went to the park.",
      file: expect.objectContaining({ originalname: "demo-writing-sample.png" }),
    }));
  });

  test("IT-04 and IT-12 analyse errors and save corrections and recommendations on the same sample", async () => {
    reportRepository.findById.mockResolvedValue(report);
    analyseReportWithOpenAi.mockResolvedValue({
      corrections: [{
        errorId: "error-db-id",
        expectedCorrection: "Saturday",
        explanation: "Correct spelling for the sentence context.",
      }],
      recommendation: {
        status: "completed",
        overview: "Practise high-frequency spelling patterns.",
        dominantPattern: "Spelling",
        interventions: [{
          title: "Word mapping",
          rationale: "Reinforces the expected letter sequence.",
          activities: ["Map Saturday by sound and letter"],
          frequency: "3 times/week",
        }],
        educatorCaution: "Review the correction before finalising.",
        model: "test-model",
        generatedAt: "2026-07-30T00:00:00.000Z",
        error: "",
      },
    });
    reportRepository.saveOpenAiAnalysis.mockImplementation(
      async (reportId, writingSampleId, errors, recommendation) => ({
        ...report,
        _id: reportId,
        writingSample: { ...report.writingSample, _id: writingSampleId },
        errors,
        interventionRecommendation: recommendation,
      })
    );

    const response = await request(app).post("/api/reports/report-db-id/analyse");

    expect(response.statusCode).toBe(200);
    expect(response.body.data.errors[0]).toMatchObject({
      _id: "error-db-id",
      expectedCorrection: "Saturday",
      correctionSource: "openai",
    });
    expect(response.body.data.interventionRecommendation.status).toBe("completed");
    expect(reportRepository.saveOpenAiAnalysis).toHaveBeenCalledWith(
      "report-db-id",
      "sample-db-id",
      expect.arrayContaining([expect.objectContaining({ _id: "error-db-id" })]),
      expect.objectContaining({ status: "completed" })
    );
  });

  test("IT-05 does not persist partial results when OpenAI fails", async () => {
    reportRepository.findById.mockResolvedValue(report);
    analyseReportWithOpenAi.mockRejectedValue(new Error("OpenAI timeout"));

    const response = await request(app).post("/api/reports/report-db-id/analyse");

    expect(response.statusCode).toBe(500);
    expect(reportRepository.saveOpenAiAnalysis).not.toHaveBeenCalled();
  });

  test("IT-06 saves educator review edits and finalised state", async () => {
    reportRepository.updateReview.mockResolvedValue({
      ...report,
      reviewStatus: "finalised",
      educatorSummary: "Correction reviewed and accepted.",
    });

    const response = await request(app)
      .patch("/api/reports/report-db-id/review")
      .send({
        reviewStatus: "finalised",
        educatorSummary: "Correction reviewed and accepted.",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.reviewStatus).toBe("finalised");
    expect(reportRepository.updateReview).toHaveBeenCalledWith(
      "report-db-id",
      expect.objectContaining({
        reviewStatus: "finalised",
        finalisedAt: expect.any(Date),
      })
    );
  });
});
