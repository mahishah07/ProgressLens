const { processWritingSample } = require("../src/services/reportPipelineService");

describe("End-to-end report pipeline", () => {
  test("runs OCR, analysis, spell check, and Mongo repositories in order", async () => {
    const student = { _id: "student-db-id", studentId: "DAS-001", name: "Sarah Tan" };
    const writingSample = { _id: "sample-id", toObject: () => ({ _id: "sample-id" }) };
    const reportDocument = { _id: "report-id", toObject: () => ({ _id: "report-id" }) };
    const dependencies = {
      studentRepository: { findByStudentId: jest.fn().mockResolvedValue(student) },
      writingSampleRepository: {
        create: jest.fn().mockResolvedValue(writingSample),
        markAnalysed: jest.fn().mockResolvedValue({}),
      },
      reportRepository: { create: jest.fn().mockResolvedValue(reportDocument) },
      extractText: jest.fn().mockResolvedValue("The bog ran nite."),
      checkSpelling: jest.fn().mockResolvedValue([]),
    };
    const file = { path: "/tmp/essay.pdf", originalname: "essay.pdf", filename: "saved.pdf", mimetype: "application/pdf", size: 123 };

    const result = await processWritingSample(
      { studentId: "DAS-001", expectedText: "The dog ran night.", file },
      dependencies
    );

    const savedReport = dependencies.reportRepository.create.mock.calls[0][0];
    expect(dependencies.extractText).toHaveBeenCalledWith(file.path);
    expect(savedReport.errorCounts.letterReversal).toBe(1);
    expect(savedReport.errorCounts.phonetic).toBe(1);
    expect(savedReport.chartData.find((item) => item.key === "letterReversal").percentage).toBe(50);
    expect(dependencies.writingSampleRepository.markAnalysed).toHaveBeenCalledWith("sample-id");
    expect(result.report._id).toBe("report-id");
  });

  test("stops if the selected student does not exist", async () => {
    const dependencies = {
      studentRepository: { findByStudentId: jest.fn().mockResolvedValue(null) },
      extractText: jest.fn(),
    };
    await expect(processWritingSample({ studentId: "missing", file: {} }, dependencies)).rejects.toMatchObject({ statusCode: 404 });
    expect(dependencies.extractText).not.toHaveBeenCalled();
  });
});
