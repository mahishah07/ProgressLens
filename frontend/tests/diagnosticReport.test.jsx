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
import DiagnosticReport from "../src/pages/DiagnosticReport";

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/diagnostic-report/report-1",
      ]}
    >
      <Routes>
        <Route
          path="/diagnostic-report/:reportId"
          element={<DiagnosticReport />}
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

const analysedReport = {
  success: true,
  data: {
    _id: "report-1",
    student: {
      studentId: "DAS-001",
      name: "Test Student",
    },
    expectedText:
      "The dog went home at night.",
    errors: [
      {
        _id: "error-1",
        type: "LETTER_REVERSAL",
        category: "Letter reversal",
        actual: "bog",
        expectedCorrection: "dog",
      },
      {
        _id: "error-2",
        type: "PHONETIC_ERROR",
        category: "Phonetic",
        actual: "nite",
        expectedCorrection: "night",
      },
    ],
    errorCounts: {
      spelling: 0,
      phonetic: 1,
      insertion: 0,
      deletion: 0,
      letterReversal: 1,
      tense: 0,
      capitalisation: 0,
      grammar: 0,
      total: 2,
    },
    interventionRecommendation: {
      status: "completed",
      overview:
        "Practise sound and letter mapping.",
      dominantPattern:
        "Mixed transcription errors",
      interventions: [
        {
          title: "Word mapping",
          rationale:
            "Builds spelling accuracy.",
          activities: [
            "Map sounds to letters",
          ],
          frequency:
            "Three times per week",
        },
      ],
      educatorCaution:
        "Review before use.",
    },
  },
};

describe("Diagnostic Report", () => {
  test("renders corrected error information", async () => {
    mockFetch(analysedReport);

    renderPage();

    expect(
      await screen.findByText(/bog/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/dog/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/nite/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/night/i)
    ).toBeInTheDocument();
  });

  test("renders AI intervention recommendation", async () => {
    mockFetch(analysedReport);

    renderPage();

    expect(
      await screen.findByText(
        /Practise sound and letter mapping/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Word mapping/i)
    ).toBeInTheDocument();
  });

  test("shows recommendation caution", async () => {
    mockFetch(analysedReport);

    renderPage();

    expect(
      await screen.findByText(
        /Review before use/i
      )
    ).toBeInTheDocument();
  });

  test("handles missing recommendation safely", async () => {
    mockFetch({
      success: true,
      data: {
        ...analysedReport.data,
        interventionRecommendation:
          null,
      },
    });

    renderPage();

    await waitFor(() => {
      expect(
        document.body
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText(
        /Practise sound and letter mapping/i
      )
    ).not.toBeInTheDocument();
  });

  test("handles zero errors safely", async () => {
    mockFetch({
      success: true,
      data: {
        ...analysedReport.data,
        errors: [],
        errorCounts: {
          spelling: 0,
          phonetic: 0,
          insertion: 0,
          deletion: 0,
          letterReversal: 0,
          tense: 0,
          capitalisation: 0,
          grammar: 0,
          total: 0,
        },
      },
    });

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

  test("handles report API failure without false success state", async () => {
    mockFetch(
      {
        success: false,
        error:
          "Unable to load diagnostic report",
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
      screen.queryByText(
        /Practise sound and letter mapping/i
      )
    ).not.toBeInTheDocument();
  });
});