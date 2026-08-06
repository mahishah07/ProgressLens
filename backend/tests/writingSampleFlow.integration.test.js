/*
 * Integration test for the main Error Pattern Analyser workflow:
 *
 * HTTP upload
 *   -> Multer validation
 *   -> upload controller
 *   -> report pipeline
 *   -> Azure OCR (mocked)
 *   -> real text cleaning
 *   -> real spell checker
 *   -> real essay analysis
 *   -> repositories (mocked)
 *   -> HTTP response
 */

/*
 * Mock Azure OCR only because automated tests should not require
 * Azure credentials or make external network requests.
 */
jest.mock("../src/services/ocrService", () => ({
  extractDocument: jest.fn(),
  extractTextFromPdf: jest.fn(),
  textFromSpans: jest.fn(),
}));

/*
 * Mock persistence so this test focuses on the upload and EPA
 * processing flow. MongoDB persistence is covered separately by
 * mongoPersistence.integration.test.js.
 */
jest.mock("../src/repositories/studentRepository", () => ({
  create: jest.fn(),
  findByStudentId: jest.fn(),
  search: jest.fn(),
}));

jest.mock(
  "../src/repositories/writingSampleRepository",
  () => ({
    create: jest.fn(),
    markAnalysed: jest.fn(),
    findFileById: jest.fn(),
  })
);

jest.mock("../src/repositories/reportRepository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByStudent: jest.fn(),
  updateReview: jest.fn(),
  saveOpenAiAnalysis: jest.fn(),
}));

jest.mock(
  "../src/repositories/answerKeyRepository",
  () => ({
    create: jest.fn(),
    findById: jest.fn(),
    findFileById: jest.fn(),
  })
);

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

/*
 * Require the app only after the Jest mocks have been declared.
 * This ensures reportPipelineService receives the mocked OCR and
 * repository dependencies when it is loaded.
 */
const app = require("../src/app");

jest.setTimeout(60000);

