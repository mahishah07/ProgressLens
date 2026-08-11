const request = require("supertest");

jest.mock("googleapis", () => ({
	google: {
		auth: { GoogleAuth: jest.fn(() => ({})) },
		sheets: jest.fn(() => ({
			spreadsheets: {
				values: {
					get: jest.fn().mockResolvedValue({
						data: {
							values: [
								["Semester", "Student_ID", "Teacher_ID", "NewBand", "Word_Reading_Accuracy"],
								["2026 Sem 1", "DAS-SHEETS", "teacher-01", "B5", "9"],
							],
						},
					}),
				},
			},
		})),
	},
}));

jest.mock("../services/aiService", () => ({
	generateParentReport: jest.fn(),
	generateRecommendations: jest.fn(),
}));

const { createApp } = require("../../../server");
const sheetsSync = require("../services/sheetsSync");
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

const app = createApp({ env: { NODE_ENV: "test", CORS_ORIGINS: "http://localhost:5173" } });

describe("PMS concurrency and data-integrity tests", () => {
	beforeAll(connectTestDatabase);
	afterEach(clearTestDatabase);
	afterAll(stopTestDatabase);

	test("CON-001: 50 duplicate-create races produce one success and exactly one row each", async () => {
		for (let run = 0; run < 50; run += 1) {
			const payload = studentPayload(`RACE-${run}`);
			const responses = await Promise.all([
				request(app).post("/api/students").send(payload),
				request(app).post("/api/students").send(payload),
			]);
			expect(responses.map((response) => response.status).sort()).toEqual([201, 400]);
			expect(await Student.countDocuments({ studentId: `RACE-${run}` })).toBe(1);
		}
	});

	test("CON-006: concurrent edits to different report fields do not lose either field", async () => {
		const student = await Student.create(studentPayload("DAS-0707"));
		const report = await Report.create({
			student: student._id,
			generatedBy: "teacher-01",
			overallProgress: "Original overall",
			teacherObservations: "Original observation",
		});
		const [overall, observation] = await Promise.all([
			request(app).put(`/api/reports/${report._id}/edit`).send({ overallProgress: "Updated overall" }),
			request(app).put(`/api/reports/${report._id}/edit`).send({ teacherObservations: "Updated observation" }),
		]);
		expect([overall.status, observation.status]).toEqual([200, 200]);
		const stored = await Report.findById(report._id);
		expect(stored.overallProgress).toBe("Updated overall");
		expect(stored.teacherObservations).toBe("Updated observation");
		expect(stored.isEdited).toBe(true);
	});

	test("CON-007: simultaneous Sheets sync requests create one logical assessment", async () => {
		const student = await Student.create(studentPayload("DAS-SHEETS"));
		const responses = await Promise.all([
			sheetsSync.syncFromSheets(),
			sheetsSync.syncFromSheets(),
		]);
		expect(await Assessment.countDocuments({ student: student._id, semester: "2026 Sem 1" })).toBe(1);
		expect(responses.reduce((sum, response) => sum + response.created, 0)).toBe(1);
	});

	test("CON-008: ten parallel student workflows preserve ownership", async () => {
		const students = await Student.create(
			Array.from({ length: 10 }, (_, index) => studentPayload(`PAR-${index}`)),
		);
		const responses = await Promise.all(
			students.map((student, index) =>
				request(app)
					.post("/api/assessments")
					.send(
						assessmentPayload(student.studentId, "2026 Sem 1", "2026-01-15", {
							teacherComments: `OWNER-${index}`,
						}),
					),
			),
		);
		expect(responses.every((response) => response.status === 201)).toBe(true);
		for (let index = 0; index < students.length; index += 1) {
			const records = await Assessment.find({ student: students[index]._id });
			expect(records).toHaveLength(1);
			expect(records[0].teacherComments).toBe(`OWNER-${index}`);
		}
	});
});
