const crypto = require("crypto");
const OpenAI = require("openai");
const { z } = require("zod");
const { zodTextFormat } = require("openai/helpers/zod");
const { openAiApiKey, openAiModel } = require("../config/env");

const errorCountsSchema = z
  .object({
    spelling: z
      .number()
      .int()
      .min(0)
      .max(10000),

    phonetic: z
      .number()
      .int()
      .min(0)
      .max(10000),

    insertion: z
      .number()
      .int()
      .min(0)
      .max(10000),

    deletion: z
      .number()
      .int()
      .min(0)
      .max(10000),

    letterReversal: z
      .number()
      .int()
      .min(0)
      .max(10000),

    tense: z.number().int().min(0).max(10000).default(0),
    capitalisation: z.number().int().min(0).max(10000).default(0),
    grammar: z.number().int().min(0).max(10000).default(0),

    total: z
      .number()
      .int()
      .min(0)
      .max(50000),
  })
  .superRefine((counts, context) => {
    const calculatedTotal =
      counts.spelling +
      counts.phonetic +
      counts.insertion +
      counts.deletion +
      counts.letterReversal +
      counts.tense +
      counts.capitalisation +
      counts.grammar;

    if (
      counts.total !== calculatedTotal
    ) {
      context.addIssue({
        code: "custom",
        path: ["total"],
        message:
          "Total must equal the sum of all error categories.",
      });
    }
  });

const recommendationInputSchema =
  z.object({
    studentId: z
      .string()
      .trim()
      .min(1)
      .max(100),

    errorCounts: errorCountsSchema,

    chartData: z.array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),

        count: z
          .number()
          .int()
          .min(0),

        percentage: z
          .number()
          .min(0)
          .max(100),

        color: z
          .string()
          .optional(),
      })
    ),
  });

const recommendationSchema = z.object({
  overview: z.string(),
  dominantPattern: z.string(),
  interventions: z.array(z.object({
    title: z.string(),
    rationale: z.string(),
    activities: z.array(z.string()).min(1).max(4),
    frequency: z.string(),
  })).min(1).max(3),
  educatorCaution: z.string(),
});

const reportAnalysisSchema = z.object({
  correctedText: z.string().min(1),
  corrections: z.array(z.object({
    errorId: z.string(),
    expectedCorrection: z.string(),
    explanation: z.string(),
  })),
  grammarErrors: z.array(z.object({
    category: z.enum(["Tense", "Grammar"]).default("Grammar"),
    actual: z.string().min(1),
    expectedCorrection: z.string().min(1),
    explanation: z.string().min(1),
    actualIndex: z.number().int().nonnegative(),
  })),
  recommendation: recommendationSchema,
});

function createSafetyIdentifier(studentId) {
  return crypto.createHash("sha256").update(String(studentId)).digest("hex").slice(0, 32);
}

async function generateInterventionRecommendation(
  input,
  dependencies = {}
) {
  const {
    studentId,
    errorCounts,
    chartData,
  } = recommendationInputSchema.parse(
    input
  );

  const apiKey =
    dependencies.apiKey ?? openAiApiKey;

  const model =
    dependencies.model || openAiModel;

  if (
    !apiKey &&
    !dependencies.client
  ) {
    return {
      status: "not_configured",
      overview: "",
      dominantPattern: "",
      interventions: [],
      educatorCaution: "",
      model,
      generatedAt: null,
      error:
        "OPENAI_API_KEY is not configured.",
    };
  }

  const client =
    dependencies.client ||
    new OpenAI({
      apiKey,
    });

  const response =
    await client.responses.parse({
      model,

      reasoning: {
        effort: "low",
      },

      safety_identifier:
        createSafetyIdentifier(studentId),

      store: false,

      input: [
        {
          role: "system",

          content:
            "You support educators reviewing primary-school writing. Use only the supplied aggregate error data. Provide practical literacy activities, not a medical diagnosis. Do not claim the student has dyslexia or any disorder. Recommendations require educator review.",
        },

        {
          role: "user",

          content:
            `Create an intervention recommendation from this error analysis:\n${
              JSON.stringify({
                errorCounts,
                chartData,
              })
            }`,
        },
      ],

      text: {
        format: zodTextFormat(
          recommendationSchema,
          "intervention_recommendation"
        ),
      },
    });

  if (!response.output_parsed) {
    throw new Error(
      "OpenAI returned no structured recommendation."
    );
  }

  return {
    status: "completed",
    ...response.output_parsed,
    model,
    generatedAt: new Date(),
    error: "",
  };
}

