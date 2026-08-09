/*
 * Azure is mocked, so these tests do NOT make real Azure requests.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

/*
 * Mock Azure Document Intelligence SDK
 * before loading ocrService.
 */
jest.mock("@azure/ai-form-recognizer", () => {
  const mockBeginAnalyzeDocument = jest.fn();

  const DocumentAnalysisClient = jest.fn().mockImplementation(() => ({
    beginAnalyzeDocument: mockBeginAnalyzeDocument,
  }));

  const AzureKeyCredential = jest.fn().mockImplementation((key) => ({
    key,
  }));

  return {
    DocumentAnalysisClient,
    AzureKeyCredential,
    __mockBeginAnalyzeDocument: mockBeginAnalyzeDocument,
  };
});

const azureSdk = require("@azure/ai-form-recognizer");

/*
 * Dummy environment values.
 * These are NOT real Azure credentials.
 */
process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT =
  process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ||
  "https://progresslens-test.cognitiveservices.azure.com";

process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY =
  process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ||
  "test-key";

process.env.AZURE_FORM_RECOGNIZER_ENDPOINT =
  process.env.AZURE_FORM_RECOGNIZER_ENDPOINT ||
  "https://progresslens-test.cognitiveservices.azure.com";

process.env.AZURE_FORM_RECOGNIZER_KEY =
  process.env.AZURE_FORM_RECOGNIZER_KEY ||
  "test-key";

process.env.AZURE_ENDPOINT =
  process.env.AZURE_ENDPOINT ||
  "https://progresslens-test.cognitiveservices.azure.com";

process.env.AZURE_KEY =
  process.env.AZURE_KEY ||
  "test-key";


const {
  extractDocument,
  textFromSpans,
} = require("../src/services/ocrService");


jest.setTimeout(10000);

const mockBeginAnalyzeDocument =
  azureSdk.__mockBeginAnalyzeDocument;


/*
 * Simulates the poller returned by Azure.
 */
function createPoller(result) {
  return {
    pollUntilDone: jest.fn().mockResolvedValue(result),
  };
}


/*
 * Creates a fake Azure HTTP error.
 */
function createAzureError(statusCode, message) {
  return Object.assign(new Error(message), {
    statusCode,
  });
}


/*
 * Create a temporary fake image file.
 *
 * This lets the test work whether ocrService
 * reads file.buffer or file.path.
 */
const tempFilePath = path.join(
  os.tmpdir(),
  `progresslens-ocr-test-${process.pid}.png`
);

const testBytes = Buffer.from("synthetic-image-bytes");


beforeAll(() => {
  fs.writeFileSync(tempFilePath, testBytes);
});


afterAll(() => {
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
});


beforeEach(() => {
  jest.clearAllMocks();
});


/*  OCR-001
   Test reconstruction of text from Azure spans 
*/

describe("OCR-001 - textFromSpans", () => {

  test("returns an empty string when no spans are supplied", () => {
    expect(
      textFromSpans("hello world", [])
    ).toBe("");

    expect(
      textFromSpans("hello world", undefined)
    ).toBe("");

    expect(
      textFromSpans("hello world", null)
    ).toBe("");
  });


  test("reconstructs text from one valid span", () => {
    const content =
      "Printed prompt. Student answer.";

    const start =
      content.indexOf("Student answer");

    const result = textFromSpans(
      content,
      [
        {
          offset: start,
          length: "Student answer".length,
        },
      ]
    );

    expect(result).toBe(
      "Student answer"
    );
  });


  test("reconstructs text from multiple spans", () => {
    const content =
      "alpha beta gamma";

    const result = textFromSpans(
      content,
      [
        {
          offset: 0,
          length: 5,
        },
        {
          offset: 11,
          length: 5,
        },
      ]
    );

    expect(result).toContain("alpha");
    expect(result).toContain("gamma");

    /*
     * beta was not part of either span.
     */
    expect(result).not.toContain("beta");
  });


  test("handles malformed or out-of-range spans without crashing", () => {
    const content =
      "hello world";

    expect(() =>
      textFromSpans(
        content,
        [
          {
            offset: -10,
            length: 4,
          },
          {
            offset: 9999,
            length: 5,
          },
          {
            offset: "wrong",
            length: 2,
          },
          null,
        ]
      )
    ).not.toThrow();


    const result = textFromSpans(
      content,
      [
        {
          offset: 9999,
          length: 5,
        },
      ]
    );

    expect(typeof result).toBe(
      "string"
    );
  });

});


/* 
   OCR-002
   Test successful Azure OCR responses
*/

