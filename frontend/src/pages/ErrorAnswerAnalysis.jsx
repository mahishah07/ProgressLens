import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import "../css/StudentError.css";
import "../css/ErrorAnswerAnalysis.css";

import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Search,
  FileBarChart2,
  KeyRound,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";


/* =========================================================
   ERROR COLORS
   SAME AS STUDENT ERROR PAGE
   ========================================================= */

const errorColors = {
  visual: "#ef4444",
  phonological: "#a855f7",
  grammar: "#22c55e",
  tense: "#d94f70",
  capitalisation: "#2f80ed",
};


/* =========================================================
   DONUT CHART
   COPIED FROM STUDENTERROR
   ========================================================= */

function DonutChart({ data }) {
  const total = data.reduce(
    (a, b) => a + b.count,
    0
  );

  const [hoveredItem, setHoveredItem] =
    useState(null);

  const r = 60;
  const cx = 80;
  const cy = 80;
  const stroke = 24;

  const circ =
    2 * Math.PI * r;

  const circles = data.reduce(
    (acc, d, i) => {
      if (!d.count || total === 0) {
        return acc;
      }

      const dash =
        (d.count / total) * circ;

      const gap =
        circ - dash;

      const circle = (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={d.color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={-acc.offset}
          onMouseEnter={() =>
            setHoveredItem(d)
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "80px 80px",
            cursor: "pointer",
            opacity:
              hoveredItem &&
              hoveredItem.key !== d.key
                ? 0.4
                : 1,
            transition:
              "opacity 160ms ease",
          }}
        >
          <title>
            {`${d.label}: ${d.count}`}
          </title>
        </circle>
      );

      return {
        offset:
          acc.offset + dash,

        elements: [
          ...acc.elements,
          circle,
        ],
      };
    },
    {
      offset: 0,
      elements: [],
    }
  ).elements;

  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
    >
      {circles}

      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
      >
        {hoveredItem?.count ??
          total}
      </text>

      <text
        x={cx}
        y={cy + 17}
        textAnchor="middle"
        fontSize="8"
        fill="#667085"
      >
        {hoveredItem?.label ||
          "Total errors"}
      </text>
    </svg>
  );
}


/* =========================================================
   BAR CHART
   ========================================================= */

