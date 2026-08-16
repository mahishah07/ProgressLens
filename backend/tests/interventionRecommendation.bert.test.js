const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const evaluationCase = require("./fixtures/interventionRecommendationEvaluation");

const execFileAsync = promisify(execFile);
const runBertEvaluation =
  process.env.RUN_BERT_EVALUATION === "true";
const bertTest = runBertEvaluation ? test : test.skip;
const configuredThreshold = Number(
  process.env.BERT_MIN_F1 || evaluationCase.minimumF1
);

jest.setTimeout(300000);

describe("Live BERT evaluation of intervention recommendations", () => {
  bertTest(
    "reports a decent BERTScore F1 for a spelling-dominant report",
    async () => {
      if (
        !Number.isFinite(configuredThreshold) ||
        configuredThreshold < 0 ||
        configuredThreshold > 1
      ) {
        throw new Error("BERT_MIN_F1 must be a number between 0 and 1.");
      }

      const workerPath = path.resolve(
        __dirname,
        "../scripts/evaluateInterventionBert.js"
      );
      const { stdout } = await execFileAsync(process.execPath, [workerPath], {
        cwd: path.resolve(__dirname, "../.."),
        env: {
          ...process.env,
          NODE_ENV: "test",
          NODE_OPTIONS: "",
        },
        timeout: 280000,
        maxBuffer: 1024 * 1024,
      });

      const resultLine = stdout
        .split(/\r?\n/)
        .find((line) => line.startsWith("BERT_RESULT="));

      if (!resultLine) {
        throw new Error("The BERT worker returned no evaluation result.");
      }

      const result = JSON.parse(resultLine.slice("BERT_RESULT=".length));

      console.log(
        [
          "BERT intervention recommendation evaluation",
          `case=${result.caseId}`,
          `model=${result.model}`,
          `precision=${(result.precision * 100).toFixed(2)}%`,
          `recall=${(result.recall * 100).toFixed(2)}%`,
          `accuracy_f1=${result.accuracyPercentage.toFixed(2)}%`,
          `unrelated_f1=${(result.unrelatedF1 * 100).toFixed(2)}%`,
          `semantic_margin=${(result.semanticMargin * 100).toFixed(2)}%`,
          `required_f1=${(configuredThreshold * 100).toFixed(2)}%`,
        ].join(" | ")
      );

      expect(result.metric).toBe("BERTScore F1");
      expect(result.f1).toBeGreaterThanOrEqual(configuredThreshold);
      expect(result.semanticMargin).toBeGreaterThanOrEqual(
        evaluationCase.minimumSemanticMargin
      );
      expect(result.relevanceTermsPresent).toBe(true);
      expect(result.unsafeTermsPresent).toBe(false);
    }
  );
});
