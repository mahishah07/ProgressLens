const { getAllowedOrigins, createCorsOptions } = require("../../config/cors");

describe("CORS configuration", () => {
  test("uses explicit comma-separated origins", () => {
    expect(getAllowedOrigins({ CORS_ORIGINS: "https://one.example, https://two.example" })).toEqual([
      "https://one.example",
      "https://two.example",
    ]);
  });

  test("fails closed when production origins are missing", () => {
    expect(() => getAllowedOrigins({ NODE_ENV: "production" })).toThrow("CORS_ORIGINS must be configured");
  });

  test("allows non-browser requests and rejects unlisted browser origins", () => {
    const options = createCorsOptions({ CORS_ORIGINS: "https://allowed.example" });
    expect(options.origin(undefined, jest.fn())).toBeUndefined();
    const callback = jest.fn();
    options.origin("https://blocked.example", callback);
    expect(callback.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
  });
});