function ErrorBarChart({ data }) {
  const maximum = Math.max(
    1,
    ...data.map(
      (item) => item.count
    )
  );

  return (
    <div className="sea-bar-chart">
      {data.map((item) => (
        <div
          className="sea-bar-row"
          key={item.key}
        >
          <div className="sea-bar-label">
            <span>
              {item.label}
            </span>

            <strong>
              {item.count}
            </strong>
          </div>

          <div className="sea-bar-track">
            <div
              className="sea-bar-fill"
              style={{
                width: `${
                  (item.count /
                    maximum) *
                  100
                }%`,
                background:
                  item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function ErrorAnswerAnalysis() {
  const { reportId } =
    useParams();

  const navigate =
    useNavigate();

  const API =
    import.meta.env.VITE_ERROR_API;

  const PMS_API =
    import.meta.env.VITE_PMS_API;

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [studentSearch, setStudentSearch] =
    useState("");

  const [
    studentSearching,
    setStudentSearching,
  ] = useState(false);

  const [chartView, setChartView] =
    useState("donut");


  /* =====================================================
     SEARCH STUDENT
     SAME BEHAVIOUR AS EXISTING PAGE
     ===================================================== */

  const openStudentDashboard =
    async (event) => {
      event.preventDefault();

      const query =
        studentSearch.trim();

      if (!query) return;

      setStudentSearching(true);

      try {
        const response =
          await fetch(
            `${API}/api/students?q=${encodeURIComponent(
              query
            )}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to search for students."
          );
        }

        let profiles =
          data?.students ||
          data?.data ||
          [];

        if (
          profiles.length === 0 &&
          PMS_API
        ) {
          const pmsResponse =
            await fetch(
              `${PMS_API}/api/progress/search?studentId=${encodeURIComponent(
                query
              )}`
            );

          const pmsData =
            await pmsResponse.json();

          if (!pmsResponse.ok) {
            throw new Error(
              pmsData.message ||
                "Unable to search student directory."
            );
          }

          profiles =
            Array.isArray(pmsData)
              ? pmsData
              : [];
        }

        const normalised =
          query.toLowerCase();

        const profile =
          profiles.find(
            (item) => {
              const fullName = [
                item.firstName,
                item.lastName,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return (
                item.studentId?.toLowerCase() ===
                  normalised ||
                item.name?.toLowerCase() ===
                  normalised ||
                fullName ===
                  normalised
              );
            }
          ) || profiles[0];

        if (!profile?.studentId) {
          alert(
            `No student found for “${query}”.`
          );

          return;
        }

        navigate(
          `/error-options/${encodeURIComponent(
            profile.studentId
          )}`
        );

      } catch (error) {
        alert(error.message);
      } finally {
        setStudentSearching(false);
      }
    };


  /* =====================================================
     LOAD REPORT
     ===================================================== */

  useEffect(() => {
    const loadReport =
      async () => {
        try {
          setLoading(true);
          setError(null);

          const response =
            await fetch(
              `${API}/api/reports/${reportId}`
            );

          const json =
            await response.json();

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
                "Report not found."
            );
          }

          setReport(json.data);

        } catch (error) {
          console.error(
            "Unable to load answer analysis:",
            error
          );

          setError(
            error.message
          );

          setReport(null);
        } finally {
          setLoading(false);
        }
      };

    loadReport();

  }, [API, reportId]);


  /* =====================================================
     LOADING / ERROR
     ===================================================== */

  if (loading) {
    return (
      <h2>
        Loading analysis...
      </h2>
    );
  }

  if (error || !report) {
    return (
      <h2>
        {error ||
          "Report not found."}
      </h2>
    );
  }


  /* =====================================================
     REPORT VALUES
     ===================================================== */

  const donutData =
    report.chartData ?? [];

  const studentText =
    report.writingSample
      ?.cleanedText ||
    report.writingSample
      ?.handwrittenText ||
    report.writingSample
      ?.ocrText ||
    "";

  const answerKey =
    report.answerKey;

  const expectedText =
    answerKey?.expectedText ||
    report.expectedText ||
    report.writingSample
      ?.expectedText ||
    "";

  const expectedAnswers =
    Array.isArray(
      answerKey?.answers
    )
      ? answerKey.answers
      : [];

  const studentName =
    [
      report.student?.firstName,
      report.student?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    report.student?.name ||
    report.student?.studentId ||
    "Student";


  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <div className="sea-page">

      {/* ================================================
          SIDEBAR
          ================================================ */}

      <aside className="sidebar">

        <div className="logo-section">

          <div className="logo-circle">
            DAS
          </div>

          <div>
            <h2>DAS Teacher</h2>

            <p>
              Educational Professional
            </p>
          </div>

        </div>


        <nav>

          <Link to="/">
            <LayoutDashboard
              size={20}
            />

            <span>
              Dashboard
            </span>
          </Link>


          <a href="#">
            <TrendingUp size={20} />

            <span>
              Progress Monitoring
            </span>
          </a>


          <a className="active">
            <BarChart3 size={20} />

            <span>
              Error Pattern Analysis
            </span>
          </a>


          <a href="#">
            <FileText size={20} />

            <span>
              Reports
            </span>
          </a>


          <a href="#">
            <Bell size={20} />

            <span>
              Notifications
            </span>
          </a>


          <a href="#">
            <Settings size={20} />

            <span>
              Settings
            </span>
          </a>

        </nav>

      </aside>


      {/* ================================================
          MAIN
          ================================================ */}

      <main className="sea-main">

        {/* TOPBAR */}

        <header className="sea-topbar">

          <h2>
            DAS Assessment Portal
          </h2>


          <form
            className="sea-topbar-search"
            onSubmit={
              openStudentDashboard
            }
          >

            <button
              type="submit"
              aria-label="Search student"
              disabled={
                studentSearching
              }
            >
              <Search size={16} />
            </button>

            <input
              type="text"
              placeholder={
                studentSearching
                  ? "Searching..."
                  : "Search student by name or ID..."
              }
              value={studentSearch}
              onChange={(event) =>
                setStudentSearch(
                  event.target.value
                )
              }
              disabled={
                studentSearching
              }
            />

          </form>


          <div className="sea-topbar-avatar">
            MF
          </div>

        </header>


        {/* ================================================
            CONTENT
            ================================================ */}

        <div className="sea-content">

          {/* STUDENT HEADER */}

          <div className="sea-student-header">

            <div className="sea-student-avatar">
              ST
            </div>


            <div className="sea-student-info">

              <h1>
                {studentName}
              </h1>

              <p>
                {
                  report.student
                    ?.studentId
                }
              </p>

            </div>


            <div className="sea-student-actions">

              <button
                className="sea-btn-primary"
                onClick={() =>
                  navigate(
                    `/answer-report/${reportId}`
                  )
                }
              >
                <FileBarChart2 size={16} />
                Generate Report
              </button>
            </div>
          </div>

          {/* ================================================
              ANSWER KEY STATUS
              ================================================ */}

          <div className="eaa-key-banner">

            <div className="eaa-key-banner-icon">
              <KeyRound size={22} />
            </div>

            <div className="eaa-key-banner-text">

              <span className="eaa-key-label">
                ANSWER KEY ANALYSIS
              </span>

              <h3>
                {answerKey?.title ||
                  "Uploaded Answer Key"}
              </h3>

              <p>
                This submission has been
                analysed against the uploaded
                reference answer.
              </p>

            </div>


            <span className="eaa-key-connected">

              <CheckCircle2
                size={15}
              />

              Answer key linked

            </span>

          </div>


          {/* ================================================
              STUDENT VS ANSWER KEY
              ================================================ */}

          <div className="eaa-comparison-grid">

            {/* STUDENT */}

            <div className="sea-card eaa-comparison-card">

              <div className="sea-card-header">

                <div className="eaa-card-title">

                  <FileText
                    size={18}
                  />

                  <h3>
                    Student Submission
                  </h3>

                </div>


                <span className="sea-date">

                  Dated:{" "}
                  {new Date(
                    report.createdAt
                  ).toLocaleDateString()}

                </span>

              </div>


              <div className="sea-text-block eaa-student-text">

                <p>
                  {studentText ||
                    "No readable student text available."}
                </p>

              </div>

            </div>


            {/* ANSWER KEY */}

            <div className="sea-card eaa-comparison-card eaa-answer-card">

              <div className="sea-card-header">

                <div className="eaa-card-title">

                  <FileCheck2
                    size={18}
                  />

                  <h3>
                    Answer Key
                  </h3>

                </div>


                {answerKey?.originalName && (
                  <span className="eaa-file-name">
                    {
                      answerKey.originalName
                    }
                  </span>
                )}

              </div>


              <div className="sea-text-block eaa-answer-text">

                <p>
                  {expectedText ||
                    "No expected answer text available."}
                </p>

              </div>

            </div>

          </div>


          {/* ================================================
              EXPECTED ANSWERS
              ================================================ */}

          {expectedAnswers.length > 0 && (

            <div className="sea-card eaa-answers-section">

              <div className="eaa-section-header">

                <div>

                  <span className="eaa-eyebrow">
                    REFERENCE RESPONSES
                  </span>

                  <h3>
                    Expected Answers
                  </h3>

                  <p>
                    Extracted from the uploaded
                    answer key.
                  </p>

                </div>


                <span className="eaa-answer-count">

                  {
                    expectedAnswers.length
                  }{" "}

                  {expectedAnswers.length ===
                  1
                    ? "answer"
                    : "answers"}

                </span>

              </div>


              <div className="eaa-answer-list">

                {expectedAnswers.map(
                  (
                    answer,
                    index
                  ) => (

                    <div
                      className="eaa-answer-item"
                      key={index}
                    >

                      <div className="eaa-answer-number">
                        {index + 1}
                      </div>


                      <div className="eaa-answer-content">

                        <span>
                          Expected Answer
                        </span>

                        <p>
                          {answer}
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          )}


          {/* ================================================
              ERROR CHART
              SAME AS STUDENTERROR
              ================================================ */}

          <div className="sea-grid">

            <div className="sea-card sea-writing">

              <div className="sea-card-header">

                <h3>
                  ≡ Analysed Writing Sample
                </h3>

                <span className="sea-date">

                  Dated:{" "}
                  {new Date(
                    report.createdAt
                  ).toLocaleDateString()}

                </span>

              </div>


              <div className="sea-text-block">

                <p>
                  {studentText}
                </p>

              </div>


              <div className="sea-legend">

                {Object.entries(
                  errorColors
                ).map(
                  ([
                    type,
                    color,
                  ]) => (

                    <span
                      key={type}
                      className="sea-legend-item"
                    >

                      <span
                        className="sea-legend-dot"
                        style={{
                          background:
                            color,
                        }}
                      />

                      {type
                        .charAt(0)
                        .toUpperCase() +
                        type.slice(1)}{" "}
                      Errors

                    </span>

                  )
                )}

              </div>

            </div>


            {/* ERROR CHART */}

            <div className="sea-card sea-donut">

              <div className="sea-chart-header">

                <h3>
                  Error Type Classification
                </h3>


                <div
                  className="sea-chart-toggle"
                  aria-label="Chart view"
                >

                  <button
                    className={
                      chartView ===
                      "donut"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setChartView(
                        "donut"
                      )
                    }
                    type="button"
                  >
                    ◉ Donut
                  </button>


                  <button
                    className={
                      chartView ===
                      "bar"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setChartView(
                        "bar"
                      )
                    }
                    type="button"
                  >
                    ▥ Bar
                  </button>

                </div>

              </div>


              {chartView ===
              "donut" ? (

                <div className="sea-donut-chart">

                  <DonutChart
                    data={
                      donutData
                    }
                  />

                </div>

              ) : (

                <ErrorBarChart
                  data={donutData}
                />

              )}


              <div className="sea-donut-legend">

                {donutData.map(
                  (d, i) => (

                    <div
                      key={i}
                      className="sea-donut-item"
                    >

                      <span
                        className="sea-donut-dot"
                        style={{
                          background:
                            d.color,
                        }}
                      />

                      <span>
                        {d.label}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>


          {/* ================================================
              AI PATTERN ANALYSIS
              SAME AS STUDENTERROR
              ================================================ */}

          {report.interventionRecommendation && (

            <div className="sea-ai-card">

              <h3>
                ✦ AI Pattern Analysis
              </h3>


              <p>
                {
                  report
                    .interventionRecommendation
                    .overview
                }
              </p>


              <div className="sea-interventions">

                <p className="sea-interventions-label">
                  SUGGESTED INTERVENTIONS
                </p>


                {report.interventionRecommendation
                  ?.interventions
                  ?.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={
                          index
                        }
                      >

                        <p>
                          <strong>
                            {
                              item.title
                            }
                          </strong>
                        </p>

                        <p>
                          {
                            item.rationale
                          }
                        </p>

                        <p>
                          Activities:{" "}
                          {item.activities?.join(
                            ", "
                          )}
                        </p>

                        <p>
                          Frequency:{" "}
                          {
                            item.frequency
                          }
                        </p>

                      </div>

                    )
                  )}

              </div>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}