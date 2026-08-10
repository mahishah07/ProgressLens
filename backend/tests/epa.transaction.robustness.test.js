jest.mock("../src/repositories/studentRepository", () => ({ findByStudentId: jest.fn() }));
jest.mock("../src/repositories/reportRepository", () => ({
  findById: jest.fn(), findByStudent: jest.fn(), updateReview: jest.fn(), saveOpenAiAnalysis: jest.fn(),
}));
jest.mock("../src/repositories/writingSampleRepository", () => ({
  markAnalysed: jest.fn(), findFileById: jest.fn(),
}));
jest.mock("../src/services/interventionRecommendationService", () => ({ analyseReportWithOpenAi: jest.fn() }));

const reportRepository = require("../src/repositories/reportRepository");
const writingSampleRepository = require("../src/repositories/writingSampleRepository");
const { analyseReportWithOpenAi } = require("../src/services/interventionRecommendationService");
const { analyseReport, downloadWritingSample } = require("../src/controllers/reportController");

function responseDouble() {
  return {
    statusCode: 200, body: undefined, headers: {},
    status: jest.fn(function status(code) { this.statusCode = code; return this; }),
    json: jest.fn(function json(body) { this.body = body; return this; }),
    setHeader: jest.fn(function setHeader(name, value) { this.headers[name] = value; }),
    send: jest.fn(function send(body) { this.body = body; return this; }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

/*
 * ROBUSTNESS AND STORAGE-STATE GROUP
 * Verifies distinct controlled responses for absent reports, absent writing samples and
 * historical records whose binary file is no longer available.
 */
describe("EPA missing-record and storage robustness", () => {
  test("RB-01 returns 404 for a missing report without calling OpenAI", async () => {
    reportRepository.findById.mockResolvedValue(null);
    const res = responseDouble();
    const next = jest.fn();
    await analyseReport({ params: { reportId: "missing" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(analyseReportWithOpenAi).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("RB-04 distinguishes missing sample from missing stored binary", async () => {
    const missingRes = responseDouble();
    writingSampleRepository.findFileById.mockResolvedValue(null);
    await downloadWritingSample({ params: { sampleId: "missing" } }, missingRes, jest.fn());
    expect(missingRes.status).toHaveBeenCalledWith(404);

    const goneRes = responseDouble();
    writingSampleRepository.findFileById.mockResolvedValue({ fileData: null });
    await downloadWritingSample({ params: { sampleId: "gone" } }, goneRes, jest.fn());
    expect(goneRes.status).toHaveBeenCalledWith(410);
  });

});
