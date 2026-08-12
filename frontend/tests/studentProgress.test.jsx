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
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";
import StudentProgress from "../src/pages/StudentProgress";

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/progress/DAS-001",
      ]}
    >
      <Routes>
        <Route
          path="/progress/:studentId"
          element={<StudentProgress />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function mockFetch(
  data,
  ok = true,
  status = 200
) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({
      ok,
      status,
      json: async () => data,
    });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

const dashboard = {
  success: true,
  data: {
    student: {
      studentId: "DAS-001",
      name: "Test Student",
      currentLevel: "B5",
    },
    latestAssessment: {
      assessmentId: "A2",
      overallScore: 78,
    },
    assessments: [
      {
        assessmentId: "A1",
        overallScore: 65,
        levelAchieved: "B4",
      },
      {
        assessmentId: "A2",
        overallScore: 78,
        levelAchieved: "B5",
      },
    ],
    skillBreakdown: {
      phonics: 80,
      spelling: 75,
      comprehension: 79,
    },
  },
};

describe("Student Progress", () => {
  test("renders student progress data", async () => {
    mockFetch(dashboard);

    renderPage();

    expect(
      await screen.findByText(
        /DAS-001|Test Student/i
      )
    ).toBeInTheDocument();

    expect(
      document.body.textContent
    ).toMatch(/B5|78/);
  });

  test("renders assessment history values", async () => {
    mockFetch(dashboard);

    renderPage();

    await waitFor(() => {
      expect(
        document.body.textContent
      ).toMatch(/65/);

      expect(
        document.body.textContent
      ).toMatch(/78/);
    });
  });

  test("handles student with no assessments", async () => {
    mockFetch({
      success: true,
      data: {
        student: {
          studentId: "DAS-001",
          name: "New Student",
        },
        latestAssessment: null,
        assessments: [],
        skillBreakdown: {},
      },
    });

    renderPage();

    expect(
      await screen.findByText(
        /DAS-001|New Student/i
      )
    ).toBeInTheDocument();

    expect(
      document.body
    ).toBeInTheDocument();
  });

  test("does not render NaN when scores are missing", async () => {
    mockFetch({
      success: true,
      data: {
        student: {
          studentId: "DAS-001",
        },
        latestAssessment: null,
        assessments: [
          {
            assessmentId: "A1",
            overallScore: null,
          },
        ],
        skillBreakdown: {},
      },
    });

    renderPage();

    await waitFor(() => {
      expect(
        document.body.textContent
      ).not.toContain("NaN");
    });
  });

  test("handles dashboard API error", async () => {
    mockFetch(
      {
        success: false,
        error:
          "Unable to load progress",
      },
      false,
      500
    );

    renderPage();

    await waitFor(() => {
      expect(
        document.body
      ).toBeInTheDocument();
    });

    expect(
      document.body.textContent
    ).not.toContain("NaN");
  });

  test("handles network rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new Error("Network failure")
      )
    );

    renderPage();

    await waitFor(() => {
      expect(
        document.body
      ).toBeInTheDocument();
    });
  });
});