jest.mock("../src/services/reportPipelineService", () => ({ processWritingSample: jest.fn() }));

const request = require("supertest");
const app = require("../src/app");
const { processWritingSample } = require("../src/services/reportPipelineService");

beforeEach(() => {
  jest.clearAllMocks();
  processWritingSample.mockResolvedValue({
    student: { studentId: "EPA-001" },
    writingSample: { _id: "sample-id" },
    report: { _id: "report-id" },
  });
});

/*
 * BLACK-BOX EQUIVALENCE-PARTITION GROUP
 * Sends requests only through the public HTTP API. It does not depend on controller internals.
 * Partitions cover null, wrong-type, empty, whitespace and student-ID normalisation inputs.
 */
describe("EPA black-box API partitions", () => {
  test.each([
    ["null", { essayText: null }],
    ["number", { essayText: 123 }],
    ["array", { essayText: [] }],
    ["empty", { essayText: "" }],
    ["whitespace", { essayText: "  \n\t  " }],
  ])("BB-01 rejects %s essay text", async (_, body) => {
    const response = await request(app).post("/api/analyse").send(body);
    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ success: false });
  });

  test("BB-03 trims the student ID at the upload boundary", async () => {
    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", "  EPA-001  ")
      .attach("assignment", Buffer.from("image"), { filename: "work.png", contentType: "image/png" });
    expect(response.statusCode).toBe(201);
    expect(processWritingSample).toHaveBeenCalledWith(expect.objectContaining({ studentId: "EPA-001" }));
  });

  test.each(["", " ", "\n\t"])("BB-04 rejects blank student ID %j", async (studentId) => {
    const response = await request(app)
      .post("/api/uploads/writing-sample")
      .field("studentId", studentId)
      .attach("assignment", Buffer.from("image"), { filename: "work.png", contentType: "image/png" });
    expect(response.statusCode).toBe(400);
    expect(processWritingSample).not.toHaveBeenCalled();
  });

});
