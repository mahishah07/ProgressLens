const DEFAULT_BERT_MODEL = "Xenova/bert-base-uncased";

let extractorPromise = null;

/*
 * Load quantized BERT once and reuse it. Transformers.js is ESM, while the
 * backend is CommonJS, so the import must remain dynamic.
 */
async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers").then(
      ({ pipeline }) =>
        pipeline(
          "feature-extraction",
          DEFAULT_BERT_MODEL,
          { dtype: "q8" }
        )
    );
  }

  return extractorPromise;
}

function assertVector(vector, label) {
  if (
    !Array.isArray(vector) ||
    vector.length === 0 ||
    vector.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(`${label} must be a non-empty numeric vector.`);
  }
}

function cosineSimilarity(vectorA, vectorB) {
  assertVector(vectorA, "First embedding");
  assertVector(vectorB, "Second embedding");

  if (vectorA.length !== vectorB.length) {
    throw new Error("Embeddings must have equal length.");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    dotProduct += vectorA[index] * vectorB[index];
    normA += vectorA[index] ** 2;
    normB += vectorB[index] ** 2;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function recommendationToText(recommendation) {
  if (!recommendation) {
    return "";
  }

  const interventions = Array.isArray(recommendation.interventions)
    ? recommendation.interventions
    : [];

  return [
    recommendation.overview,
    recommendation.dominantPattern,
    ...interventions.flatMap((intervention) => [
      intervention.title,
      intervention.rationale,
      ...(Array.isArray(intervention.activities)
        ? intervention.activities
        : []),
      intervention.frequency,
    ]),
    recommendation.educatorCaution,
  ]
    .filter(
      (value) =>
        typeof value === "string" && value.trim().length > 0
    )
    .join(" ");
}

function assertTokenEmbeddings(embeddings, label) {
  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error(`${label} must contain at least one token embedding.`);
  }

  const vectorLength = embeddings[0]?.length;

  for (const embedding of embeddings) {
    assertVector(embedding, `${label} token embedding`);

    if (embedding.length !== vectorLength) {
      throw new Error(`${label} token embeddings must have equal length.`);
    }
  }
}

async function extractTokenEmbeddings(
  text,
  { extractor } = {}
) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Text must be a non-empty string.");
  }

  const activeExtractor = extractor || (await getExtractor());
  const output = await activeExtractor(text, {
    pooling: "none",
    normalize: false,
  });

  const batches = output.tolist();
  const tokens = batches?.[0];

  if (!Array.isArray(tokens) || tokens.length < 3) {
    throw new Error("BERT returned no usable token embeddings.");
  }

  // bert-base-uncased places [CLS] first and [SEP] last. BERTScore compares
  // content tokens, so those two special tokens are excluded.
  const contentTokens = tokens.slice(1, -1);
  assertTokenEmbeddings(contentTokens, "BERT output");

  return contentTokens;
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function maximumTokenSimilarity(token, comparisonTokens) {
  return comparisonTokens.reduce(
    (best, comparisonToken) =>
      Math.max(best, cosineSimilarity(token, comparisonToken)),
    -Infinity
  );
}

/*
 * Token-level BERTScore:
 * - precision: each generated token's best reference-token match
 * - recall: each reference token's best generated-token match
 * - F1: harmonic mean of precision and recall
 */
function calculateBertScore(candidateTokens, referenceTokens) {
  assertTokenEmbeddings(candidateTokens, "Candidate");
  assertTokenEmbeddings(referenceTokens, "Reference");

  if (candidateTokens[0].length !== referenceTokens[0].length) {
    throw new Error(
      "Candidate and reference token embeddings must have equal length."
    );
  }

  const precision = average(
    candidateTokens.map((token) =>
      maximumTokenSimilarity(token, referenceTokens)
    )
  );

  const recall = average(
    referenceTokens.map((token) =>
      maximumTokenSimilarity(token, candidateTokens)
    )
  );

  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);

  return { precision, recall, f1 };
}

async function createEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("At least one text is required.");
  }

  const tokenGroups = [];

  for (const text of texts) {
    tokenGroups.push(await extractTokenEmbeddings(text));
  }

  return tokenGroups.map((tokens) => {
    const embedding = tokens[0].map((_, dimension) =>
      average(tokens.map((token) => token[dimension]))
    );
    const magnitude = Math.sqrt(
      embedding.reduce((sum, value) => sum + value ** 2, 0)
    );

    return magnitude === 0
      ? embedding
      : embedding.map((value) => value / magnitude);
  });
}

async function evaluateBertScore({
  candidate,
  references,
  embedText = extractTokenEmbeddings,
}) {
  if (typeof candidate !== "string" || !candidate.trim()) {
    throw new Error("Candidate must be a non-empty string.");
  }

  if (!Array.isArray(references) || references.length === 0) {
    throw new Error("At least one reference is required.");
  }

  const validReferences = references.filter(
    (reference) =>
      typeof reference === "string" && reference.trim().length > 0
  );

  if (validReferences.length === 0) {
    throw new Error("References must contain non-empty strings.");
  }

  const candidateTokens = await embedText(candidate);
  const allScores = [];

  for (const reference of validReferences) {
    const referenceTokens = await embedText(reference);
    allScores.push({
      reference,
      ...calculateBertScore(candidateTokens, referenceTokens),
    });
  }

  const bestMatch = allScores.reduce((best, current) =>
    current.f1 > best.f1 ? current : best
  );

  return {
    model: DEFAULT_BERT_MODEL,
    metric: "BERTScore F1",
    precision: bestMatch.precision,
    recall: bestMatch.recall,
    f1: bestMatch.f1,
    accuracy: bestMatch.f1,
    accuracyPercentage: Number((bestMatch.f1 * 100).toFixed(2)),
    matchedReference: bestMatch.reference,
    allScores,
  };
}

async function evaluateSemanticSimilarity(options) {
  const result = await evaluateBertScore(options);

  return {
    score: result.f1,
    matchedReference: result.matchedReference,
    allScores: result.allScores.map(({ reference, f1 }) => ({
      reference,
      similarity: f1,
    })),
  };
}

module.exports = {
  DEFAULT_BERT_MODEL,
  cosineSimilarity,
  recommendationToText,
  extractTokenEmbeddings,
  calculateBertScore,
  createEmbeddings,
  evaluateBertScore,
  evaluateSemanticSimilarity,
};
