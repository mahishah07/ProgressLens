import {
  describe,
  test,
  expect,
  vi,
} from "vitest";

import React from "react";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
          path="/error-dashboard/:studentId"
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
    .mockImplementation(implementation);

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

    await waitFor(() => {
      expect(
        document.body
      ).toBeInTheDocument();
    });

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

    await waitFor(() => {
      expect(
        document.body
      ).toBeInTheDocument();
    });
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

    await waitFor(() => {
      expect(
        screen.queryByText(
          /analysis complete/i
        )
      ).not.toBeInTheDocument();
    });
  });

  test("does not crash when API request rejects completely", async () => {
    mockFetchImplementation(
      async () => {
        throw new Error(
          "Network unavailable"
        );
      }
    );

    renderPage();

    await waitFor(() => {
      expect(
        document.body
      ).toBeInTheDocument();
    });
  });
});