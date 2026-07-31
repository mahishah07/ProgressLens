const Student = require("../models/Student");

jest.mock("../models/Student");

const { resolveStudent } = require("../services/studentIdentityService");

describe("Student identity service", () => {
  beforeEach(() => jest.clearAllMocks());

  test("resolves the shared business studentId first", async () => {
    const student = { _id: "64b000000000000000000001", studentId: "DAS-0707" };
    Student.findOne.mockResolvedValue(student);

    await expect(resolveStudent("DAS-0707")).resolves.toBe(student);
    expect(Student.findOne).toHaveBeenCalledWith({ studentId: "DAS-0707" });
    expect(Student.findById).not.toHaveBeenCalled();
  });

  test("keeps existing MongoDB ObjectId URLs compatible", async () => {
    const student = { _id: "64b000000000000000000001", studentId: "DAS-0707" };
    Student.findOne.mockResolvedValue(null);
    Student.findById.mockResolvedValue(student);

    await expect(resolveStudent("64b000000000000000000001")).resolves.toBe(student);
    expect(Student.findById).toHaveBeenCalledWith("64b000000000000000000001");
  });

  test("returns null for an unknown identifier", async () => {
    Student.findOne.mockResolvedValue(null);
    await expect(resolveStudent("DAS-MISSING")).resolves.toBeNull();
  });
});
