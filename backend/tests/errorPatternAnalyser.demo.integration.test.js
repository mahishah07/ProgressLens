const mongoose = require("mongoose");
const studentRepository = require("../src/repositories/studentRepository");
const reportRepository = require("../src/repositories/reportRepository");
const writingSampleRepository = require("../src/repositories/writingSampleRepository");
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

jest.mock("../src/repositories/writingSampleRepository", () => ({
  create: jest.fn(),
  markAnalysed: jest.fn(),
  findFileById: jest.fn(),
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
      buffer: Buffer.from("demo writing sample"),
      path: "/tmp/demo-writing-sample.png",
      originalname: "demo-writing-sample.png",
      filename: "demo-writing-sample.png",
      mimetype: "image/png",
      size: 1024,
    };

    next();
  },

  enforceFileSizeLimit: (req, res, next) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (req.file && req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: "File must not exceed 10 MB.",
      });
    }

    return next();
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
  mongoose.connection.transaction = jest.fn(async (callback) => callback("test-session"));
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
      writingSample: { _id: "sample-db-id", status: "uploaded" },
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
      correctedText: "Last Saturday I went to the park.",
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
      async (reportId, writingSampleId, errors, expectedText, recommendation) => ({
        ...report,
        _id: reportId,
        writingSample: { ...report.writingSample, _id: writingSampleId },
        errors,
        expectedText,
        interventionRecommendation: recommendation,
      })
    );
    writingSampleRepository.markAnalysed.mockResolvedValue({ status: "analysed" });

    const response = await request(app).post("/api/reports/report-db-id/analyse");

    expect(response.statusCode).toBe(200);
    expect(response.body.data.errors[0]).toMatchObject({
      _id: "error-db-id",
      expectedCorrection: "Saturday",
      correctionSource: "openai",
    });
    expect(response.body.data.interventionRecommendation.status).toBe("completed");
    expect(
  reportRepository.saveOpenAiAnalysis
).toHaveBeenCalledWith(
  "report-db-id",
  "sample-db-id",

  expect.arrayContaining([
    expect.objectContaining({
      _id: "error-db-id",
    }),

    expect.objectContaining({
      type: "CAPITALIZATION_ERROR",
      actual: "last",
      expectedCorrection: "Last",
    }),

    expect.objectContaining({
      type: "CAPITALIZATION_ERROR",
      actual: "i",
      expectedCorrection: "I",
    }),
  ]),

  "Last Saturday I went to the park.",

  expect.objectContaining({
    status: "completed",
  }),

  "test-session",

  expect.objectContaining({
    chartData: expect.any(Array),

    errorCounts: expect.objectContaining({
      phonetic: 1,
      grammar: 2,
      total: 3,
    }),

    summary: expect.objectContaining({
      errorCount: 3,
    }),
  })
);
    expect(writingSampleRepository.markAnalysed).toHaveBeenCalledWith(
      "sample-db-id",
      expect.objectContaining({
        expectedText: "Last Saturday I went to the park.",
        recommendedIntervention: expect.stringContaining("Word mapping"),
      }),
      "test-session"
    );
  });

  test("IT-04d derives reversal, phonetic and deletion categories for narrative writing", async () => {
    const narrativeReport = {
      ...report,
      writingSample: { _id: "narrative-sample-id", cleanedText: "the bog went nite" },
      tokens: ["the", "bog", "went", "nite"],
      errors: [
        { _id: "bog-error", type: "SPELLING_ERROR", category: "Spelling", actual: "bog", actualIndex: 1, message: "Spelling error." },
        { _id: "nite-error", type: "SPELLING_ERROR", category: "Spelling", actual: "nite", actualIndex: 3, message: "Spelling error." },
      ],
      summary: { wordCount: 4, sentenceCount: 1, errorCount: 2 },
      errorCounts: { spelling: 2, phonetic: 0, insertion: 0, deletion: 0, letterReversal: 0, total: 2 },
      chartData: [],
      answerKey: null,
    };
    reportRepository.findById.mockResolvedValue(narrativeReport);
    analyseReportWithOpenAi.mockResolvedValue({
      correctedText: "the dog went home at night",
      corrections: [
        { errorId: "bog-error", expectedCorrection: "dog", explanation: "Letter form correction." },
        { errorId: "nite-error", expectedCorrection: "night", explanation: "Phonetic spelling correction." },
      ],
      recommendation: {
        status: "completed",
        overview: "Practise sound and letter mapping.",
        dominantPattern: "Mixed transcription errors",
        interventions: [{ title: "Word mapping", rationale: "Builds sound-symbol accuracy.", activities: ["Map words"], frequency: "Weekly" }],
        educatorCaution: "Review first.",
      },
    });
    reportRepository.saveOpenAiAnalysis.mockResolvedValue(narrativeReport);
    writingSampleRepository.markAnalysed.mockResolvedValue({ status: "analysed" });

    const response = await request(app).post("/api/reports/report-db-id/analyse");

    expect(response.statusCode).toBe(200);
    const savedErrors = reportRepository.saveOpenAiAnalysis.mock.calls[0][2];
    const savedMetrics = reportRepository.saveOpenAiAnalysis.mock.calls[0][6];
    expect(savedErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ _id: "bog-error", type: "LETTER_REVERSAL" }),
      expect.objectContaining({ _id: "nite-error", type: "PHONETIC_ERROR" }),
      expect.objectContaining({ type: "DELETION" }),
    ]));
    expect(savedMetrics.errorCounts).toMatchObject({ letterReversal: 1, phonetic: 1, deletion: 2, total: 4 });
    expect(savedMetrics.chartData.find((item) => item.key === "deletion").count).toBe(2);
  });

  test("IT-04b supports the frontend analyze spelling and dashboard route", async () => {
    reportRepository.findById.mockResolvedValue(report);
    analyseReportWithOpenAi.mockResolvedValue({
      correctedText: "Last Saturday I went to the park.",
      corrections: [{ errorId: "error-db-id", expectedCorrection: "Saturday", explanation: "Correct spelling." }],
      recommendation: {
        status: "completed",
        overview: "Practise spelling.",
        dominantPattern: "Spelling",
        interventions: [{ title: "Word mapping", rationale: "Builds recall.", activities: ["Map Saturday"], frequency: "Weekly" }],
        educatorCaution: "Review first.",
      },
    });
    reportRepository.saveOpenAiAnalysis.mockResolvedValue(report);
    writingSampleRepository.markAnalysed.mockResolvedValue({ status: "analysed" });

    const analyseResponse = await request(app).post("/api/reports/report-db-id/analyze");
    expect(analyseResponse.statusCode).toBe(200);

    reportRepository.findById.mockResolvedValue(report);
    const dashboardResponse = await request(app).get("/api/error/report-db-id/dashboard");
    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.body.data._id).toBe("report-db-id");
  });

  test("IT-04c downloads the file stored in MongoDB", async () => {
    writingSampleRepository.findFileById.mockResolvedValue({
      originalName: "student work.pdf",
      mimeType: "application/pdf",
      fileSize: 9,
      fileData: Buffer.from("pdf-bytes"),
    });

    const response = await request(app).get("/api/writing-samples/sample-db-id/file");
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.body).toEqual(Buffer.from("pdf-bytes"));
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
