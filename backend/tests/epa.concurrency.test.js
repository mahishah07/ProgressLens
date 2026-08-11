const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

jest.mock("../src/services/interventionRecommendationService", () => ({
  analyseReportWithOpenAi: jest.fn(),
}));

const { analyseReportWithOpenAi } = require("../src/services/interventionRecommendationService");
const { createApp } = require("../src/app");
const StudentProfile = require("../src/models/studentProfile");
const WritingSample = require("../src/models/writingSample");
const AnalysisReport = require("../src/models/analysisReport");
const studentRepository = require("../src/repositories/studentRepository");
const writingSampleRepository = require("../src/repositories/writingSampleRepository");
const reportRepository = require("../src/repositories/reportRepository");
const { processWritingSample } = require("../src/services/reportPipelineService");

jest.setTimeout(120000);

const app = createApp({ env: { NODE_ENV: "test", CORS_ORIGINS: "http://localhost:5173" } });
let replSet;

function studentPayload(studentId, index = 0) {
  return {
    studentId,
    name: `Concurrency Student ${index}`,
    age: 9,
    yearLevel: "Primary 3",
  };
}

function fileFixture(index = 0) {
  const buffer = Buffer.from(`concurrency-file-${index}`);
  return {
    path: `/tmp/concurrency-${index}.pdf`,
    buffer,
    originalname: `concurrency-${index}.pdf`,
    filename: `concurrency-${index}.pdf`,
    mimetype: "application/pdf",
    size: buffer.length,
  };
}

function pipelineDependencies(text = "The bog ran home.") {
  return {
    studentRepository,
    writingSampleRepository,
    reportRepository,
    extractDocument: jest.fn().mockResolvedValue({
      content: text,
      handwrittenText: text,
      tables: [],
    }),
    checkSpelling: jest.fn().mockResolvedValue([]),
  };
}

async function createWorkflow(studentId, index = 0) {
  return processWritingSample(
    {
      studentId,
      expectedText: "The dog ran home.",
      file: fileFixture(index),
    },
    pipelineDependencies(),
  );
}

function openAiResultFor(errors, correctedText = "The dog ran home.") {
  return {
    correctedText,
    corrections: errors.map((error) => ({
      errorId: String(error._id),
      expectedCorrection: error.expected || "dog",
      explanation: "Synthetic concurrency-test correction.",
    })),
    grammarErrors: [],
    recommendation: {
      status: "completed",
      overview: "Practise accurate letter recognition.",
      dominantPattern: "Letter substitution",
      interventions: [{
        title: "Letter mapping",
        rationale: "Supports accurate recognition.",
        activities: ["Contrast b and d"],
        frequency: "3 times/week",
      }],
      educatorCaution: "Educator review is required.",
      model: "concurrency-test-model",
      generatedAt: new Date().toISOString(),
      error: "",
    },
  };
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri(), { dbName: "progresslens-epa-concurrency" });
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

