const request = require("supertest");
const { app } = require("../../../server");

jest.mock("../models/Student");
jest.mock("../models/Assessment");
jest.mock("../services/studentIdentityService");

const { resolveStudent } = require("../services/studentIdentityService");

describe("PMS malformed ID handling across routes", () => {
	beforeEach(() => jest.clearAllMocks());

	test("GET /api/progress/:id/overview with malformed ID returns 404, not 500", async () => {
		resolveStudent.mockResolvedValue(null);

		const res = await request(app).get("/api/progress/not-a-valid-id/overview");

		expect(res.status).toBe(404);
		expect(res.status).not.toBe(500);
	});

	test("GET /api/progress/:id/dashboard with malformed ID returns 404, not 500", async () => {
		resolveStudent.mockResolvedValue(null);

		const res = await request(app).get("/api/progress/!!!invalid!!!/dashboard");

		expect(res.status).toBe(404);
		expect(res.status).not.toBe(500);
	});

	test("GET /api/comparison/:id with malformed ID returns 404, not 500", async () => {
		resolveStudent.mockResolvedValue(null);

		const res = await request(app).get("/api/comparison/malformed-id-here");

		expect(res.status).toBe(404);
		expect(res.status).not.toBe(500);
	});

	test("GET /api/progress/:id/dashboard with empty string ID does not crash server", async () => {
		const res = await request(app).get("/api/progress//dashboard");

		// route mismatch (404) is acceptable — the point is no 500 crash
		expect(res.status).not.toBe(500);
	});

	test("GET /api/progress/:id/dashboard with extremely long garbage ID does not crash server", async () => {
		resolveStudent.mockResolvedValue(null);
		const longId = "a".repeat(500);

		const res = await request(app).get(`/api/progress/${longId}/dashboard`);

		expect(res.status).not.toBe(500);
	});
});
