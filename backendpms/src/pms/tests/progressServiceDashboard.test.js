const Assessment = require("../models/Assessment");
const Student = require("../models/Student");

jest.mock("../models/Assessment");
jest.mock("../models/Student");
jest.mock("../services/studentIdentityService");

const { resolveStudent } = require("../services/studentIdentityService");
const progressService = require("../services/progressService");

describe("UT-PMS-07 — buildDashboard equivalence classes", () => {
	beforeEach(() => jest.clearAllMocks());

	test("no assessments returns assessment_pending status", async () => {
		resolveStudent.mockResolvedValue({ _id: "s1", studentId: "Student 0001" });
		Assessment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
		const result = await progressService.buildDashboard("Student 0001");
		expect(result.status).toBe("assessment_pending");
	});

	test("single assessment returns componentTrend with one entry", async () => {
		resolveStudent.mockResolvedValue({
			_id: "s1",
			studentId: "Student 0001",
			summaryBand: "A3",
			schLevel: "Primary",
		});
		Assessment.find.mockReturnValue({
			sort: jest.fn().mockResolvedValue([
				{
					_id: "a1",
					semester: "2024 Sem 1",
					assessmentDate: new Date(),
					summaryBand: "A3",
					newBand: "A3",
					wraScore: 8,
				},
			]),
		});
		const result = await progressService.buildDashboard("Student 0001");
		expect(result.status).toBe("ok");
		expect(result.componentTrend).toHaveLength(1);
	});
});
