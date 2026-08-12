const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../services/aiService", () => ({
	generateParentReport: jest.fn(),
	generateRecommendations: jest.fn(),
}));

const { createApp } = require("../../../server");
const Student = require("../models/Student");
const Assessment = require("../models/Assessment");
const Report = require("../models/Report");
const aiService = require("../services/aiService");

const app = createApp({
	env: { NODE_ENV: "test", CORS_ORIGINS: "http://localhost:5173" },
});

const studentPayload = (overrides = {}) => ({
	studentId: "DAS-0707",
	centreId: "CENTRE-A",
	teacherId: "teacher-01",
	schLevel: "Primary",
	summaryBand: "B4",
	progress: "Same level",
	...overrides,
});

const assessmentPayload = (student, overrides = {}) => ({
	student,
	semester: "2026 Sem 1",
	assessmentDate: "2026-01-15T00:00:00.000Z",
	summaryBand: "B4",
	newBand: "B4",
	wraScore: 7,
	fluencyMark: 20,
	wordSpellingScore: 7,
	narrativeScore: 9,
	rdComprehensionScore: 6,
	teacherComments: "Initial assessment",
	...overrides,
});

async function createStudent(overrides = {}) {
	const response = await request(app)
		.post("/api/students")
		.send(studentPayload(overrides));
	expect(response.status).toBe(201);
	return response.body;
}

async function createAssessment(student, overrides = {}) {
	const response = await request(app)
		.post("/api/assessments")
		.send(assessmentPayload(student, overrides));
	expect(response.status).toBe(201);
	return response.body;
}

