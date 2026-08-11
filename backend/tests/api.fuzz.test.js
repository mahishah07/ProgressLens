jest.mock("../src/repositories/reportRepository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByStudent: jest.fn(),
  updateReview: jest.fn(),
  saveOpenAiAnalysis: jest.fn(),
}));

jest.mock("../src/repositories/writingSampleRepository", () => ({
  create: jest.fn(),
  markAnalysed: jest.fn(),
  findFileById: jest.fn(),
}));

jest.mock("../src/repositories/studentRepository", () => ({
  create: jest.fn(),
  findByStudentId: jest.fn(),
  search: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");

const reportRepository = require(
  "../src/repositories/reportRepository"
);

const writingSampleRepository = require(
  "../src/repositories/writingSampleRepository"
);

const studentRepository = require(
  "../src/repositories/studentRepository"
);

function createCastError(value) {
  const error = new Error(
    `Cast to ObjectId failed for value "${value}"`
  );

  error.name = "CastError";
  error.path = "_id";
  error.value = value;

  return error;
}

function createRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function randomString(random, length) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_!@$%^&*()";

  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += characters[
      Math.floor(random() * characters.length)
    ];
  }

  return value;
}

function generateMalformedIds(seed, count) {
  const random = createRandom(seed);
  const ids = [];

  for (let index = 0; index < count; index += 1) {
    const length =
      1 + Math.floor(random() * 35);

    let id = randomString(
      random,
      length
    );

    if (/^[a-f0-9]{24}$/i.test(id)) {
      id += "x";
    }

    ids.push(id);
  }

  return ids;
}

function generateUnknownRoutes(seed, count) {
  const random = createRandom(seed);
  const routes = [];

  for (let index = 0; index < count; index += 1) {
    const first = randomString(
      random,
      5 + Math.floor(random() * 10)
    );

    const second = randomString(
      random,
      5 + Math.floor(random() * 10)
    );

    routes.push(
      `/api/fuzz-${first}/${second}`
    );
  }

  return routes;
}

function generateRandomJsonValue(random, depth = 0) {
  const type =
    Math.floor(random() * 7);

  if (depth >= 2) {
    return randomString(
      random,
      Math.floor(random() * 20)
    );
  }

  if (type === 0) {
    return null;
  }

  if (type === 1) {
    return random() > 0.5;
  }

  if (type === 2) {
    return Math.floor(
      random() * 1000000
    );
  }

  if (type === 3) {
    return randomString(
      random,
      Math.floor(random() * 50)
    );
  }

  if (type === 4) {
    return [
      generateRandomJsonValue(
        random,
        depth + 1
      ),
      generateRandomJsonValue(
        random,
        depth + 1
      ),
    ];
  }

  if (type === 5) {
    return {
      reviewStatus:
        generateRandomJsonValue(
          random,
          depth + 1
        ),
      educatorSummary:
        generateRandomJsonValue(
          random,
          depth + 1
        ),
    };
  }

  return {
    randomField:
      generateRandomJsonValue(
        random,
        depth + 1
      ),
  };
}

function expectControlledResponse(response) {
  expect(
    Number.isInteger(response.statusCode)
  ).toBe(true);

  expect(
    response.statusCode
  ).toBeGreaterThanOrEqual(200);

  expect(
    response.statusCode
  ).toBeLessThan(600);

  expect(
    response.text || ""
  ).not.toMatch(
    /node_modules|at Object\.|at Layer\.|\.js:\d+:\d+/
  );
}

async function expectServerAlive() {
  const response =
    await request(app).get(
      "/api/health"
    );

  expect(response.statusCode).toBe(200);
  expect(response.body.status).toBe(
    "ok"
  );
}

describe("API fuzz robustness", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    reportRepository.findById.mockImplementation(
      async (id) => {
        throw createCastError(id);
      }
    );

    reportRepository.updateReview.mockImplementation(
      async (id) => {
        if (
          !/^[a-f0-9]{24}$/i.test(id)
        ) {
          throw createCastError(id);
        }

        return {
          _id: id,
          reviewStatus: "in_review",
        };
      }
    );

    writingSampleRepository.findFileById.mockImplementation(
      async (id) => {
        throw createCastError(id);
      }
    );

    studentRepository.create.mockImplementation(
      async (data) => ({
        _id: "student-test-id",
        ...data,
      })
    );

    studentRepository.search.mockResolvedValue(
      []
    );
  });

  describe("random malformed MongoDB IDs", () => {
    test("random report IDs return controlled errors without crashing", async () => {
      const ids =
        generateMalformedIds(
          12345,
          50
        );

      for (const id of ids) {
        const response =
          await request(app).get(
            `/api/reports/${encodeURIComponent(
              id
            )}`
          );

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          response.body.error
        ).toEqual(expect.any(String));

        expectControlledResponse(
          response
        );
      }

      await expectServerAlive();
    });

    test("random review IDs return controlled errors without crashing", async () => {
      const ids =
        generateMalformedIds(
          67890,
          40
        );

      for (const id of ids) {
        const response =
          await request(app)
            .patch(
              `/api/reports/${encodeURIComponent(
                id
              )}/review`
            )
            .send({
              reviewStatus:
                "in_review",
              educatorSummary:
                "Fuzz test",
            });

        expect(
          response.statusCode
        ).toBe(400);

        expectControlledResponse(
          response
        );
      }

      await expectServerAlive();
    });

    test("random writing sample IDs return controlled errors without crashing", async () => {
      const ids =
        generateMalformedIds(
          24680,
          40
        );

      for (const id of ids) {
        const response =
          await request(app).get(
            `/api/writing-samples/${encodeURIComponent(
              id
            )}/file`
          );

        expect(
          response.statusCode
        ).toBe(400);

        expectControlledResponse(
          response
        );
      }

      await expectServerAlive();
    });
  });

  describe("malformed JSON syntax", () => {
    test.each([
      "{",
      '{"reviewStatus":',
      '{"reviewStatus":"in_review",}',
      '["unterminated"',
      "{not-json}",
      '{"a":1 "b":2}',
      "null trailing-data",
      '{"nested":{"value":}}',
      '{"array":[1,2,]}',
      '"unterminated',
    ])(
      "malformed JSON does not crash the server: %s",
      async (payload) => {
        const response =
          await request(app)
            .patch(
              "/api/reports/507f1f77bcf86cd799439011/review"
            )
            .set(
              "Content-Type",
              "application/json"
            )
            .send(payload);

        expect(
          response.statusCode
        ).toBeGreaterThanOrEqual(
          400
        );

        expect(
          response.statusCode
        ).toBeLessThan(500);

        expectControlledResponse(
          response
        );

        await expectServerAlive();
      }
    );
  });

  describe("random JSON body types", () => {
    test("random review bodies never crash the API", async () => {
      const random =
        createRandom(13579);

      for (
        let index = 0;
        index < 75;
        index += 1
      ) {
        const body =
          generateRandomJsonValue(
            random
          );

        let operation =
          request(app)
            .patch(
              "/api/reports/507f1f77bcf86cd799439011/review"
            )
            .set(
              "Content-Type",
              "application/json"
            );

        if (body !== null) {
          operation =
            operation.send(body);
        }

        const response =
          await operation;

        expectControlledResponse(
          response
        );

        expect(
          response.statusCode
        ).toBeLessThan(500);
      }

      await expectServerAlive();
    });

    test("random student bodies never crash the API", async () => {
      const random =
        createRandom(97531);

      for (
        let index = 0;
        index < 50;
        index += 1
      ) {
        const body =
          generateRandomJsonValue(
            random
          );

        let operation =
          request(app)
            .post("/api/students")
            .set(
              "Content-Type",
              "application/json"
            );

        if (body !== null) {
          operation =
            operation.send(body);
        }

        const response =
          await operation;

        expectControlledResponse(
          response
        );

        expect(
          response.statusCode
        ).toBeLessThan(500);
      }

      await expectServerAlive();
    });
  });

  describe("random unknown routes", () => {
    test("random GET routes consistently return 404", async () => {
      const routes =
        generateUnknownRoutes(
          11111,
          50
        );

      for (const route of routes) {
        const response =
          await request(app).get(
            route
          );

        expect(
          response.statusCode
        ).toBe(404);

        expectControlledResponse(
          response
        );
      }

      await expectServerAlive();
    });

    test("random HTTP methods on unknown routes do not crash", async () => {
      const routes =
        generateUnknownRoutes(
          22222,
          40
        );

      const methods = [
        "get",
        "post",
        "put",
        "patch",
        "delete",
      ];

      for (
        let index = 0;
        index < routes.length;
        index += 1
      ) {
        const method =
          methods[
            index %
              methods.length
          ];

        const response =
          await request(app)[method](
            routes[index]
          ).send({
            fuzz:
              index,
          });

        expect(
          response.statusCode
        ).toBe(404);

        expectControlledResponse(
          response
        );
      }

      await expectServerAlive();
    });
  });

  describe("mixed fuzz sequence", () => {
    test("server remains alive after many different malformed requests", async () => {
      const ids =
        generateMalformedIds(
          54321,
          25
        );

      const routes =
        generateUnknownRoutes(
          98765,
          25
        );

      for (
        let index = 0;
        index < 25;
        index += 1
      ) {
        const id = ids[index];

        const reportResponse =
          await request(app).get(
            `/api/reports/${encodeURIComponent(
              id
            )}`
          );

        expectControlledResponse(
          reportResponse
        );

        const routeResponse =
          await request(app).get(
            routes[index]
          );

        expectControlledResponse(
          routeResponse
        );

        const jsonResponse =
          await request(app)
            .patch(
              "/api/reports/507f1f77bcf86cd799439011/review"
            )
            .set(
              "Content-Type",
              "application/json"
            )
            .send(
              index % 2 === 0
                ? '{"bad":'
                : '{"bad":true,}'
            );

        expectControlledResponse(
          jsonResponse
        );
      }

      await expectServerAlive();
    });
  });
});