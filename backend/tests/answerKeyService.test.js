const { extractAnswers, processAnswerKey } = require("../src/services/answerKeyService");

describe("Answer key processing", () => {
  const cells = [
    { rowIndex: 0, columnIndex: 0, content: "Sr No." },
    { rowIndex: 0, columnIndex: 2, content: "Actual Answer" },
    { rowIndex: 1, columnIndex: 2, content: "He ran." },
    { rowIndex: 2, columnIndex: 2, content: "Fox hunts." },
    { rowIndex: 3, columnIndex: 2, content: "I sang," },
    { rowIndex: 4, columnIndex: 2, content: "Pam swims." },
    { rowIndex: 5, columnIndex: 2, content: "Tom hops." },
  ];

  test("extracts the expected-answer column in row order", () => {
    expect(extractAnswers([{ cells }])).toEqual(["He ran.", "Fox hunts.", "I sang,", "Pam swims.", "Tom hops."]);
  });

  test("stores the answer-key image bytes and OCR result", async () => {
    const create = jest.fn().mockImplementation(async (data) => ({ _id: "key-id", ...data, toObject: () => ({ _id: "key-id", ...data }) }));
    const result = await processAnswerKey({
      title: "Edit and Diagram 1",
      file: { path: "/tmp/key.png", originalname: "key.png", mimetype: "image/png", size: 9 },
    }, {
      extractDocument: jest.fn().mockResolvedValue({ content: "answer key text", tables: [{ cells }] }),
      answerKeyRepository: { create },
      readFile: jest.fn().mockResolvedValue(Buffer.from("key-bytes")),
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      fileData: Buffer.from("key-bytes"),
      expectedText: "He ran. Fox hunts. I sang, Pam swims. Tom hops.",
    }));
    expect(result.fileData).toBeUndefined();
  });
});
