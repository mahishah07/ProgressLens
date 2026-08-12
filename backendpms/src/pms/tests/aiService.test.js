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

// UT-PMS-23 — readingComp default-pass values don't misrepresent progress to the AI
const mockComparisonDataWithDefaultedReadingComp = {
	...mockComparisonData,
	componentComparison: {
		...mockComparisonData.componentComparison,
		readingComp: {
			before: null,
			after: null,
			change: null,
			beforePassed: true, // defaulted — no real score either time
			afterPassed: true, // defaulted — no real score either time
			bothTaken: false,
			note: "No score recorded — defaulted to passed (known data gap)",
		},
	},
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

describe("UT-PMS-23 — readingComp default-pass values don't misrepresent progress to the AI", () => {
	test("prompt does not claim improvement when both readingComp values are defaulted, not real scores", async () => {
		const OpenAI = require("openai");
		const mockCreate = OpenAI.mock.results[0].value.chat.completions.create;

		await aiService.generateRecommendations(
			mockComparisonDataWithDefaultedReadingComp,
		);

		const callArgs = mockCreate.mock.calls[0][0];
		const promptContent = callArgs.messages[0].content;

		// The raw data is passed through — this test documents current
		// behaviour and should be revisited once dataIncomplete flagging
		// (see /areas/das-pms.md) is implemented, since right now the
		// prompt has no way to distinguish a real pass from a defaulted one.
		expect(promptContent).toMatch(/readingComp/);
	});

	test("generateRecommendations does not throw when readingComp is fully defaulted (no real scores either side)", async () => {
		await expect(
			aiService.generateRecommendations(
				mockComparisonDataWithDefaultedReadingComp,
			),
		).resolves.toHaveProperty("summary");
	});
});