describe("Progress Monitoring API integration", () => {
	let mongo;

	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		await mongoose.connect(mongo.getUri());
		await Promise.all([
			Student.syncIndexes(),
			Assessment.syncIndexes(),
			Report.syncIndexes(),
		]);
	});

	afterEach(async () => {
		jest.clearAllMocks();
		await Promise.all([
			Student.deleteMany({}),
			Assessment.deleteMany({}),
			Report.deleteMany({}),
		]);
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongo.stop();
	});

	test("IT-STU-01: POST/GET/PUT/DELETE persists the student lifecycle", async () => {
		const created = await createStudent();

		const fetched = await request(app).get(
			`/api/students/${created.studentId}`,
		);
		expect(fetched.status).toBe(200);
		expect(fetched.body).toMatchObject({
			studentId: "DAS-0707",
			schLevel: "Primary",
			summaryBand: "B4",
		});

		const updated = await request(app)
			.put(`/api/students/${created._id}`)
			.send({ summaryBand: "B5" });
		expect(updated.status).toBe(200);
		expect(updated.body.summaryBand).toBe("B5");

		const removed = await request(app).delete(
			`/api/students/${created.studentId}`,
		);
		expect(removed.status).toBe(200);
		await expect(
			Student.countDocuments({ studentId: "DAS-0707" }),
		).resolves.toBe(0);
	});

	test("IT-STU-02: duplicate student IDs are rejected without creating another row", async () => {
		await createStudent();
		const duplicate = await request(app)
			.post("/api/students")
			.send(studentPayload());

		expect(duplicate.status).toBe(400);
		await expect(
			Student.countDocuments({ studentId: "DAS-0707" }),
		).resolves.toBe(1);
	});

	test("PMS-004: bulk insert accepts valid rows, reports a duplicate partition, and rejects empty input", async () => {
		const inserted = await request(app)
			.post("/api/students/bulk")
			.send([studentPayload(), studentPayload({ studentId: "XYZ-1000" })]);
		expect(inserted.status).toBe(201);
		expect(inserted.body).toHaveLength(2);

		const partialDuplicate = await request(app)
			.post("/api/students/bulk")
			.send([studentPayload(), studentPayload({ studentId: "NEW-2000" })]);
		expect(partialDuplicate.status).toBe(400);
		expect(await Student.countDocuments({ studentId: "DAS-0707" })).toBe(1);
		expect(await Student.countDocuments({ studentId: "NEW-2000" })).toBe(1);

		const empty = await request(app).post("/api/students/bulk").send([]);
		expect(empty.status).toBe(400);
	});

	test("PMS-006: student deletion cascades — assessments and reports are removed along with the student", async () => {
		const student = await createStudent();
		await createAssessment(student.studentId);
		await Report.create({
			student: student._id,
			overallProgress: "Saved report",
		});

		const removed = await request(app).delete(
			`/api/students/${student.studentId}`,
		);
		expect(removed.status).toBe(200);
		expect(await Student.countDocuments({ _id: student._id })).toBe(0);
		expect(await Assessment.countDocuments({ student: student._id })).toBe(0);
		expect(await Report.countDocuments({ student: student._id })).toBe(0);
	});

	test.each([
		["A1", 201],
		["C9", 201],
		["A0", 400],
		["C10", 400],
	])(
		"IT-PMS-02: summary-band boundary %s returns %s",
		async (summaryBand, status) => {
			const response = await request(app)
				.post("/api/students")
				.send(studentPayload({ studentId: `DAS-${summaryBand}`, summaryBand }));
			expect(response.status).toBe(status);
		},
	);

	test("IT-PMS-01: assessment CRUD persists ownership, updates, and deletion", async () => {
		const student = await createStudent();
		const created = await createAssessment(student.studentId, {
			phonicsScore: 62,
		});

		expect(created.student).toBe(student._id);
		expect(created.phonicsScore).toBe(62);

		const fetched = await request(app).get(`/api/assessments/${created._id}`);
		expect(fetched.status).toBe(200);
		expect(fetched.body.student.studentId).toBe("DAS-0707");

		const updated = await request(app)
			.put(`/api/assessments/${created._id}`)
			.send({ newBand: "B5", teacherComments: "Improved" });
		expect(updated.status).toBe(200);
		expect(updated.body).toMatchObject({
			newBand: "B5",
			teacherComments: "Improved",
		});

		const removed = await request(app).delete(
			`/api/assessments/${created._id}`,
		);
		expect(removed.status).toBe(200);
		expect(
			(await request(app).get(`/api/assessments/${created._id}`)).status,
		).toBe(404);
	});

	test("IT-PMS-03: overview and dashboard agree on the learner and latest assessment", async () => {
		const student = await createStudent();
		await createAssessment(student.studentId);
		await createAssessment(student._id, {
			semester: "2026 Sem 2",
			assessmentDate: "2026-07-15T00:00:00.000Z",
			newBand: "B5",
			wraScore: 9,
			wordSpellingScore: 9,
			narrativeScore: 12,
			rdComprehensionScore: 8,
			teacherComments: "Later assessment",
		});

		const [overview, dashboard] = await Promise.all([
			request(app).get("/api/progress/DAS-0707/overview"),
			request(app).get("/api/progress/DAS-0707/dashboard"),
		]);

		expect(overview.status).toBe(200);
		expect(dashboard.status).toBe(200);
		expect(overview.body.student.studentId).toBe("DAS-0707");
		expect(overview.body.lastSemester).toBe("2026 Sem 2");
		expect(dashboard.body).toMatchObject({ status: "ok", totalAssessments: 2 });
		expect(dashboard.body.latestAssessment.semester).toBe("2026 Sem 2");
		expect(
			dashboard.body.assessmentHistory.map((item) => item.semester),
		).toEqual(["2026 Sem 2", "2026 Sem 1"]);
	});

	test("IT-PMS-04: studentId search distinguishes match and no-match partitions", async () => {
		await createStudent();
		await createStudent({ studentId: "XYZ-1000", centreId: "CENTRE-B" });

		const matched = await request(app).get(
			"/api/progress/search?studentId=DAS-07",
		);
		const missing = await request(app).get(
			"/api/progress/search?studentId=NONE",
		);

		expect(matched.status).toBe(200);
		expect(matched.body.map((student) => student.studentId)).toEqual([
			"DAS-0707",
		]);
		expect(missing.status).toBe(200);
		expect(missing.body).toEqual([]);
	});

	test("IT-PMS-05: assessment progress handles zero and two-record histories", async () => {
		const student = await createStudent();
		const empty = await request(app).get(
			"/api/assessments/student/DAS-0707/progress",
		);
		expect(empty.status).toBe(200);
		expect(empty.body).toEqual([]);
		const emptyOverview = await request(app).get(
			"/api/progress/DAS-0707/overview",
		);
		expect(emptyOverview.status).toBe(200);
		expect(emptyOverview.body).toMatchObject({
			hasAssessments: false,
			bandScore: null,
			lastAssessmentDate: null,
		});

		await createAssessment(student.studentId);
		await createAssessment(student.studentId, {
			semester: "2026 Sem 2",
			assessmentDate: "2026-07-15T00:00:00.000Z",
		});
		const history = await request(app).get(
			"/api/assessments/student/DAS-0707/progress",
		);
		expect(history.status).toBe(200);
		expect(history.body.map((assessment) => assessment.semester)).toEqual([
			"2026 Sem 1",
			"2026 Sem 2",
		]);
	});

	test("IT-REP-01: comparison reports insufficient data for one record and changes for two", async () => {
		const student = await createStudent();
		await createAssessment(student.studentId);

		const insufficient = await request(app).get("/api/comparison/DAS-0707");
		expect(insufficient.status).toBe(200);
		expect(insufficient.body.status).toBe("insufficient_data");

		await createAssessment(student.studentId, {
			semester: "2026 Sem 2",
			assessmentDate: "2026-07-15T00:00:00.000Z",
			summaryBand: "B5",
			newBand: "B5",
			wraScore: 9,
			wordSpellingScore: 9,
			narrativeScore: 12,
			rdComprehensionScore: 9,
		});
		const comparison = await request(app).get("/api/comparison/DAS-0707");
		expect(comparison.status).toBe(200);
		expect(comparison.body.status).toBe("ok");
		expect(comparison.body.bandChange).toEqual({
			direction: "improved",
			steps: 1,
		});
		expect(comparison.body.componentComparison.wra).toMatchObject({
			before: 7,
			after: 9,
			change: 2,
		});
	});

	test("IT-REP-02/03: report generation persists populated sections; latest edit is whitelisted", async () => {
		const student = await createStudent();
		await createAssessment(student.studentId);
		await createAssessment(student.studentId, {
			semester: "2026 Sem 2",
			assessmentDate: "2026-07-15T00:00:00.000Z",
			newBand: "B5",
		});
		aiService.generateParentReport.mockResolvedValue({
			overallProgress: "Steady progress",
			literacyGrowth: "Stronger word reading",
			teacherObservations: "Participates consistently",
			interventionAreas: "Practise phonics daily",
		});

		const generated = await request(app)
			.post("/api/reports/DAS-0707/generate")
			.send({ generatedBy: "teacher-01" });
		expect(generated.status).toBe(201);
		expect(generated.body.report).toMatchObject({
			generatedBy: "teacher-01",
			overallProgress: "Steady progress",
			isEdited: false,
		});
		await expect(Report.countDocuments({ student: student._id })).resolves.toBe(
			1,
		);

		const latest = await request(app).get("/api/reports/DAS-0707/latest");
		expect(latest.status).toBe(200);
		expect(latest.body.student.studentId).toBe("DAS-0707");

		const edited = await request(app)
			.put(`/api/reports/${generated.body.report._id}/edit`)
			.send({
				teacherObservations: "Practise phonics daily",
				generatedBy: "attacker",
				student: new mongoose.Types.ObjectId().toString(),
			});
		expect(edited.status).toBe(200);
		expect(edited.body.teacherObservations).toBe("Practise phonics daily");
		expect(edited.body.generatedBy).toBe("teacher-01");
		expect(edited.body.student).toBe(student._id);
		expect(edited.body.isEdited).toBe(true);
		expect(edited.body.editedAt).toBeTruthy();
	});

	test("IT-REP-04: AI recommendations save success and return a controlled provider failure", async () => {
		const student = await createStudent();
		await createAssessment(student.studentId);
		await createAssessment(student.studentId, {
			semester: "2026 Sem 2",
			assessmentDate: "2026-07-15T00:00:00.000Z",
		});
		aiService.generateRecommendations.mockResolvedValue({
			summary: "Continue structured reading practice",
			strengths: "Fluency",
		});

		const success = await request(app).post("/api/ai/DAS-0707/recommendations");
		expect(success.status).toBe(200);
		expect(success.body).toMatchObject({
			status: "ok",
			recommendations: { summary: "Continue structured reading practice" },
		});
		const latest = await Assessment.findOne({ student: student._id }).sort({
			assessmentDate: -1,
		});
		expect(latest.aiInsights).toBe("Continue structured reading practice");

		aiService.generateRecommendations.mockRejectedValue(
			new Error("Provider rate limit: secret-token-must-not-leak"),
		);
		const failure = await request(app).post("/api/ai/DAS-0707/recommendations");
		expect(failure.status).toBe(500);
		expect(failure.body.message).toBe("Unable to generate recommendations");
		expect(JSON.stringify(failure.body)).not.toContain(
			"secret-token-must-not-leak",
		);
	});
});
