    jest.mock("../src/repositories/studentRepository", () => ({
  create: jest.fn(),
  findByStudentId: jest.fn(),
  search: jest.fn(),
}));

const request = require("supertest");
const studentRepository = require("../src/repositories/studentRepository");
const app = require("../src/app");

describe("Student search route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    "/api/students",
    "/api/students?q=",
    "/api/students?q=%20%20%20",
  ])("rejects an empty search query: %s", async (url) => {
    const response = await request(app).get(url);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: "Search query q is required.",
    });
    expect(studentRepository.search).not.toHaveBeenCalled();
  });

  test("trims the query before searching", async () => {
    studentRepository.search.mockResolvedValue([
      {
        _id: "student-id",
        studentId: "DAS-101",
        name: "Sarah Tan",
      },
    ]);

    const response = await request(app).get(
      "/api/students?q=%20%20Sarah%20%20"
    );

    expect(response.statusCode).toBe(200);
    expect(studentRepository.search).toHaveBeenCalledWith("Sarah");
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      studentId: "DAS-101",
      name: "Sarah Tan",
    });
  });

  test("returns an empty array when no students match", async () => {
    studentRepository.search.mockResolvedValue([]);

    const response = await request(app).get(
      "/api/students?q=UnknownStudent"
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [],
    });
  });
});