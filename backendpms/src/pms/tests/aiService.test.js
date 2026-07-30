const aiService = require("../services/aiService");

jest.mock("openai", () => {
	return jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn().mockResolvedValue({
					choices: [
						{
							message: {
								content: JSON.stringify({
									summary: "Student shows steady progress",
									strengths: "Strong phonics and reading fluency",
									interventionAreas: "Needs support in writing composition",
									teachingStrategies:
										"Use visual aids and structured writing frames",
									suggestedActivities:
										"Daily reading logs and guided writing exercises",
								}),
							},
						},
					],
				}),
			},
		},
	}));
});

const mockComparisonData = {
	totalAssessments: 3,
	comparisonPeriod: { from: "2022 Sem 1", to: "2023 Sem 2" },
	bandChange: { direction: "improved", steps: 2 },
	overallScore: {
		earliest: 14.83,
		latest: 28.5,
		change: 13.67,
		improved: true,
	},
	errorReduction: { before: 18, after: 6, reduction: 12, improved: true },
	skillChanges: {
		phonics: { before: 20, after: 45, change: 25, improved: true },
		wra: { before: 10, after: 30, change: 20, improved: true },
	},
	proficiencyChange: {
		earlier: {
			strongest: { skill: "phonics", score: 20 },
			weakest: { skill: "wra", score: 10 },
		},
		later: {
			strongest: { skill: "phonics", score: 45 },
			weakest: { skill: "wra", score: 30 },
		},
	},
	varianceAnalysis: { mean: 21, stdDev: 5.2 },
};

describe("UT-27 — AIService PII exclusion", () => {
	test("should exclude PII fields before sending to OpenAI", async () => {
		const OpenAI = require("openai");
		const mockCreate = OpenAI.mock.results[0].value.chat.completions.create;

		await aiService.generateRecommendations(mockComparisonData);

		const callArgs = mockCreate.mock.calls[0][0];
		const promptContent = callArgs.messages[0].content;

		expect(promptContent).not.toMatch(/Student \d+/);
		expect(promptContent).not.toMatch(/Teacher \d+/);
		expect(promptContent).not.toMatch(/Centre [A-Z]/);
		expect(promptContent).not.toMatch(/School \d+/);
	});

	test("should return all five recommendation fields", async () => {
		const result = await aiService.generateRecommendations(mockComparisonData);

		expect(result).toHaveProperty("summary");
		expect(result).toHaveProperty("strengths");
		expect(result).toHaveProperty("interventionAreas");
		expect(result).toHaveProperty("teachingStrategies");
		expect(result).toHaveProperty("suggestedActivities");
	});

	test("should call OpenAI with gpt-4o-mini model", async () => {
		const OpenAI = require("openai");
		const mockCreate = OpenAI.mock.results[0].value.chat.completions.create;

		await aiService.generateRecommendations(mockComparisonData);

		const callArgs = mockCreate.mock.calls[0][0];
		expect(callArgs.model).toBe("gpt-4o-mini");
	});
});