describe("EPA concurrency and data-integrity tests", () => {
  test("CON-001: duplicate student creates yield one record", async () => {
    const payload = studentPayload("EPA-RACE-001");
    const responses = await Promise.all([
      request(app).post("/api/students").send(payload),
      request(app).post("/api/students").send(payload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await StudentProfile.countDocuments({ studentId: payload.studentId })).toBe(1);
  });

  test("CON-002: duplicate writing uploads create two complete, distinct report/sample pairs", async () => {
    await StudentProfile.create(studentPayload("EPA-RACE-002"));

    const results = await Promise.all([
      createWorkflow("EPA-RACE-002", 1),
      createWorkflow("EPA-RACE-002", 2),
    ]);

    expect(new Set(results.map((result) => String(result.writingSample._id))).size).toBe(2);
    expect(new Set(results.map((result) => String(result.report._id))).size).toBe(2);
    expect(await WritingSample.countDocuments()).toBe(2);
    expect(await AnalysisReport.countDocuments()).toBe(2);
    for (const result of results) {
      const report = await AnalysisReport.findById(result.report._id);
      expect(String(report.writingSample)).toBe(String(result.writingSample._id));
    }
  });

  test("CON-003: analysing the same report twice leaves one internally consistent result", async () => {
    await StudentProfile.create(studentPayload("EPA-RACE-003"));
    const workflow = await createWorkflow("EPA-RACE-003", 3);
    analyseReportWithOpenAi.mockImplementation(async ({ errors }) => openAiResultFor(errors));

    const responses = await Promise.all([
      request(app).post(`/api/reports/${workflow.report._id}/analyse`),
      request(app).post(`/api/reports/${workflow.report._id}/analyse`),
    ]);

    expect(responses.every((response) => response.status === 200)).toBe(true);
    const report = await AnalysisReport.findById(workflow.report._id);
    const sample = await WritingSample.findById(workflow.writingSample._id);
    expect(await AnalysisReport.countDocuments({ _id: workflow.report._id })).toBe(1);
    expect(report.summary.errorCount).toBe(report.errors.length);
    expect(report.errorCounts.total).toBe(report.errors.length);
    expect(new Set(report.errors.map((error) => String(error._id))).size).toBe(report.errors.length);
    expect(report.interventionRecommendation.status).toBe("completed");
    expect(sample.status).toBe("analysed");
    expect(sample.expectedText).toBe(report.expectedText);
  });

  test("CON-004: educator review made during analysis is not lost", async () => {
    await StudentProfile.create(studentPayload("EPA-RACE-004"));
    const workflow = await createWorkflow("EPA-RACE-004", 4);
    const original = await AnalysisReport.findById(workflow.report._id);
    const reviewedErrors = original.errors.map((error, index) => ({
      ...error.toObject(),
      reviewStatus: index === 0 ? "accepted" : error.reviewStatus,
      educatorNotes: index === 0 ? "Reviewed while AI was running." : error.educatorNotes,
    }));
    let releaseAnalysis;
    const analysisCanFinish = new Promise((resolve) => { releaseAnalysis = resolve; });
    let markOpenAiStarted;
    const openAiStarted = new Promise((resolve) => { markOpenAiStarted = resolve; });
    analyseReportWithOpenAi.mockImplementation(async ({ errors }) => {
      markOpenAiStarted();
      await analysisCanFinish;
      return openAiResultFor(errors);
    });

    const analysisRequest = request(app).post(`/api/reports/${workflow.report._id}/analyse`);
    const analysisPromise = analysisRequest.then((response) => response);
    await openAiStarted;
    const reviewResponse = await request(app)
      .patch(`/api/reports/${workflow.report._id}/review`)
      .send({
        reviewStatus: "in_review",
        educatorSummary: "Concurrent educator summary.",
        errors: reviewedErrors,
      });
    expect(reviewResponse.status).toBe(200);
    releaseAnalysis();
    const analysisResponse = await analysisPromise;

    expect(analysisResponse.status).toBe(200);
    const stored = await AnalysisReport.findById(workflow.report._id);
    expect(stored.reviewStatus).toBe("in_review");
    expect(stored.educatorSummary).toBe("Concurrent educator summary.");
    expect(stored.errors[0].reviewStatus).toBe("accepted");
    expect(stored.errors[0].educatorNotes).toBe("Reviewed while AI was running.");
  });

  test("CON-008: ten parallel uploads preserve student ownership", async () => {
    const students = await StudentProfile.create(
      Array.from({ length: 10 }, (_, index) => studentPayload(`EPA-PAR-${index}`, index)),
    );

    const results = await Promise.all(
      students.map((student, index) => createWorkflow(student.studentId, index + 10)),
    );

    expect(results).toHaveLength(10);
    for (let index = 0; index < students.length; index += 1) {
      const sample = await WritingSample.findById(results[index].writingSample._id);
      const report = await AnalysisReport.findById(results[index].report._id);
      expect(String(sample.student)).toBe(String(students[index]._id));
      expect(String(report.student)).toBe(String(students[index]._id));
      expect(String(report.writingSample)).toBe(String(sample._id));
      expect(sample.originalName).toBe(`concurrency-${index + 10}.pdf`);
    }
    expect(await WritingSample.countDocuments()).toBe(10);
    expect(await AnalysisReport.countDocuments()).toBe(10);
  });
});
