let extractorPromise = null;

/*
 * Load the transformer model once and reuse it.
 *
 * Dynamic import is used because @huggingface/transformers
 * is an ES module while this backend uses CommonJS.
 */
async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import(
      "@huggingface/transformers"
    ).then(({ pipeline }) =>
      pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      )
    );
  }

  return extractorPromise;
}

/*
 * Because the embeddings are normalized, their dot product is
 * equivalent to cosine similarity.
 */
function cosineSimilarity(vectorA, vectorB) {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length !== vectorB.length ||
    vectorA.length === 0
  ) {
    throw new Error(
      "Embeddings must be non-empty vectors of equal length."
    );
  }

  return vectorA.reduce(
    (sum, value, index) =>
      sum + value * vectorB[index],
    0
  );
}

function recommendationToText(recommendation) {
  if (!recommendation) {
    return "";
  }

  const interventions = Array.isArray(
    recommendation.interventions
  )
    ? recommendation.interventions
    : [];

  return [
    recommendation.overview,
    recommendation.dominantPattern,

    ...interventions.flatMap(
      (intervention) => [
        intervention.title,
        intervention.rationale,

        ...(Array.isArray(
          intervention.activities
        )
          ? intervention.activities
          : []),

        intervention.frequency,
      ]
    ),
  ]
    .filter(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0
    )
    .join(" ");
}

async function createEmbeddings(texts) {
  if (
    !Array.isArray(texts) ||
    texts.length === 0
  ) {
    throw new Error(
      "At least one text is required."
    );
  }

  if (
    texts.some(
      (text) =>
        typeof text !== "string" ||
        !text.trim()
    )
  ) {
    throw new Error(
      "All texts must be non-empty strings."
    );
  }

  const extractor = await getExtractor();

  const output = await extractor(texts, {
    pooling: "mean",
    normalize: true,
  });

  return output.tolist();
}

async function evaluateSemanticSimilarity({
  candidate,
  references,
}) {
  if (
    typeof candidate !== "string" ||
    !candidate.trim()
  ) {
    throw new Error(
      "Candidate must be a non-empty string."
    );
  }

  if (
    !Array.isArray(references) ||
    references.length === 0
  ) {
    throw new Error(
      "At least one reference is required."
    );
  }

  const validReferences = references.filter(
    (reference) =>
      typeof reference === "string" &&
      reference.trim()
  );

  if (validReferences.length === 0) {
    throw new Error(
      "References must contain non-empty strings."
    );
  }

  const embeddings = await createEmbeddings([
    candidate,
    ...validReferences,
  ]);

  const candidateEmbedding = embeddings[0];

  const scores = validReferences.map(
    (reference, index) => ({
      reference,
      similarity: cosineSimilarity(
        candidateEmbedding,
        embeddings[index + 1]
      ),
    })
  );

  const bestMatch = scores.reduce(
    (best, current) =>
      current.similarity > best.similarity
        ? current
        : best
  );

  return {
    score: bestMatch.similarity,
    matchedReference:
      bestMatch.reference,
    allScores: scores,
  };
}

module.exports = {
  cosineSimilarity,
  recommendationToText,
  createEmbeddings,
  evaluateSemanticSimilarity,
};