describe(
  "OCR-002 - extractDocument Azure success variants",
  () => {

    test(
      "returns content, handwritten text, and tables",
      async () => {

        const content =
          "Printed instruction. My handwritten answer is here.";

        const handwritten =
          "My handwritten answer is here.";

        const handwrittenOffset =
          content.indexOf(handwritten);


        const tables = [
          {
            rowCount: 2,
            columnCount: 2,

            cells: [
              {
                rowIndex: 0,
                columnIndex: 0,
                content: "Question",
              },
              {
                rowIndex: 0,
                columnIndex: 1,
                content: "Answer",
              },
              {
                rowIndex: 1,
                columnIndex: 0,
                content: "1",
              },
              {
                rowIndex: 1,
                columnIndex: 1,
                content: "The dog ran.",
              },
            ],
          },
        ];


        /*
         * Fake response that Azure would normally return.
         */
        const azureResult = {
          content,

          styles: [
            {
              isHandwritten: true,

              spans: [
                {
                  offset: handwrittenOffset,
                  length: handwritten.length,
                },
              ],
            },
          ],

          tables,

          pages: [
            {
              pageNumber: 1,
            },
          ],
        };


        mockBeginAnalyzeDocument.mockResolvedValue(
          createPoller(azureResult)
        );


        const result =
          await extractDocument({
            path: tempFilePath,
            buffer: testBytes,

            originalname:
              "student-writing.png",

            mimetype:
              "image/png",

            size:
              testBytes.length,
          });


        /*
         * Azure should have been called once.
         */
        expect(
          mockBeginAnalyzeDocument
        ).toHaveBeenCalledTimes(1);


        /*
         * Check that a model and document
         * were passed to Azure.
         */
        const [
          modelId,
          documentSource,
        ] =
          mockBeginAnalyzeDocument
            .mock.calls[0];


        expect(
          modelId
        ).toEqual(
          expect.any(String)
        );


        expect(
          documentSource
        ).toBeDefined();


        /*
         * Check final normalized OCR result.
         */
        expect(
          result
        ).toEqual(
          expect.objectContaining({
            content,

            handwrittenText:
              expect.any(String),

            tables,
          })
        );


        expect(
          result.handwrittenText
        ).toContain(
          "My handwritten answer is here."
        );
      }
    );


    test(
      "handles a printed-only document",
      async () => {

        const azureResult = {
          content:
            "This document contains printed text only.",

          styles: [],

          tables: [],

          pages: [
            {
              pageNumber: 1,
            },
          ],
        };


        mockBeginAnalyzeDocument.mockResolvedValue(
          createPoller(azureResult)
        );


        const result =
          await extractDocument({
            path: tempFilePath,
            buffer: testBytes,

            originalname:
              "printed.png",

            mimetype:
              "image/png",

            size:
              testBytes.length,
          });


        expect(
          result.content
        ).toBe(
          "This document contains printed text only."
        );


        expect(
          result.tables
        ).toEqual([]);


        expect(
          result.handwrittenText || ""
        ).toBe("");
      }
    );

  }
);


/*
   OCR-003
   Test Azure failures and malformed results
*/

describe(
  "OCR-003 - Azure failures and malformed results",
  () => {

    test.each([
      [
        401,
        "Azure authentication failed",
      ],

      [
        429,
        "Azure rate limit exceeded",
      ],

      [
        500,
        "Azure internal server error",
      ],
    ])(
      "maps Azure HTTP %i to a controlled OCR service error",
      async (
        statusCode,
        message
      ) => {

        /*
         * Simulate Azure rejecting the request.
         */
        mockBeginAnalyzeDocument.mockRejectedValue(
          createAzureError(
            statusCode,
            message
          )
        );


        await expect(
          extractDocument({
            path: tempFilePath,
            buffer: testBytes,

            originalname:
              "student-writing.png",

            mimetype:
              "image/png",

            size:
              testBytes.length,
          })
        ).rejects.toMatchObject({
          statusCode: 503,

          message:
            expect.any(String),
        });
      }
    );


    test(
      "maps an Azure timeout to a controlled OCR service error",
      async () => {

        const timeoutError =
          Object.assign(
            new Error(
              "The Azure OCR request timed out"
            ),
            {
              name:
                "AbortError",

              code:
                "ETIMEDOUT",
            }
          );


        mockBeginAnalyzeDocument.mockRejectedValue(
          timeoutError
        );


        await expect(
          extractDocument({
            path: tempFilePath,
            buffer: testBytes,

            originalname:
              "student-writing.png",

            mimetype:
              "image/png",

            size:
              testBytes.length,
          })
        ).rejects.toMatchObject({
          statusCode: 503,

          message:
            expect.any(String),
        });
      }
    );


    test(
      "rejects an empty Azure operation result instead of crashing",
      async () => {

        mockBeginAnalyzeDocument.mockResolvedValue(
          createPoller(undefined)
        );


        await expect(
          extractDocument({
            path: tempFilePath,
            buffer: testBytes,

            originalname:
              "student-writing.png",

            mimetype:
              "image/png",

            size:
              testBytes.length,
          })
        ).rejects.toMatchObject({
          statusCode: 503,

          message:
            expect.any(String),
        });
      }
    );


    test(
      "handles malformed-but-present Azure result safely",
      async () => {

        /*
         * Azure returns content,
         * but styles/tables are malformed.
         */
        mockBeginAnalyzeDocument.mockResolvedValue(
          createPoller({
            content:
              "Readable text",

            styles:
              null,

            tables:
              null,
          })
        );


        const result =
          await extractDocument({
            path: tempFilePath,
            buffer: testBytes,

            originalname:
              "student-writing.png",

            mimetype:
              "image/png",

            size:
              testBytes.length,
          });


        expect(
          result.content
        ).toBe(
          "Readable text"
        );


        expect(
          result.handwrittenText || ""
        ).toBe("");


        expect(
          Array.isArray(
            result.tables
          )
        ).toBe(true);
      }
    );

  }
);