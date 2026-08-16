import {
  describe,
  test,
  expect,
  vi,
} from "vitest";

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

vi.mock("react-chartjs-2", () => ({
  Bar: () => <div role="img" aria-label="bar chart" />,
  Line: () => <div role="img" aria-label="line chart" />,
  Radar: () => <div role="img" aria-label="radar chart" />,
}));

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/student/DAS-001?view=dashboard",
      ]}
    >
      <Routes>
        <Route
          path="/student/:id"
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
    .mockImplementation(async (input) => {
      const url = String(input);

      if (url.endsWith("/overview")) {
        if (!ok) {
          return {
            ok,
            status,
            json: async () => ({
              message: data.error || "Unable to load progress",
            }),
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            student: data.student,
            currentBandLevel: data.currentBandLevel,
            latestNewBand: data.latestAssessment?.newBand,
            hasAssessments: data.assessmentHistory?.length > 0,
          }),
        };
      }

      if (url.endsWith("/dashboard-summary")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ summary: "Improving steadily" }),
        };
      }

      return {
        ok,
        status,
        json: async () => data,
      };
    });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

const dashboard = {
  status: "ok",
  student: {
    studentId: "DAS-001",
    name: "Test Student",
  },
  currentBandLevel: "B5",
  latestAssessment: {
    semester: "A2",
    newBand: "B5",
    weightedScore: 78,
    skillScores: {
      phonics: 80,
      spelling: 75,
      comprehension: 79,
    },
  },
  bandScore: {
    totalScore: 78,
    passed: false,
    componentResults: [],
  },
  progressOverTime: [
    { semester: "A1", weightedScore: 65 },
    { semester: "A2", weightedScore: 78 },
  ],
  componentTrend: [],
  assessmentHistory: [
    {
      assessmentDate: "2026-01-01T00:00:00.000Z",
      semester: "A1",
      summaryBand: "B4",
      newBand: "B4",
      weightedScore: 65,
      assessedBy: "Teacher 1",
    },
    {
      assessmentDate: "2026-06-01T00:00:00.000Z",
      semester: "A2",
      summaryBand: "B4",
      newBand: "B5",
      weightedScore: 78,
      assessedBy: "Teacher 1",
    },
  ],
  skillBreakdown: {
    strongest: "phonics",
    weakest: "spelling",
  },
};

describe("Student Progress", () => {
  test("renders student progress data", async () => {
    mockFetch(dashboard);

    renderPage();

    await screen.findByRole("heading", {
      name: "Assessment History",
    });

    expect(
      screen.getByRole("heading", { name: "DAS-001" })
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
      status: "assessment_pending",
      student: {
        studentId: "DAS-001",
        name: "New Student",
      },
      assessmentHistory: [],
    });

    renderPage();

    await screen.findByText(
      /No assessments have been recorded/i
    );

    expect(
      screen.getByRole("heading", { name: "DAS-001" })
    ).toBeInTheDocument();

    expect(
      document.body
    ).toBeInTheDocument();
  });

  test("does not render NaN when scores are missing", async () => {
    mockFetch({
      status: "ok",
      student: {
        studentId: "DAS-001",
      },
      currentBandLevel: "B4",
      latestAssessment: {
        semester: "A1",
        weightedScore: null,
        skillScores: {},
      },
      progressOverTime: [{ semester: "A1", weightedScore: null }],
      componentTrend: [],
      assessmentHistory: [{
        semester: "A1",
        weightedScore: null,
      }],
      skillBreakdown: {},
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

    expect(await screen.findByText("Unable to load progress")).toBeInTheDocument();
  });

  test("handles network rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new Error("Network failure")
      )
    );

    renderPage();

    expect(await screen.findByText("Network failure")).toBeInTheDocument();
  });
});
