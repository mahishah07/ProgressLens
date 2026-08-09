const mongoose = require("mongoose");
const request = require("supertest");
const {
  MongoMemoryReplSet,
} = require("mongodb-memory-server");


/*
mock OPENAI API request to test MongoDB transaction behaviour
 */
jest.mock(
  "../src/services/interventionRecommendationService",
  () => {
    const actual = jest.requireActual(
      "../src/services/interventionRecommendationService"
    );

    return {
      ...actual,
      analyseReportWithOpenAi: jest.fn(),
    };
  }
);


const {
  analyseReportWithOpenAi,
} = require(
  "../src/services/interventionRecommendationService"
);


/*
REAL repositories
do NOT jest.mock() them
 */
const studentRepository = require(
  "../src/repositories/studentRepository"
);

const reportRepository = require(
  "../src/repositories/reportRepository"
);

const writingSampleRepository = require(
  "../src/repositories/writingSampleRepository"
);


/*
real writing-sample pipeline to create a proper report + writing sample in the temp MongoDB
 */
const {
  processWritingSample,
} = require(
  "../src/services/reportPipelineService"
);


const realMarkAnalysed =
  writingSampleRepository.markAnalysed.bind(
    writingSampleRepository
  );


let failSecondWrite = false;


/*
 failSecondWrite = true, causes the second DB operation to fail
 */
jest
  .spyOn(
    writingSampleRepository,
    "markAnalysed"
  )
  .mockImplementation(
    async (...args) => {
      if (failSecondWrite) {
        throw new Error(
          "Injected writing-sample failure"
        );
      }

      return realMarkAnalysed(...args);
    }
  );



const app = require("../src/app");


jest.setTimeout(60000);


let replSet;


/*
temp MongoDB replica set for transaction testing
 */
beforeAll(async () => {
  replSet =
    await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });

  const mongoUri =
    replSet.getUri();

  await mongoose.connect(
    mongoUri,
    {
      dbName:
        "progresslens-transaction-test",
    }
  );
});


beforeEach(async () => {
  failSecondWrite = false;

  jest.clearAllMocks();

  const collections =
    await mongoose.connection.db.collections();

  for (
    const collection of collections
  ) {
    await collection.deleteMany({});
  }
});


afterAll(async () => {
  await mongoose.disconnect();

  if (replSet) {
    await replSet.stop();
  }

  jest.restoreAllMocks();
});


/*
find a document directly in MongoDB
 */
async function findDocumentById(id) {
  const objectId =
    typeof id === "string"
      ? new mongoose.Types.ObjectId(id)
      : id;

  const collections =
    await mongoose.connection.db
      .listCollections()
      .toArray();

  for (
    const { name } of collections
  ) {
    const document =
      await mongoose.connection.db
        .collection(name)
        .findOne({
          _id: objectId,
        });

    if (document) {
      return {
        collection: name,
        document,
      };
    }
  }

  return null;
}


/*
create a real report + writing sample
 */
async function createTestReport() {

  await studentRepository.create({
    studentId:
      "TX-001",

    name:
      "Transaction Test Student",

    age:
      9,

    yearLevel:
      "Primary 3",
  });


  const fileBytes =
    Buffer.from(
      "transaction-test-file"
    );


  /*
 external OCR/spelling dependencies are stubbed.
 testing database transactions.
   */
  const ocrResult = {
    content:
      "The bog ran home.",

    handwrittenText:
      "The bog ran home.",

    tables:
      [],
  };


  const result =
    await processWritingSample(
      {
        studentId:
          "TX-001",

        expectedText:
          "The dog ran home.",

        file: {
          path:
            "/tmp/transaction-test.pdf",

          buffer:
            fileBytes,

          originalname:
            "transaction-test.pdf",

          filename:
            "transaction-test.pdf",

          mimetype:
            "application/pdf",

          size:
            fileBytes.length,
        },
      },

      {
        /*
         REAL repositories
         */
        studentRepository,
        writingSampleRepository,
        reportRepository,


        /*
         FAKE external services
         */
        extractDocument:
          jest
            .fn()
            .mockResolvedValue(
              ocrResult
            ),

        extractText:
          jest
            .fn()
            .mockResolvedValue(
              ocrResult.content
            ),

        checkSpelling:
          jest
            .fn()
            .mockResolvedValue([]),

        readFile:
          jest
            .fn()
            .mockResolvedValue(
              fileBytes
            ),
      }
    );


  return {
    reportId:
      String(
        result.report._id
      ),

    writingSampleId:
      String(
        result.writingSample._id
      ),
  };
}


