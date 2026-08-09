const {
  generateInterventionRecommendation,
  analyseReportWithOpenAi,
  createSafetyIdentifier,
} = require("../src/services/interventionRecommendationService");

describe("Intervention recommendation service", () => {
  test("returns not_configured without an API key", async () => {
    const result = await generateInterventionRecommendation({ studentId: "DAS-001", errorCounts: {spelling: 0, phonetic: 0, insertion: 0, deletion: 0, letterReversal: 0, total: 0,}, chartData: [] }, { apiKey: "" });
    expect(result.status).toBe("not_configured");
  });

  test("uses structured Responses API output", async () => {
    const parsed = {
      overview: "Focus on phoneme-grapheme mapping.",
      dominantPattern: "Phonetic spelling",
      interventions: [{ title: "Sound mapping", rationale: "Connect sounds and letters.", activities: ["Map sounds with counters"], frequency: "3 times/week" }],
      educatorCaution: "Review with other classroom evidence.",
    };
    const client = { responses: { parse: jest.fn().mockResolvedValue({ output_parsed: parsed }) } };
    const result = await generateInterventionRecommendation(
      { studentId: "DAS-001", errorCounts: { spelling: 0, phonetic: 4, insertion: 0, deletion: 0, letterReversal: 0, total: 4, }, chartData: [] },
      { client, model: "test-model" }
    );
    expect(result).toMatchObject({ status: "completed", model: "test-model", ...parsed });
    expect(client.responses.parse).toHaveBeenCalledWith(expect.objectContaining({ model: "test-model", store: false }));
  });

  test("uses a stable privacy-preserving student identifier", () => {
    expect(createSafetyIdentifier("DAS-001")).toBe(createSafetyIdentifier("DAS-001"));
    expect(createSafetyIdentifier("DAS-001")).not.toContain("DAS-001");
  });

  test("generates one correction per report error with the same IDs", async () => {
    const output = {
      correctedText: "Last Saturday I went.",
      corrections: [{ errorId: "error-1", expectedCorrection: "Saturday", explanation: "Correct spelling in context." }],
      grammarErrors: [{ actual: "go", expectedCorrection: "went", explanation: "Past tense is required.", actualIndex: 3 }],
      recommendation: {
        overview: "Practise spelling patterns.",
        dominantPattern: "Spelling",
        interventions: [{ title: "Word mapping", rationale: "Reinforces letter patterns.", activities: ["Map the word Saturday"], frequency: "3 times/week" }],
        educatorCaution: "Review each correction.",
      },
    };
    const client = { responses: { parse: jest.fn().mockResolvedValue({ output_parsed: output }) } };
    const result = await analyseReportWithOpenAi({
      studentId: "DAS-001",
      sourceText: "last saterday i went",
      errors: [{ _id: "error-1", type: "SPELLING_ERROR", category: "Spelling", actual: "saterday", actualIndex: 1 }],
      tokens: ["last", "saterday", "i", "went"],
      errorCounts: { spelling: 1, total: 1 },
      chartData: [],
    }, { client, model: "test-model" });
    expect(result.correctedText).toBe(output.correctedText);
    expect(result.corrections).toEqual(output.corrections);
    expect(result.grammarErrors).toEqual(output.grammarErrors);
    expect(result.recommendation).toMatchObject({ status: "completed", model: "test-model" });
  });

  test("rejects corrections that do not match the report error IDs", async () => {
    const client = { responses: { parse: jest.fn().mockResolvedValue({
      output_parsed: {
        correctedText: "word",
        corrections: [{ errorId: "wrong-id", expectedCorrection: "word", explanation: "reason" }],
        recommendation: {
          overview: "Overview",
          dominantPattern: "Spelling",
          interventions: [{ title: "Practice", rationale: "Reason", activities: ["Activity"], frequency: "Weekly" }],
          educatorCaution: "Review",
        },
      },
    }) } };
    await expect(analyseReportWithOpenAi({
      studentId: "DAS-001",
      sourceText: "wrod",
      errors: [{ _id: "error-1", type: "SPELLING_ERROR", category: "Spelling", actual: "wrod" }],
      tokens: [],
      errorCounts: { spelling: 1, total: 1 },
      chartData: [],
    }, { client, model: "test-model" })).rejects.toThrow("did not match");
  });
});
