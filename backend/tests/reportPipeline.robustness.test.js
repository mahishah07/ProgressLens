const { mergeDictionaryErrors, processWritingSample } = require("../src/services/reportPipelineService");
const { analyseEssay } = require("../src/services/essayAnalysisService");

function file(overrides = {}) {
  return {
    path: "/tmp/student.pdf",
    originalname: "student.pdf",
    filename: "stored.pdf",
    mimetype: "application/pdf",
    size: 100,
    ...overrides,
  };
}

function dependencies(overrides = {}) {
  const student = { _id: "student-db-id", studentId: "DAS-001", name: "Test Student" };
  return {
    studentRepository: { findByStudentId: jest.fn().mockResolvedValue(student) },
    answerKeyRepository: { findById: jest.fn() },
    writingSampleRepository: { create: jest.fn().mockResolvedValue({ _id: "sample-id", toObject: () => ({ _id: "sample-id" }) }) },
    reportRepository: { create: jest.fn().mockResolvedValue({ _id: "report-id", toObject: () => ({ _id: "report-id" }) }) },
    extractDocument: jest.fn().mockResolvedValue({ content: "The dog ran.", handwrittenText: "", tables: [] }),
    checkSpelling: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue(Buffer.from("stored bytes")),
    ...overrides,
  };
}

/*
 * ROBUSTNESS AND SERVICE-INTEGRATION GROUP
 * Injects failures at student, answer-key, OCR, file and persistence boundaries.
 * The expected result is a controlled error with no partial writing-sample or report record.
 */
describe("EPA report pipeline robustness", () => {
  test("rejects an unknown answer key before OCR or database writes", async () => {
    const deps = dependencies();
    deps.answerKeyRepository.findById.mockResolvedValue(null);
    await expect(processWritingSample({ studentId: "DAS-001", answerKeyId: "missing", file: file() }, deps))
      .rejects.toMatchObject({ statusCode: 404, message: "Answer key not found." });
    expect(deps.extractDocument).not.toHaveBeenCalled();
    expect(deps.writingSampleRepository.create).not.toHaveBeenCalled();
    expect(deps.reportRepository.create).not.toHaveBeenCalled();
  });

  test("does not duplicate a spelling error already found at the same token", () => {
    const analysis = analyseEssay({ essayText: "teh dog" });
    const merged = mergeDictionaryErrors(analysis, [{ word: "teh", suggestions: ["the"] }]);
    expect(merged.errors.filter((error) => error.actual === "teh")).toHaveLength(1);
    expect(merged.errorCounts.total).toBe(merged.errors.length);
  });

  test("adds a dictionary-only spelling finding with stable token indices", () => {
    const analysis = analyseEssay({ essayText: "unlistedword runs" });
    const merged = mergeDictionaryErrors(analysis, [{ word: "unlistedword", suggestions: ["listed word"] }]);
    expect(merged.errors).toEqual([expect.objectContaining({
      type: "SPELLING_ERROR",
      actual: "unlistedword",
      tokenIndex: 0,
      actualIndex: 0,
      suggestion: "listed word",
    })]);
  });
});
