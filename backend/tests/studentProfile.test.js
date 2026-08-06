const mongoose = require("mongoose");
const StudentProfile = require("../src/models/studentProfile");

describe("StudentProfile model validation", () => {
  test.each([3, 4, 24, 25])(
    "accepts age %i inside the inclusive range",
    async (age) => {
      const student = new StudentProfile({
        studentId: `AGE-${age}`,
        name: "Test Student",
        age,
        yearLevel: "Primary 3",
      });

      await expect(student.validate()).resolves.toBeUndefined();
    }
  );

  test.each([
    [2, "below minimum"],
    [26, "above maximum"],
  ])("rejects age %i because it is %s", async (age) => {
    const student = new StudentProfile({
      studentId: `INVALID-${age}`,
      name: "Test Student",
      age,
      yearLevel: "Primary 3",
    });

    await expect(student.validate()).rejects.toMatchObject({
      errors: {
        age: expect.anything(),
      },
    });
  });

  test("trims student ID, name, year level and language", async () => {
    const student = new StudentProfile({
      studentId: "  DAS-101  ",
      name: "  Sarah Tan  ",
      age: 9,
      yearLevel: "  Primary 3  ",
      language: "  English (L1)  ",
    });

    await student.validate();

    expect(student.studentId).toBe("DAS-101");
    expect(student.name).toBe("Sarah Tan");
    expect(student.yearLevel).toBe("Primary 3");
    expect(student.language).toBe("English (L1)");
  });

  test("requires studentId and name", async () => {
    const student = new StudentProfile({
      age: 9,
      yearLevel: "Primary 3",
    });

    await expect(student.validate()).rejects.toMatchObject({
      errors: {
        studentId: expect.anything(),
        name: expect.anything(),
      },
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});