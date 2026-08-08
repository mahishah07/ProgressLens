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
      readFile: jest.fn().mockResolvedValue(Buffer.from("pdf bytes")),
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
    expect(dependencies.writingSampleRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ fileData: Buffer.from("pdf bytes"), status: "uploaded" })
    );
    expect(dependencies.writingSampleRepository.markAnalysed).not.toHaveBeenCalled();
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

  test("loads the answer key and compares only the handwritten student text", async () => {
    const student = { _id: "student-id", studentId: "121606", name: "Student 121606" };
    const dependencies = {
      studentRepository: { findByStudentId: jest.fn().mockResolvedValue(student) },
      answerKeyRepository: { findById: jest.fn().mockResolvedValue({ _id: "key-id", expectedText: "He ran. Fox hunts." }) },
      writingSampleRepository: { create: jest.fn().mockResolvedValue({ _id: "sample-id", toObject: () => ({ _id: "sample-id" }) }) },
      reportRepository: { create: jest.fn().mockResolvedValue({ _id: "report-id", toObject: () => ({ _id: "report-id" }) }) },
      extractDocument: jest.fn().mockResolvedValue({ content: "printed prompts and handwriting", handwrittenText: "he run fox hunt" }),
      checkSpelling: jest.fn().mockResolvedValue([]),
      readFile: jest.fn().mockResolvedValue(Buffer.from("image")),
    };

    await processWritingSample({
      studentId: "121606",
      answerKeyId: "key-id",
      file: { path: "/tmp/student.jpg", originalname: "student.jpg", filename: "student.jpg", mimetype: "image/jpeg", size: 5 },
    }, dependencies);

    expect(dependencies.writingSampleRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      answerKey: "key-id",
      handwrittenText: "he run fox hunt",
      cleanedText: "he run fox hunt",
      fileData: Buffer.from("image"),
    }));
    expect(dependencies.reportRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      answerKey: "key-id",
      expectedText: "He ran. Fox hunts.",
      errorCounts: expect.objectContaining({ phonetic: 1, deletion: 1, capitalisation: 2, grammar: 0, total: 4, }),
    }));
  });
});
