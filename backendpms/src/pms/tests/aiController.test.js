const request = require("supertest");
const { app } = require("../../../server");

jest.mock("../models/Assessment");
jest.mock("../services/progressService");
jest.mock("../services/comparisonService");
jest.mock("../services/aiService");

const Assessment = require("../models/Assessment");
const progressService = require("../services/progressService");
const comparisonService = require("../services/comparisonService");
const aiService = require("../services/aiService");

describe("UT-PMS-31 — GET /api/ai/:studentId/dashboard-summary (Student Performance Summary card)", () => {
	beforeEach(() => jest.clearAllMocks());

	test("returns 404 when the student cannot be resolved", async () => {
		progressService.buildDashboard.mockResolvedValue(null);

		const res = await request(app).get("/api/ai/unknown/dashboard-summary");

		expect(res.status).toBe(404);
	});

	test("returns { summary: null } with 200 when the student has no assessments yet", async () => {
		progressService.buildDashboard.mockResolvedValue({
			status: "assessment_pending",
		});

		const res = await request(app).get(
			"/api/ai/Student 0001/dashboard-summary",
		);

		expect(res.status).toBe(200);
		expect(res.body.summary).toBeNull();
	});

	test("returns the AI-generated summary on success", async () => {
		progressService.buildDashboard.mockResolvedValue({
			status: "ok",
			currentBandLevel: "B4",
			bandScore: { totalScore: 88, passed: false },
			skillBreakdown: { strongest: "wra", weakest: "narrative" },
			totalAssessments: 2,
		});
		aiService.generateDashboardSummary.mockResolvedValue({
			summary: "Doing well overall.",
		});

		const res = await request(app).get(
			"/api/ai/Student 0001/dashboard-summary",
		);

		expect(res.status).toBe(200);
		expect(res.body.summary).toBe("Doing well overall.");
	});

	test("returns 500 when the AI call fails, rather than crashing the dashboard", async () => {
		progressService.buildDashboard.mockResolvedValue({
			status: "ok",
			currentBandLevel: "B4",
			bandScore: { totalScore: 88, passed: false },
			skillBreakdown: {},
			totalAssessments: 1,
		});
		aiService.generateDashboardSummary.mockRejectedValue(
			new Error("AI provider unavailable"),
		);

		const res = await request(app).get(
			"/api/ai/Student 0001/dashboard-summary",
		);

		expect(res.status).toBe(500);
	});
});

describe("UT-PMS-32 — POST /api/ai/:studentId/recommendations", () => {
	beforeEach(() => jest.clearAllMocks());

	test("returns 404 when the student cannot be resolved", async () => {
		comparisonService.compareAssessments.mockResolvedValue(null);

		const res = await request(app).post("/api/ai/unknown/recommendations");

		expect(res.status).toBe(404);
	});

	test("returns insufficient_data with 200 when fewer than two assessments exist", async () => {
		comparisonService.compareAssessments.mockResolvedValue({
			status: "insufficient_data",
		});

		const res = await request(app).post("/api/ai/Student 0001/recommendations");

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("insufficient_data");
	});

	test("generates recommendations and saves the summary onto the latest assessment", async () => {
		comparisonService.compareAssessments.mockResolvedValue({
			status: "ok",
			student: { _id: "s1" },
		});
		aiService.generateRecommendations.mockResolvedValue({
			summary: "Great progress this term.",
			strengths: "x",
			interventionAreas: "y",
			teachingStrategies: "z",
			suggestedActivities: "w",
		});

		const saveMock = jest.fn().mockResolvedValue({});
		const latestAssessment = { aiInsights: null, save: saveMock };
		Assessment.findOne.mockReturnValue({
			sort: jest.fn().mockResolvedValue(latestAssessment),
		});

		const res = await request(app).post("/api/ai/Student 0001/recommendations");

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("ok");
		expect(latestAssessment.aiInsights).toBe("Great progress this term.");
		expect(saveMock).toHaveBeenCalled();
	});

	test("does not throw if the student has no assessments to attach aiInsights to", async () => {
		comparisonService.compareAssessments.mockResolvedValue({
			status: "ok",
			student: { _id: "s1" },
		});
		aiService.generateRecommendations.mockResolvedValue({
			summary: "x",
		});
		Assessment.findOne.mockReturnValue({
			sort: jest.fn().mockResolvedValue(null),
		});

		const res = await request(app).post("/api/ai/Student 0001/recommendations");

		expect(res.status).toBe(200);
	});

	test("returns 500 with a generic message (no internal error details leaked) when the AI call fails", async () => {
		comparisonService.compareAssessments.mockResolvedValue({
			status: "ok",
			student: { _id: "s1" },
		});
		aiService.generateRecommendations.mockRejectedValue(
			new Error("secret internal detail"),
		);

		const res = await request(app).post("/api/ai/Student 0001/recommendations");

		expect(res.status).toBe(500);
		expect(res.body.message).not.toMatch(/secret internal detail/);
	});
});
