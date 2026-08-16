import {
  describe,
  test,
  expect,
  vi,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";
import ErrorDashboard from "../src/pages/ErrorDashboard";

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/error-dashboard/DAS-001",
      ]}
    >
      <Routes>
        <Route
          path="/error-dashboard/:id"
          element={<ErrorDashboard />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function mockFetchImplementation(
  implementation
) {
  const fetchMock = vi
    .fn()
    .mockImplementation(async (input) => {
      const result = await implementation(input);
      const payload = await result.json();
      const url = String(input);

      if (url.endsWith("/overview")) {
        return {
          ok: result.ok,
          status: result.status,
          json: async () => ({
            student: payload.student,
            currentBandLevel: "B4",
            latestNewBand: "B5",
            lastAssessmentDate: "2026-08-01T00:00:00.000Z",
          }),
        };
      }

      if (url.includes("/reports")) {
        return {
          ok: result.ok,
          status: result.status,
          json: async () => ({
            data: (payload.reports || []).map((report) => ({
              reviewStatus: "finalised",
              writingSample: {
                originalName: "Narrative writing.pdf",
                mimeType: "application/pdf",
                fileSize: 1024,
                status: "analysed",
              },
              ...report,
            })),
          }),
        };
      }

      return {
        ok: result.ok,
        status: result.status,
        json: async () => ({
          data: payload.student ? [payload.student] : [],
        }),
      };
    });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

describe("Error Dashboard", () => {
  test("renders student information returned by API", async () => {
    mockFetchImplementation(
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          student: {
            studentId: "DAS-001",
            name: "Test Student",
          },
          reports: [],
        }),
      })
    );

    renderPage();

    expect(
      await screen.findByText(
        /DAS-001|Test Student/i
      )
    ).toBeInTheDocument();
  });

  test("renders report history returned by API", async () => {
    mockFetchImplementation(
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          student: {
            studentId: "DAS-001",
            name: "Test Student",
          },
          reports: [
            {
              _id: "report-1",
              createdAt:
                "2026-08-01T00:00:00.000Z",
              errorCounts: {
                total: 3,
              },
            },
          ],
        }),
      })
    );

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Assignment History",
      })
    ).toBeInTheDocument();

    expect(
      document.body.textContent
    ).toMatch(/3|report/i);
  });

  test("handles no report history", async () => {
    mockFetchImplementation(
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          student: {
            studentId: "DAS-001",
          },
          reports: [],
        }),
      })
    );

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Upload Assignment",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Assignment History" })
    ).not.toBeInTheDocument();
  });

  test("handles backend failure without rendering false success data", async () => {
    mockFetchImplementation(
      async () => ({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error:
            "Unable to retrieve student",
        }),
      })
    );

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Upload Assignment",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Assignment History" })
    ).not.toBeInTheDocument();
  });

  test("does not crash when API request rejects completely", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mockFetchImplementation(
      async () => {
        throw new Error(
          "Network unavailable"
        );
      }
    );

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Upload Assignment",
      })
    ).toBeInTheDocument();
  });
});
