const request = require("supertest");

jest.mock("../services/aiService", () => ({
	generateParentReport: jest.fn(),
	generateRecommendations: jest.fn(),
}));

const { createApp } = require("../../../server");
const aiService = require("../services/aiService");
const {
	connectTestDatabase,
	clearTestDatabase,
	stopTestDatabase,
	studentPayload,
	assessmentPayload,
	Student,
	Assessment,
	Report,
} = require("./pmsTestHarness");

const app = createApp({
	env: { NODE_ENV: "test", CORS_ORIGINS: "http://localhost:5173" },
});

async function postStudent(id, overrides) {
	const response = await request(app)
		.post("/api/students")
		.send(studentPayload(id, overrides));
	expect(response.status).toBe(201);
	return response.body;
}

async function postAssessment(student, semester, date, overrides) {
	const response = await request(app)
		.post("/api/assessments")
		.send(assessmentPayload(student, semester, date, overrides));
	expect(response.status).toBe(201);
	return response.body;
}

describe("PMS end-to-end workflows", () => {
	beforeAll(connectTestDatabase);
	afterEach(async () => {
		jest.clearAllMocks();
		await clearTestDatabase();
	});
	afterAll(stopTestDatabase);

	test("E2E-008: student overview, history, and dashboard remain consistent with MongoDB", async () => {
		const student = await postStudent("DAS-0707");
		await postAssessment(student.studentId, "2026 Sem 1", "2026-01-15", {
			teacherComments: "Baseline",
		});
		await postAssessment(student._id, "2026 Sem 2", "2026-07-15", {
			newBand: "B5",
			wraScore: 9,
			wordSpellingScore: 9,
			narrativeScore: 12,
			rdComprehensionScore: 8,
			teacherComments: "Improving",
		});

		const [overview, history, dashboard] = await Promise.all([
			request(app).get("/api/progress/DAS-0707/overview"),
			request(app).get("/api/assessments/student/DAS-0707/progress"),
			request(app).get("/api/progress/DAS-0707/dashboard"),
		]);

		expect([overview.status, history.status, dashboard.status]).toEqual([
			200, 200, 200,
		]);
		expect(overview.body.lastSemester).toBe("2026 Sem 2");
		expect(history.body.map((item) => item.semester)).toEqual([
			"2026 Sem 1",
			"2026 Sem 2",
		]);
		expect(dashboard.body.latestAssessment.semester).toBe("2026 Sem 2");
		expect(dashboard.body.totalAssessments).toBe(
			await Assessment.countDocuments({ student: student._id }),
		);
	});

	test("E2E-009: comparison matches independently known band and component changes", async () => {
		const student = await postStudent("DAS-0707");
		await postAssessment(student.studentId, "2026 Sem 1", "2026-01-15", {
			newBand: "B4",
		});
		await postAssessment(student.studentId, "2026 Sem 2", "2026-07-15", {
			summaryBand: "B5",
			newBand: "B5",
			wraScore: 10,
			wordSpellingScore: 9,
			narrativeScore: 12,
			rdComprehensionScore: 9,
		});

		const response = await request(app).get("/api/comparison/DAS-0707");
		expect(response.status).toBe(200);
		expect(response.body.bandChange).toEqual({
			direction: "improved",
			steps: 1,
		});
		expect(response.body.componentComparison.wra.change).toBe(3);
		expect(response.body.comparisonPeriod).toEqual({
			from: "2026 Sem 1",
			to: "2026 Sem 2",
		});
	});

	test("E2E-010: generate, edit, and reload a parent report without changing protected fields", async () => {
		const student = await postStudent("DAS-0707");
		await postAssessment(student.studentId, "2026 Sem 1", "2026-01-15");
		await postAssessment(student.studentId, "2026 Sem 2", "2026-07-15", {
			newBand: "B5",
		});
		aiService.generateParentReport.mockResolvedValue({
			overallProgress: "Progress is steady and encouraging.",
			literacyGrowth: "Word reading has improved.",
			teacherObservations: "Engages well in class.",
			interventionAreas: "Continue short daily reading practice.",
		});

		const generated = await request(app)
			.post("/api/reports/DAS-0707/generate")
			.send({ generatedBy: "teacher-01" });
		expect(generated.status).toBe(201);
		const edited = await request(app)
			.put(`/api/reports/${generated.body.report._id}/edit`)
			.send({
				teacherObservations: "Practise phonics daily.",
				generatedBy: "intruder",
			});
		expect(edited.status).toBe(200);
		const latest = await request(app).get("/api/reports/DAS-0707/latest");
		expect(latest.body.teacherObservations).toBe("Practise phonics daily.");
		expect(latest.body.generatedBy).toBe("teacher-01");
		expect(JSON.stringify(latest.body)).not.toMatch(
			/diagnos|secret|api[_-]?key/i,
		);
	});

	test("E2E-011: recommendation is saved only to the correct latest assessment", async () => {
		const first = await postStudent("DAS-0707");
		const second = await postStudent("DAS-0808", { centreId: "CENTRE-B" });
		await postAssessment(first.studentId, "2026 Sem 1", "2026-01-15");
		await postAssessment(first.studentId, "2026 Sem 2", "2026-07-15");
		await postAssessment(second.studentId, "2026 Sem 1", "2026-01-15");
		aiService.generateRecommendations.mockResolvedValue({
			summary: "Use guided reading.",
		});

		const response = await request(app).post(
			"/api/ai/DAS-0707/recommendations",
		);
		expect(response.status).toBe(200);
		const firstLatest = await Assessment.findOne({ student: first._id }).sort({
			assessmentDate: -1,
		});
		const secondLatest = await Assessment.findOne({ student: second._id }).sort(
			{ assessmentDate: -1 },
		);
		expect(firstLatest.aiInsights).toBe("Use guided reading.");
		expect(secondLatest.aiInsights).toBeFalsy();
	});

	test("E2E-015: parallel histories for two students never cross records", async () => {
		const [first, second] = await Promise.all([
			postStudent("DAS-0707"),
			postStudent("DAS-0808", { centreId: "CENTRE-B" }),
		]);
		await Promise.all([
			postAssessment(first.studentId, "2026 Sem 1", "2026-01-15", {
				teacherComments: "FIRST-ONLY",
			}),
			postAssessment(second.studentId, "2026 Sem 1", "2026-01-15", {
				teacherComments: "SECOND-ONLY",
			}),
		]);
		const [firstHistory, secondHistory] = await Promise.all([
			request(app).get("/api/assessments/student/DAS-0707/progress"),
			request(app).get("/api/assessments/student/DAS-0808/progress"),
		]);
		expect(firstHistory.body).toHaveLength(1);
		expect(secondHistory.body).toHaveLength(1);
		expect(firstHistory.body[0].teacherComments).toBe("FIRST-ONLY");
		expect(secondHistory.body[0].teacherComments).toBe("SECOND-ONLY");
		expect(await Student.countDocuments()).toBe(2);
		expect(await Report.countDocuments()).toBe(0);
	});

	test("E2E-016: readingComp default-pass is consistent across dashboard, comparison, and generated report", async () => {
		const student = await postStudent("DAS-RC-E2E");
		// Neither assessment has a rdComprehensionScore — both should
		// default to passed, and every endpoint that touches this
		// student's data should agree on that.
		await postAssessment(student.studentId, "2026 Sem 1", "2026-01-15", {
			rdComprehensionScore: undefined,
		});
		await postAssessment(student.studentId, "2026 Sem 2", "2026-07-15", {
			newBand: "B5",
			rdComprehensionScore: undefined,
		});
		aiService.generateParentReport.mockResolvedValue({
			overallProgress: "Doing well.",
			literacyGrowth: "Improving.",
			teacherObservations: "",
			interventionAreas: "Keep going.",
		});

		const dashboard = await request(app).get(
			"/api/progress/DAS-RC-E2E/dashboard",
		);
		const comparison = await request(app).get("/api/comparison/DAS-RC-E2E");
		const report = await request(app)
			.post("/api/reports/DAS-RC-E2E/generate")
			.send({ generatedBy: "teacher-01" });

		const dashboardReadingComp = dashboard.body.bandScore.componentResults.find(
			(c) => c.name === "readingComp",
		);
		expect(dashboardReadingComp.passed).toBe(true);

		expect(comparison.body.componentComparison.readingComp.beforePassed).toBe(
			true,
		);
		expect(comparison.body.componentComparison.readingComp.afterPassed).toBe(
			true,
		);

		expect(report.status).toBe(201);
		// The report itself is AI-narrative text (mocked here), so we're
		// not asserting its wording — just that report generation didn't
		// fail or throw when handed a defaulted-pass component with a
		// null score, since that's the integration risk this behavior
		// introduces.
	});
});
