const {
  analyseReportWithOpenAi,
} = require("../src/services/interventionRecommendationService");

const reportInput = {
  studentId: "DAS-001",
  sourceText: "the bog went nite",
  errors: [
    {
      _id: "error-1",
      type: "SPELLING_ERROR",
      category: "Spelling",
      actual: "bog",
      actualIndex: 1,
    },
    {
      _id: "error-2",
      type: "SPELLING_ERROR",
      category: "Spelling",
      actual: "nite",
      actualIndex: 3,
    },
  ],
  tokens: ["the", "bog", "went", "nite"],
  errorCounts: {
    spelling: 2,
    phonetic: 0,
    insertion: 0,
    deletion: 0,
    letterReversal: 0,
    total: 2,
  },
  chartData: [],
};

function validRecommendation() {
  return {
    overview: "Practise spelling and sound-letter mapping.",
    dominantPattern: "Spelling",
    interventions: [
      {
        title: "Word mapping",
        rationale: "Builds spelling accuracy.",
        activities: ["Map sounds to letters"],
        frequency: "3 times/week",
      },
    ],
    educatorCaution: "Review before use.",
  };
}

function validOutput() {
  return {
    correctedText: "the dog went night",
    corrections: [
      {
        errorId: "error-1",
        expectedCorrection: "dog",
        explanation: "Correct the letter reversal.",
      },
      {
        errorId: "error-2",
        expectedCorrection: "night",
        explanation: "Correct the phonetic spelling.",
      },
    ],
    grammarErrors: [],
    recommendation: validRecommendation(),
  };
}

function createClient(output) {
  return {
    responses: {
      parse: jest.fn().mockResolvedValue({
        output_parsed: output,
      }),
    },
  };
}

async function analyseWithOutput(output) {
  const client = createClient(output);

  return analyseReportWithOpenAi(
    reportInput,
    {
      client,
      model: "test-model",
    }
  );
}

describe("RP-011 - OpenAI correction ID contract", () => {
  test("accepts exactly one correction for each report error ID", async () => {
    const result = await analyseWithOutput(
      validOutput()
    );

    expect(result.corrections).toHaveLength(2);

    expect(
      result.corrections.map(
        (correction) => correction.errorId
      )
    ).toEqual([
      "error-1",
      "error-2",
    ]);
  });

  test("rejects a missing correction ID", async () => {
    const output = validOutput();

    output.corrections = [
      {
        errorId: "error-1",
        expectedCorrection: "dog",
        explanation: "Correction.",
      },
    ];

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects duplicate correction IDs", async () => {
    const output = validOutput();

    output.corrections = [
      {
        errorId: "error-1",
        expectedCorrection: "dog",
        explanation: "Correction.",
      },
      {
        errorId: "error-1",
        expectedCorrection: "night",
        explanation: "Duplicate ID.",
      },
    ];

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects an extra correction ID", async () => {
    const output = validOutput();

    output.corrections.push({
      errorId: "error-3",
      expectedCorrection: "extra",
      explanation: "Unexpected correction.",
    });

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects completely wrong correction IDs", async () => {
    const output = validOutput();

    output.corrections = [
      {
        errorId: "wrong-1",
        expectedCorrection: "dog",
        explanation: "Correction.",
      },
      {
        errorId: "wrong-2",
        expectedCorrection: "night",
        explanation: "Correction.",
      },
    ];

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects a mixture of valid and unexpected IDs", async () => {
    const output = validOutput();

    output.corrections = [
      {
        errorId: "error-1",
        expectedCorrection: "dog",
        explanation: "Correction.",
      },
      {
        errorId: "unexpected-id",
        expectedCorrection: "night",
        explanation: "Correction.",
      },
    ];

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });
});

describe("RP-012 - malformed OpenAI structured output", () => {
  test("rejects missing correctedText", async () => {
    const output = validOutput();

    delete output.correctedText;

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects an empty correctedText", async () => {
    const output = validOutput();

    output.correctedText = "";

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects corrections when they are not an array", async () => {
    const output = validOutput();

    output.corrections = {
      errorId: "error-1",
    };

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects a missing corrections field", async () => {
    const output = validOutput();

    delete output.corrections;

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects a missing recommendation", async () => {
    const output = validOutput();

    delete output.recommendation;

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects zero interventions", async () => {
    const output = validOutput();

    output.recommendation.interventions = [];

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects four interventions", async () => {
    const output = validOutput();

    output.recommendation.interventions = [
      {
        title: "Activity 1",
        rationale: "Reason 1",
        activities: ["Task 1"],
        frequency: "Weekly",
      },
      {
        title: "Activity 2",
        rationale: "Reason 2",
        activities: ["Task 2"],
        frequency: "Weekly",
      },
      {
        title: "Activity 3",
        rationale: "Reason 3",
        activities: ["Task 3"],
        frequency: "Weekly",
      },
      {
        title: "Activity 4",
        rationale: "Reason 4",
        activities: ["Task 4"],
        frequency: "Weekly",
      },
    ];

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects malformed intervention structure", async () => {
    const output = validOutput();

    output.recommendation.interventions = [
      {
        title: "Word mapping",
      },
    ];

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects malformed recommendation structure", async () => {
    const output = validOutput();

    output.recommendation = {
      overview: "Practise spelling.",
    };

    await expect(
      analyseWithOutput(output)
    ).rejects.toThrow();
  });

  test("rejects null structured output", async () => {
    await expect(
      analyseWithOutput(null)
    ).rejects.toThrow();
  });

  test("rejects undefined structured output", async () => {
    await expect(
      analyseWithOutput(undefined)
    ).rejects.toThrow();
  });

  test("rejects when OpenAI structured parsing fails", async () => {
    const client = {
      responses: {
        parse: jest.fn().mockRejectedValue(
          new SyntaxError(
            "Invalid structured OpenAI response"
          )
        ),
      },
    };

    await expect(
      analyseReportWithOpenAi(
        reportInput,
        {
          client,
          model: "test-model",
        }
      )
    ).rejects.toThrow();
  });
});

describe("RP-012 - repeated malformed output variants", () => {
  test.each([
    123,
    "invalid",
    true,
    [],
  ])(
    "rejects invalid top-level output type: %p",
    async (output) => {
      await expect(
        analyseWithOutput(output)
      ).rejects.toThrow();
    }
  );

  test.each([
    null,
    "wrong",
    123,
    {},
  ])(
    "rejects malformed interventions value: %p",
    async (interventions) => {
      const output = validOutput();

      output.recommendation.interventions =
        interventions;

      await expect(
        analyseWithOutput(output)
      ).rejects.toThrow();
    }
  );
});