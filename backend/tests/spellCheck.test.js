const { checkSpelling } = require("../src/services/spellCheckService");

jest.setTimeout(20000);

describe("Spell checking service", () => {
  test("detects spelling errors from sample student writing", async () => {
    const text =
      "I hope you guys had started studing for your Weighted Assesment two. Just a gentel reminder that your maths Weighted Assessment is tommorrow.";

    const errors = await checkSpelling(text);

    const errorWords = errors.map((error) => error.word.toLowerCase());

    expect(errorWords).toContain("studing");
    expect(errorWords).toContain("assesment");
    expect(errorWords).toContain("gentel");
    expect(errorWords).toContain("tommorrow");

    expect(errorWords).not.toContain("started");
    expect(errorWords).not.toContain("assessment");
    expect(errorWords).not.toContain("maths");
  });

  test("returns each spelling error with suggestions field", async () => {
    const text =
      "I hope you guys had started studing for your Weighted Assesment two. Just a gentel reminder that your maths Weighted Assessment is tommorrow.";

    const errors = await checkSpelling(text);

    const studingError = errors.find(
      (error) => error.word.toLowerCase() === "studing"
    );

    expect(studingError).toBeDefined();
    expect(Array.isArray(studingError.suggestions)).toBe(true);
  });
});