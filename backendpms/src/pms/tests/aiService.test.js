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
									strengths: "Strong word reading and writing skills",
									interventionAreas: "Needs support in reading comprehension",
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
	componentComparison: {
		wra: {
			before: 6,
			after: 9,
			change: 3,
			beforePassed: false,
			afterPassed: true,
			bothTaken: true,
		},
		narrative: {
			before: null,
			after: 12,
			change: null,
			beforePassed: null,
			afterPassed: true,
			bothTaken: false,
		},
	},
	transitions: { newlyPassing: 1, newlyFailing: 0 },
};

describe("UT-PMS-22 — AIService PII exclusion and data contract", () => {
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

	test("should send componentComparison and transitions, not old skillChanges shape", async () => {
		const OpenAI = require("openai");
		const mockCreate = OpenAI.mock.results[0].value.chat.completions.create;

		await aiService.generateRecommendations(mockComparisonData);

		const callArgs = mockCreate.mock.calls[0][0];
		const promptContent = callArgs.messages[0].content;

		expect(promptContent).toMatch(/componentComparison/);
		expect(promptContent).toMatch(/transitions/);
		expect(promptContent).not.toMatch(/skillChanges/);
		expect(promptContent).not.toMatch(/overallScore/);
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