function createErrorContext(error, tokens) {
  const index = error.actualIndex ?? error.tokenIndex;
  if (!Number.isInteger(index) || index < 0) return "";
  return tokens.slice(Math.max(0, index - 4), index + 5).join(" ");
}

function validateAnalysisOutput(output) {
  if (
    !output ||
    typeof output !== "object" ||
    Array.isArray(output)
  ) {
    throw new Error("OpenAI analysis output is invalid.");
  }

  if (
    typeof output.correctedText !== "string" ||
    !output.correctedText.trim()
  ) {
    throw new Error(
      "OpenAI analysis output is missing correctedText."
    );
  }

  if (!Array.isArray(output.corrections)) {
    throw new Error(
      "OpenAI analysis corrections must be an array."
    );
  }

  for (const correction of output.corrections) {
    if (
      !correction ||
      typeof correction !== "object" ||
      typeof correction.errorId !== "string" ||
      !correction.errorId.trim() ||
      typeof correction.expectedCorrection !== "string" ||
      !correction.expectedCorrection.trim() ||
      typeof correction.explanation !== "string" ||
      !correction.explanation.trim()
    ) {
      throw new Error(
        "OpenAI analysis contains an invalid correction."
      );
    }
  }

  if (
    output.grammarErrors !== undefined &&
    !Array.isArray(output.grammarErrors)
  ) {
    throw new Error(
      "OpenAI grammarErrors must be an array."
    );
  }

  const recommendation = output.recommendation;

  if (
    !recommendation ||
    typeof recommendation !== "object" ||
    Array.isArray(recommendation)
  ) {
    throw new Error(
      "OpenAI analysis is missing a valid recommendation."
    );
  }

  if (
    typeof recommendation.overview !== "string" ||
    !recommendation.overview.trim()
  ) {
    throw new Error(
      "OpenAI recommendation overview is invalid."
    );
  }

  if (
    typeof recommendation.dominantPattern !== "string" ||
    !recommendation.dominantPattern.trim()
  ) {
    throw new Error(
      "OpenAI recommendation dominantPattern is invalid."
    );
  }

  if (
    typeof recommendation.educatorCaution !== "string" ||
    !recommendation.educatorCaution.trim()
  ) {
    throw new Error(
      "OpenAI recommendation educatorCaution is invalid."
    );
  }

  if (!Array.isArray(recommendation.interventions)) {
    throw new Error(
      "OpenAI recommendation interventions must be an array."
    );
  }

  if (
    recommendation.interventions.length < 1 ||
    recommendation.interventions.length > 3
  ) {
    throw new Error(
      "OpenAI recommendation must contain between 1 and 3 interventions."
    );
  }

  for (const intervention of recommendation.interventions) {
    if (
      !intervention ||
      typeof intervention !== "object" ||
      Array.isArray(intervention)
    ) {
      throw new Error(
        "OpenAI recommendation contains an invalid intervention."
      );
    }

    if (
      typeof intervention.title !== "string" ||
      !intervention.title.trim() ||
      typeof intervention.rationale !== "string" ||
      !intervention.rationale.trim() ||
      typeof intervention.frequency !== "string" ||
      !intervention.frequency.trim()
    ) {
      throw new Error(
        "OpenAI recommendation contains an invalid intervention."
      );
    }

    if (
      !Array.isArray(intervention.activities) ||
      intervention.activities.length === 0 ||
      intervention.activities.some(
        (activity) =>
          typeof activity !== "string" ||
          !activity.trim()
      )
    ) {
      throw new Error(
        "OpenAI recommendation contains invalid activities."
      );
    }
  }

  return output;
}

