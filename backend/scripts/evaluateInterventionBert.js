process.env.NODE_ENV = process.env.NODE_ENV || "test";

const {
  analyseReportWithOpenAi,
} = require("../src/services/interventionRecommendationService");
const {
  evaluateBertScore,
  recommendationToText,
} = require("../src/utils/interventionSemanticEvaluator");
const evaluationCase = require("../tests/fixtures/interventionRecommendationEvaluation");

async function main() {
  const reportAnalysis =
    await analyseReportWithOpenAi(evaluationCase.reportInput);
  const recommendation = reportAnalysis.recommendation;

  if (recommendation.status !== "completed") {
    throw new Error(
      recommendation.error || "The recommendation generator did not complete."
    );
  }

  const candidate = recommendationToText(recommendation);
  const result = await evaluateBertScore({
    candidate,
    references: evaluationCase.references,
  });
  const unrelatedResult = await evaluateBertScore({
    candidate,
    references: [evaluationCase.unrelatedReference],
  });
  const lowerCaseCandidate = candidate.toLowerCase();

  const summary = {
    caseId: evaluationCase.id,
    model: result.model,
    metric: result.metric,
    precision: result.precision,
    recall: result.recall,
    f1: result.f1,
    accuracyPercentage: result.accuracyPercentage,
    unrelatedF1: unrelatedResult.f1,
    semanticMargin: result.f1 - unrelatedResult.f1,
    relevanceTermsPresent: /spelling|phonetic|word/.test(lowerCaseCandidate),
    unsafeTermsPresent: /has dyslexia|diagnosed with|medication/.test(
      lowerCaseCandidate
    ),
  };

  process.stdout.write(`BERT_RESULT=${JSON.stringify(summary)}\n`);
}

main().catch((error) => {
  process.stderr.write(`BERT evaluation failed: ${error.message}\n`);
  process.exitCode = 1;
});