/*
Fake a VALID OpenAI result
 */
function configureOpenAiSuccess() {

  analyseReportWithOpenAi
    .mockImplementation(
      async ({
        errors,
      }) => {

        /*
        OpenAI must return a correction corresponding to each existing error ID.
         */
        const corrections =
          errors.map(
            (error) => ({
              errorId:
                String(
                  error._id
                ),

              expectedCorrection:
                error.expected ||
                (
                  error.actual ===
                  "bog"
                    ? "dog"
                    : error.actual
                ),

              explanation:
                "Synthetic correction for transaction testing.",
            })
          );


        return {
          correctedText:
            "The dog ran home.",

          corrections,

          grammarErrors:
            [],

          recommendation: {
            status:
              "completed",

            overview:
              "Practise accurate letter recognition.",

            dominantPattern:
              "Letter reversal",

            interventions: [
              {
                title:
                  "Letter mapping",

                rationale:
                  "Supports letter recognition.",

                activities: [
                  "Practise distinguishing b and d",
                ],

                frequency:
                  "3 times/week",
              },
            ],

            educatorCaution:
              "Review this recommendation before use.",

            model:
              "transaction-test-model",

            generatedAt:
              new Date().toISOString(),

            error:
              "",
          },
        };
      }
    );
}



describe(
  "Report analysis MongoDB transaction",
  () => {

    test(
      "RP-016 commits both report and writing sample when both writes succeed",
      async () => {

        const {
          reportId,
          writingSampleId,
        } =
          await createTestReport();


        configureOpenAiSuccess();

        const response =
          await request(app)
            .post(
              `/api/reports/${reportId}/analyse`
            );

        expect(
          response.statusCode
        ).toBe(200);

        const reportAfter =
          await findDocumentById(
            reportId
          );

        const sampleAfter =
          await findDocumentById(
            writingSampleId
          );


        expect(
          reportAfter
        ).not.toBeNull();

        expect(
          sampleAfter
        ).not.toBeNull();

        expect(
          reportAfter.document
            .interventionRecommendation
            .status
        ).toBe(
          "completed"
        );


        expect(
          sampleAfter.document.status
        ).toBe(
          "analysed"
        );
      }
    );



    test(
      "RP-017 rolls back report update when writing sample update fails",
      async () => {


        const {
          reportId,
          writingSampleId,
        } =
          await createTestReport();


        configureOpenAiSuccess();

        const reportBefore =
          await findDocumentById(
            reportId
          );

        const sampleBefore =
          await findDocumentById(
            writingSampleId
          );

        failSecondWrite = true;

        const response =
          await request(app)
            .post(
              `/api/reports/${reportId}/analyse`
            );


        expect(
          response.statusCode
        ).toBe(500);

        const reportAfter =
          await findDocumentById(
            reportId
          );

        const sampleAfter =
          await findDocumentById(
            writingSampleId
          );


        expect(
          reportAfter.document
        ).toEqual(
          reportBefore.document
        );


        expect(
          sampleAfter.document
        ).toEqual(
          sampleBefore.document
        );

        expect(
          sampleAfter.document.status
        ).toBe(
          "uploaded"
        );
      }
    );

  }
);