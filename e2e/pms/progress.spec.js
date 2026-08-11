const { test, expect } = require("@playwright/test");

const overview = {
	student: {
		studentId: "DAS-0707",
		teacherId: "teacher-01",
		summaryBand: "B4",
	},
	currentBandLevel: "B4",
	latestNewBand: "B5",
	lastAssessmentDate: "2026-07-15T00:00:00.000Z",
	lastSemester: "2026 Sem 2",
	hasAssessments: true,
};

const dashboard = {
	status: "ok",
	student: { studentId: "DAS-0707", summaryBand: "B4" },
	totalAssessments: 2,
	latestAssessment: {
		semester: "2026 Sem 2",
		assessmentDate: "2026-07-15T00:00:00.000Z",
		teacherComments: "Improving steadily",
		weightedScore: 95,
		skillScores: { wra: 9, wordSpelling: 9 },
	},
	skillBreakdown: {
		strongest: "wra",
		weakest: "wordSpelling",
		breakdown: { wra: 9, wordSpelling: 9 },
	},
	progressOverTime: [
		{ semester: "2026 Sem 1", weightedScore: 70 },
		{ semester: "2026 Sem 2", weightedScore: 95 },
	],
	componentTrend: [],
	bandProgression: [{ semester: "2026 Sem 2", band: "B5", bandIndex: 4 }],
	assessmentHistory: [
		{
			semester: "2026 Sem 2",
			assessmentDate: "2026-07-15T00:00:00.000Z",
			summaryBand: "B4",
			newBand: "B5",
			weightedScore: 95,
			assessedBy: "teacher-01",
		},
		{
			semester: "2026 Sem 1",
			assessmentDate: "2026-01-15T00:00:00.000Z",
			summaryBand: "B4",
			newBand: "B4",
			weightedScore: 70,
			assessedBy: "teacher-01",
		},
	],
};

test.beforeEach(async ({ page }) => {
	await page.route("http://127.0.0.1:5001/api/progress/DAS-0707/overview", (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overview) }),
	);
	await page.route("http://127.0.0.1:5001/api/progress/DAS-0707/dashboard", (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dashboard) }),
	);
});

test("E2E-008 browser: educator opens a student and views chronological progress", async ({ page }) => {
	await page.goto("/student/DAS-0707");
	await expect(page.getByRole("heading", { name: "DAS-0707" })).toBeVisible();
	await expect(page.getByText("15 Jul 2026")).toBeVisible();
	await expect(page.getByText("B5", { exact: true })).toBeVisible();

	await page.getByRole("button", { name: /View Student Profile/i }).click();
	await expect(page.getByRole("heading", { name: "Assessment History" })).toBeVisible();
	await expect(page.getByRole("cell", { name: "2026 Sem 2" })).toBeVisible();
	await expect(page.getByRole("cell", { name: "95%" })).toBeVisible();
	await expect(page.getByRole("button", { name: /Back to Overview/i })).toBeVisible();
});

test("browser robustness: controlled API failure is shown instead of a blank page", async ({ page }) => {
	await page.route("http://127.0.0.1:5001/api/progress/UNKNOWN/overview", (route) =>
		route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "Student not found" }) }),
	);
	await page.goto("/student/UNKNOWN");
	await expect(page.getByText("Student not found")).toBeVisible();
});