async function analyseReportWithOpenAi({ studentId, sourceText, errors, tokens, errorCounts, chartData }, dependencies = {}) {
  const apiKey = dependencies.apiKey ?? openAiApiKey;
  const model = dependencies.model || openAiModel;
  if (!apiKey && !dependencies.client) {
    const error = new Error("OPENAI_API_KEY is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const requestedErrors = errors.map((error) => ({
    errorId: String(error._id),
    type: error.type,
    category: error.category,
    actual: error.actual,
    expectedFromReference: error.expected,
    localSuggestion: error.suggestion,
    context: createErrorContext(error, tokens),
  }));
  const client = dependencies.client || new OpenAI({ apiKey });
  const response = await client.responses.parse({
    model,
    reasoning: { effort: "low" },
    safety_identifier: createSafetyIdentifier(studentId),
    store: false,
    input: [
      {
        role: "system",
        content: "You support educators reviewing primary-school writing. Return correctedText as a complete corrected transcription of sourceText: preserve the student's meaning and wording while correcting clear OCR, spelling, punctuation, and grammar errors. Do not add new ideas. For every supplied error ID, provide the most likely expected correction using its category, local suggestion, reference answer, and short context. Preserve every error ID exactly and return one correction per error. Separately return grammarErrors for grammatical issues such as subject-verb agreement, tense, pronoun use, article use, and incorrect word form. Set category to Tense only when the correction changes or fixes verb tense; otherwise set it to Grammar. Capitalisation is classified separately by the comparison logic and must not be returned as a grammar error. Use the zero-based word-token index from sourceText. Include grammar errors even when the same token appears in the supplied errors, but exclude capitalisation-only, punctuation-only, OCR-only, and simple letter-level spelling issues. Also provide practical literacy interventions from the aggregate error pattern. Do not diagnose dyslexia or any medical condition. The educator must review all corrections and recommendations.",
      },
      {
        role: "user",
        content: JSON.stringify({ sourceText, errors: requestedErrors, errorCounts, chartData }),
      },
    ],
    text: { format: zodTextFormat(reportAnalysisSchema, "writing_report_analysis") },
  });

  const parsed = response.output_parsed;

  validateAnalysisOutput(parsed);

  const requestedIds = new Set(
  requestedErrors.map((error) => error.errorId)
);

const returnedIds = parsed.corrections.map(
  (correction) => correction.errorId
);

if (
  returnedIds.length !== requestedIds.size ||
  new Set(returnedIds).size !== returnedIds.length ||
  returnedIds.some((id) => !requestedIds.has(id))
) {
  throw new Error(
    "OpenAI corrections did not match the report errors."
  );
}

return {
  correctedText: parsed.correctedText,
  corrections: parsed.corrections,
  grammarErrors: parsed.grammarErrors || [],
  recommendation: {
    status: "completed",
    ...parsed.recommendation,
    model,
    generatedAt: new Date(),
    error: "",
  },
};

  return {
    correctedText: response.output_parsed.correctedText,
    corrections: response.output_parsed.corrections,
    grammarErrors: response.output_parsed.grammarErrors || [],
    recommendation: {
      status: "completed",
      ...response.output_parsed.recommendation,
      model,
      generatedAt: new Date(),
      error: "",
    },
  };
}

module.exports = {
  generateInterventionRecommendation,
  analyseReportWithOpenAi,
  createSafetyIdentifier,
  recommendationSchema,
  reportAnalysisSchema,
  errorCountsSchema,
  recommendationInputSchema,
};