describe("Writing sample upload EPA integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    /*
     * The submitted student ID exists.
     */
    studentRepository.findByStudentId.mockResolvedValue({
      _id: "student-db-id",
      studentId: "EPA-001",
      name: "EPA Test Student",
    });

    /*
     * Simulate Azure extracting readable text from the PDF.
     *
     * "qwertyuiop" is intentionally invalid so the real dictionary
     * spell checker should detect it.
     *
     * "dog dog" allows the real essay analyser to detect repetition.
     */
    extractDocument.mockResolvedValue({
      content: "The qwertyuiop dog dog runs home.",
      handwrittenText:
        "The qwertyuiop dog dog runs home.",
      tables: [],
    });

    /*
     * Return document-like objects from the mocked repositories.
     * The real pipeline calls toObject() before returning its result.
     */
    writingSampleRepository.create.mockImplementation(
      async (data) => ({
        _id: "writing-sample-id",
        ...data,

        toObject() {
          return {
            _id: this._id,
            student: this.student,
            answerKey: this.answerKey,
            originalName: this.originalName,
            savedName: this.savedName,
            savedPath: this.savedPath,
            mimeType: this.mimeType,
            fileSize: this.fileSize,
            fileData: this.fileData,
            ocrText: this.ocrText,
            handwrittenText: this.handwrittenText,
            cleanedText: this.cleanedText,
            expectedText: this.expectedText,
            status: this.status,
            ocrCompletedAt: this.ocrCompletedAt,
          };
        },
      })
    );

    reportRepository.create.mockImplementation(
      async (data) => ({
        _id: "analysis-report-id",
        ...data,

        toObject() {
          return {
            _id: this._id,
            student: this.student,
            writingSample: this.writingSample,
            answerKey: this.answerKey,
            expectedText: this.expectedText,
            tokens: this.tokens,
            sentences: this.sentences,
            errors: this.errors,
            summary: this.summary,
            errorCounts: this.errorCounts,
            chartData: this.chartData,
            analysedAt: this.analysedAt,
          };
        },
      })
    );
  });

  test("uploads a PDF, extracts and cleans its text, and runs spelling and error analysis", async () => {
    /*
     * These bytes only need to pass through Multer because Azure OCR
     * is mocked. The test is not claiming this is a complete PDF.
     */
    const pdfFixture = Buffer.from(
      "%PDF-1.4\nEPA integration test fixture"
    );

    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "EPA-001")
      .attach("assignment", pdfFixture, {
        filename: "student-writing.pdf",
        contentType: "application/pdf",
      });

    /*
     * Verify the route completed successfully.
     */
    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
      "Writing sample uploaded, scanned, and saved. It is ready for analysis."
    );

    /*
     * Verify the correct student was selected.
     */
    expect(
      studentRepository.findByStudentId
    ).toHaveBeenCalledTimes(1);

    expect(
      studentRepository.findByStudentId
    ).toHaveBeenCalledWith("EPA-001");

    expect(response.body.data.student).toMatchObject({
      id: "student-db-id",
      studentId: "EPA-001",
      name: "EPA Test Student",
    });

    /*
     * Verify the uploaded PDF was sent to the mocked Azure adapter.
     */
    expect(extractDocument).toHaveBeenCalledTimes(1);

    expect(extractDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: "student-writing.pdf",
        mimetype: "application/pdf",
        size: pdfFixture.length,
        buffer: expect.any(Buffer),
      })
    );

    const fileSentToOcr =
      extractDocument.mock.calls[0][0];

    expect(fileSentToOcr.buffer).toEqual(pdfFixture);

    /*
     * Verify OCR and cleaned text were saved on the writing sample.
     */
    expect(
      writingSampleRepository.create
    ).toHaveBeenCalledTimes(1);

    expect(
      writingSampleRepository.create
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        student: "student-db-id",
        originalName: "student-writing.pdf",
        mimeType: "application/pdf",
        fileSize: pdfFixture.length,
        fileData: pdfFixture,

        ocrText:
          "The qwertyuiop dog dog runs home.",

        handwrittenText:
          "The qwertyuiop dog dog runs home.",

        cleanedText:
          "The qwertyuiop dog dog runs home.",

        status: "uploaded",
        ocrCompletedAt: expect.any(Date),
      })
    );

    expect(
      response.body.data.writingSample
    ).toMatchObject({
      _id: "writing-sample-id",
      originalName: "student-writing.pdf",
      mimeType: "application/pdf",
      ocrText:
        "The qwertyuiop dog dog runs home.",
      cleanedText:
        "The qwertyuiop dog dog runs home.",
      status: "uploaded",
    });

    /*
     * Stored file bytes must not be exposed in the API JSON response.
     */
    expect(
      response.body.data.writingSample.fileData
    ).toBeUndefined();

    /*
     * Verify the real analysis pipeline created a report.
     */
    expect(
      reportRepository.create
    ).toHaveBeenCalledTimes(1);

    const savedReport =
      reportRepository.create.mock.calls[0][0];

    expect(savedReport.student).toBe(
      "student-db-id"
    );

    expect(savedReport.writingSample).toBe(
      "writing-sample-id"
    );

    expect(savedReport.tokens).toEqual([
      "the",
      "qwertyuiop",
      "dog",
      "dog",
      "runs",
      "home",
    ]);

    expect(savedReport.sentences).toEqual([
      "The qwertyuiop dog dog runs home.",
    ]);

    /*
     * This error is generated by the real repeated-word analyser.
     */
    expect(savedReport.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "REPETITION",
          category: "Insertion",
          actual: "dog",
          actualIndex: 3,
          tokenIndex: 3,
        }),
      ])
    );

    /*
     * "qwertyuiop" is not handled by the hard-coded common typo
     * table. Finding it proves the dictionary spell checker ran and
     * its result was merged into the report.
     */
    expect(savedReport.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "SPELLING_ERROR",
          category: "Spelling",
          actual: "qwertyuiop",
        }),
      ])
    );

    /*
     * Verify aggregate calculations.
     */
    expect(savedReport.summary).toMatchObject({
      wordCount: 6,
      sentenceCount: 1,
    });

    expect(savedReport.summary.errorCount).toBe(
      savedReport.errors.length
    );

    expect(savedReport.errorCounts.spelling).toBeGreaterThanOrEqual(
      1
    );

    expect(savedReport.errorCounts.insertion).toBe(1);

    expect(savedReport.errorCounts.total).toBe(
      savedReport.errors.length
    );

    /*
     * Verify chart data was built from the detected errors.
     */
    expect(savedReport.chartData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "spelling",
          label: "Spelling",
          count: expect.any(Number),
          percentage: expect.any(Number),
        }),
        expect.objectContaining({
          key: "insertion",
          label: "Insertions",
          count: 1,
          percentage: expect.any(Number),
        }),
      ])
    );

    /*
     * Verify the final HTTP response contains the analysis.
     */
    expect(response.body.data.report).toMatchObject({
      _id: "analysis-report-id",

      summary: expect.objectContaining({
        wordCount: 6,
        sentenceCount: 1,
      }),

      errorCounts: expect.objectContaining({
        spelling: expect.any(Number),
        insertion: 1,
        total: expect.any(Number),
      }),

      errors: expect.arrayContaining([
        expect.objectContaining({
          type: "REPETITION",
          actual: "dog",
        }),

        expect.objectContaining({
          type: "SPELLING_ERROR",
          actual: "qwertyuiop",
        }),
      ]),
    });
  });

  test("does not save anything when OCR returns no readable text", async () => {
    extractDocument.mockResolvedValue({
      content: " \n\t ",
      handwrittenText: "",
      tables: [],
    });

    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "EPA-001")
      .attach(
        "assignment",
        Buffer.from("%PDF-1.4\nempty document"),
        {
          filename: "empty-writing.pdf",
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
  });

  test("does not save anything when Azure OCR fails", async () => {
    extractDocument.mockRejectedValue(
      Object.assign(
        new Error("Azure OCR unavailable"),
        {
          statusCode: 503,
        }
      )
    );

    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "EPA-001")
      .attach(
        "assignment",
        Buffer.from("%PDF-1.4\nOCR failure"),
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
  });
});