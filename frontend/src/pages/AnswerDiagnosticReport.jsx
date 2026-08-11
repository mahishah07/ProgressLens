import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import "../css/DiagnosticReport.css";
import "../css/AnswerDiagnosticReport.css";

import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Printer,
  Download,
  Share2,
  User,
  Sparkles,
  KeyRound,
  FileCheck2,
  CheckCircle2,
  GitCompareArrows,
} from "lucide-react";


const ERROR_API = import.meta.env.VITE_ERROR_API;
const PMS_API = import.meta.env.VITE_PMS_API;


/* =========================================================
   DATE FORMATTER
   SAME AS DIAGNOSTIC REPORT
   ========================================================= */

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function AnswerDiagnosticReport() {
  const { reportId } = useParams();

  const [report, setReport] = useState(null);
  const [student, setStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /* =====================================================
     LOAD REPORT + PMS STUDENT DATA
     ===================================================== */

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        if (!ERROR_API) {
          throw new Error(
            "Error Analyser API is not configured."
          );
        }

        // ================================================
        // 1. GET ERROR ANALYSIS REPORT
        // ================================================

        const reportResponse = await fetch(
          `${ERROR_API}/api/reports/${reportId}`
        );

        const reportJson = await reportResponse.json();

        if (
          !reportResponse.ok ||
          !reportJson.success
        ) {
          throw new Error(
            reportJson.error ||
              "Unable to load diagnostic report."
          );
        }

        const reportData = reportJson.data;

        setReport(reportData);


        // ================================================
        // 2. GET STUDENT ID FROM POPULATED REPORT
        // ================================================

        const studentId =
          reportData?.student?.studentId;

        if (!studentId) {
          throw new Error(
            "Student ID is missing from this diagnostic report."
          );
        }


        // ================================================
        // 3. GET FULL PMS STUDENT PROFILE
        // ================================================

        if (!PMS_API) {
          throw new Error(
            "PMS API is not configured."
          );
        }

        const studentResponse = await fetch(
          `${PMS_API}/api/students/${encodeURIComponent(
            studentId
          )}`
        );

        if (!studentResponse.ok) {
          const studentJson =
            await studentResponse
              .json()
              .catch(() => ({}));

          throw new Error(
            studentJson.message ||
              "Unable to load student profile."
          );
        }

        const studentData =
          await studentResponse.json();

        setStudent(studentData);

      } catch (err) {
        console.error(
          "Failed to load answer diagnostic report:",
          err
        );

        setError(
          err.message ||
            "Unable to load diagnostic report."
        );

      } finally {
        setLoading(false);
      }
    }


    if (reportId) {
      loadReport();
    }

  }, [reportId]);


  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div className="dr-loading">

        <div className="dr-loading-card">

          <div className="dr-loading-spinner" />

          <h2>
            Loading Diagnostic Report
          </h2>

          <p>
            Retrieving the student's assessment,
            answer key and analysis...
          </p>

        </div>

      </div>
    );
  }


  /* =====================================================
     ERROR
     ===================================================== */

  if (
    error ||
    !report ||
    !student
  ) {
    return (
      <div className="dr-loading">

        <div className="dr-loading-card">

          <h2>
            Unable to Load Report
          </h2>

          <p>
            {error ||
              "Diagnostic report could not be found."}
          </p>

          <Link
            to="/"
            className="dr-back-link"
          >
            Return to Dashboard
          </Link>

        </div>

      </div>
    );
  }


  /* =====================================================
     REPORT VALUES
     ===================================================== */

  const writingSample =
    report.writingSample || {};

  const answerKey =
    report.answerKey || {};

  const recommendation =
    report.interventionRecommendation || {};

  const chartData =
    report.chartData || [];

  const errors =
    report.errors || [];


  const totalErrors =
    report.errorCounts?.total ??
    report.summary?.errorCount ??
    errors.length;


  const assessmentDate =
    report.analysedAt ||
    report.createdAt ||
    writingSample.createdAt;


  const lastReview =
    report.updatedAt ||
    assessmentDate;


  /* =====================================================
     IMPORTANT:
     Use answerKey.expectedText for reference answer.

     Do NOT use report.expectedText as the answer key,
     because report.expectedText can contain analysis/
     corrected text later in the pipeline.
     ===================================================== */

  const studentText =
    writingSample.cleanedText ||
    writingSample.handwrittenText ||
    writingSample.ocrText ||
    "No student response text available.";


  const referenceText =
    answerKey.expectedText ||
    "No answer key text available.";


  const expectedAnswers =
    Array.isArray(answerKey.answers)
      ? answerKey.answers
      : [];


  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <div className="dr-page">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="dr-sidebar">

        <div className="dr-logo-section">

          <div className="dr-logo-circle">
            DAS
          </div>

          <div>
            <h2>DAS Teacher</h2>

            <p>
              Educational Professional
            </p>
          </div>

        </div>


        <nav className="dr-nav">

          <Link to="/">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>


          <a href="#">
            <TrendingUp size={20} />
            <span>Progress Monitoring</span>
          </a>


          <a href="#">
            <BarChart3 size={20} />
            <span>Error Pattern Analysis</span>
          </a>


          <a className="active">
            <FileText size={20} />
            <span>Reports</span>
          </a>


          <a href="#">
            <Bell size={20} />
            <span>Notifications</span>
          </a>


          <a href="#">
            <Settings size={20} />
            <span>Settings</span>
          </a>

        </nav>


        <div className="dr-sidebar-profile">

          <div className="dr-sidebar-avatar">
            MF
          </div>

          <div>
            <strong>Teacher</strong>

            <span>
              Educational Professional
            </span>
          </div>

        </div>

      </aside>


      {/* =================================================
          MAIN
          ================================================= */}

      <main className="dr-main">

        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="dr-topbar">

          <h2>
            DAS Assessment Portal
          </h2>


          <div className="dr-topbar-actions">

            <button
              className="dr-btn-primary"
              onClick={() =>
                window.print()
              }
            >
              <Printer size={15} />
              Print Report
            </button>


            <button
              className="dr-btn-secondary"
              onClick={() =>
                window.print()
              }
            >
              <Download size={15} />
              Download PDF
            </button>


            <span className="dr-updated">
              Last updated:{" "}
              {formatDate(lastReview)}
            </span>


            <button
              className="dr-icon-btn"
              title="Share report"
            >
              <Share2 size={16} />
            </button>

          </div>

        </header>


        {/* =================================================
            REPORT DOCUMENT
            ================================================= */}

        <div className="dr-doc-wrapper">

          <div className="dr-doc adr-doc">

            {/* =================================================
                REPORT HEADER
                ================================================= */}

            <div className="dr-doc-header">

              <div>

                <div className="adr-report-type">
                  <KeyRound size={14} />
                  ANSWER-KEY ASSESSMENT
                </div>

                <h1>
                  Edit & Diagram Diagnostic Report
                </h1>

                <p className="dr-org">
                  Dyslexia Association of Singapore (DAS)
                </p>

              </div>


              <div className="dr-report-meta">

                <p className="dr-meta-label">

                  REPORT ID:{" "}

                  <strong>
                    #
                    {String(report._id)
                      .slice(-8)
                      .toUpperCase()}
                  </strong>

                </p>


                <p className="dr-meta-label">

                  Assessment Date:{" "}

                  <strong>
                    {formatDate(
                      assessmentDate
                    )}
                  </strong>

                </p>

              </div>

            </div>


            <hr className="dr-divider" />


            {/* =================================================
                STUDENT PROFILE
                SAME AS EXISTING REPORT
                ================================================= */}

            <div className="dr-section-heading">

              <User size={18} />

              <h2 className="dr-section-title">
                Student Profile
              </h2>

            </div>


            <div className="dr-profile-grid">

              <div className="dr-profile-field">

                <p className="dr-field-label">
                  STUDENT ID
                </p>

                <p className="dr-field-value">
                  {student.studentId ||
                    report.student?.studentId ||
                    "—"}
                </p>

              </div>


              <div className="dr-profile-field">

                <p className="dr-field-label">
                  CENTRE
                </p>

                <p className="dr-field-value">
                  {student.centreId || "—"}
                </p>

              </div>


              <div className="dr-profile-field">

                <p className="dr-field-label">
                  LEVEL
                </p>

                <p className="dr-field-value">
                  {student.schLevel || "—"}
                </p>

              </div>


              <div className="dr-profile-field">

                <p className="dr-field-label">
                  BAND LEVEL
                </p>

                <p className="dr-field-value dr-band-value">
                  {student.summaryBand || "—"}
                </p>

              </div>


              <div className="dr-profile-field">

                <p className="dr-field-label">
                  ASSESSMENT DATE
                </p>

                <p className="dr-field-value">
                  {formatDate(
                    assessmentDate
                  )}
                </p>

              </div>

            </div>


            <hr className="dr-divider" />


            {/* =================================================
                RESPONSE COMPARISON
                NEW MAIN FEATURE
                ================================================= */}

            <div className="dr-section-heading">

              <GitCompareArrows size={18} />

              <h2 className="dr-section-title">
                Student Response vs Answer Key
              </h2>

            </div>


            <p className="adr-section-description">
              Comparison between the student's extracted
              submission and the expected response from the
              uploaded answer key.
            </p>


            <div className="adr-comparison-grid">

              {/* STUDENT RESPONSE */}

              <div className="adr-comparison-card adr-student-card">

                <div className="adr-comparison-header">

                  <div className="adr-header-title">

                    <FileText size={17} />

                    <strong>
                      Student Submission
                    </strong>

                  </div>


                  <span>
                    {writingSample.originalName ||
                      "Student response"}
                  </span>

                </div>


                <div className="adr-comparison-text">
                  {studentText}
                </div>

              </div>


              {/* ANSWER KEY */}

              <div className="adr-comparison-card adr-key-card">

                <div className="adr-comparison-header">

                  <div className="adr-header-title">

                    <KeyRound size={17} />

                    <strong>
                      Expected Answer
                    </strong>

                  </div>


                  <span>
                    {answerKey.originalName ||
                      "Answer key"}
                  </span>

                </div>


                <div className="adr-comparison-text adr-reference-text">
                  {referenceText}
                </div>

              </div>

            </div>


            {/* =================================================
                EXTRACTED EXPECTED ANSWERS
                ================================================= */}

            {expectedAnswers.length > 0 && (
              <div className="adr-extracted-section">

                <div className="adr-extracted-header">

                  <div>

                    <span className="adr-small-label">
                      ANSWER KEY BREAKDOWN
                    </span>

                    <h3>
                      Expected Responses
                    </h3>

                    <p>
                      Individual answers extracted from
                      the uploaded marking reference.
                    </p>

                  </div>


                  <span className="adr-answer-count">

                    {expectedAnswers.length}{" "}

                    {expectedAnswers.length === 1
                      ? "response"
                      : "responses"}

                  </span>

                </div>


                <div className="adr-answer-list">

                  {expectedAnswers.map(
                    (answer, index) => (
                      <div
                        className="adr-answer-item"
                        key={index}
                      >

                        <div className="adr-answer-number">
                          {index + 1}
                        </div>


                        <div>

                          <span>
                            EXPECTED RESPONSE
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


            <hr className="dr-divider" />


            {/* =================================================
                ERROR FREQUENCY ANALYSIS
                SAME LOGIC AS EXISTING REPORT
                ================================================= */}

            <div className="dr-section-heading">

              <BarChart3 size={18} />

              <h2 className="dr-section-title">
                Error Frequency Analysis
              </h2>

            </div>


            <div className="dr-error-grid">

              {/* ERROR BARS */}

              <div className="dr-error-bars">

                <div className="dr-bars-header">

                  <div>

                    <p className="dr-bars-title">
                      Error Type Distribution
                    </p>

                    <p className="dr-bars-subtitle">
                      Errors detected during analysis
                      against the supplied reference answer.
                    </p>

                  </div>


                  <div className="dr-total-errors">

                    <strong>
                      {totalErrors}
                    </strong>

                    <span>
                      Total Errors
                    </span>

                  </div>

                </div>


                {chartData.length > 0 ? (

                  chartData.map((item) => (

                    <div
                      key={item.key}
                      className="dr-bar-item"
                    >

                      <div className="dr-bar-label-row">

                        <span>
                          {item.label}
                        </span>

                        <span>

                          {item.count}{" "}

                          <small>
                            (
                            {Number(
                              item.percentage || 0
                            ).toFixed(1)}
                            %)
                          </small>

                        </span>

                      </div>


                      <div className="dr-bar-bg">

                        <div
                          className="dr-bar-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              Number(
                                item.percentage || 0
                              )
                            )}%`,

                            background:
                              item.color,
                          }}
                        />

                      </div>

                    </div>

                  ))

                ) : (

                  <p className="dr-empty">
                    No error frequency data is available
                    for this report.
                  </p>

                )}

              </div>


              {/* AI ANALYSIS */}

              <div className="dr-ai-recognition">

                <div className="dr-ai-icon">
                  <Sparkles size={22} />
                </div>


                <h3>
                  AI Pattern Analysis
                </h3>


                {recommendation.dominantPattern && (

                  <div className="dr-dominant-pattern">

                    <span>
                      Dominant Pattern
                    </span>

                    <strong>
                      {
                        recommendation.dominantPattern
                      }
                    </strong>

                  </div>

                )}


                <p>
                  {recommendation.overview ||
                    "No AI analysis is available for this report yet."}
                </p>

              </div>

            </div>


            <hr className="dr-divider" />


            {/* =================================================
                ANALYSIS OUTPUT

                Notice this is NOT called Answer Key.
                report.expectedText may now contain AI output.
                ================================================= */}

            <div className="dr-section-heading">

              <Sparkles size={18} />

              <h2 className="dr-section-title">
                Analysis Output
              </h2>

            </div>


            <div className="dr-samples-grid">

              <div className="dr-sample-card">

                <div className="dr-sample-header">

                  <strong>
                    Analysed Student Submission
                  </strong>

                  <span>
                    {formatDate(
                      writingSample.createdAt ||
                        assessmentDate
                    )}
                  </span>

                </div>


                <div className="dr-sample-text">
                  {studentText}
                </div>

              </div>


              <div className="dr-sample-card">

                <div className="dr-sample-header">

                  <strong>
                    AI-Corrected Transcription
                  </strong>

                  <span>
                    Analysis Output
                  </span>

                </div>


                <div className="dr-sample-text dr-corrected-text">

                  {report.expectedText ||
                    writingSample.expectedText ||
                    "No corrected transcription available."}

                </div>

              </div>

            </div>


            <hr className="dr-divider" />


            {/* =================================================
                TARGETED INTERVENTIONS
                SAME AS ORIGINAL
                ================================================= */}

            <div className="dr-interventions-card">

              <div className="dr-interventions-header">

                <div>

                  <h2 className="dr-interventions-title">
                    Targeted Interventions
                  </h2>

                  <p>
                    Recommendations generated from
                    the student's answer-key and
                    error pattern analysis.
                  </p>

                </div>

                <Sparkles size={22} />

              </div>


              {recommendation.interventions?.length >
              0 ? (

                recommendation.interventions.map(
                  (item, index) => (

                    <div
                      key={`${item.title}-${index}`}
                      className="dr-intervention-item"
                    >

                      <div className="dr-intervention-num">
                        {index + 1}
                      </div>


                      <div className="dr-intervention-content">

                        <p className="dr-intervention-title">
                          {item.title}
                        </p>


                        <p className="dr-intervention-desc">
                          {item.rationale}
                        </p>


                        {item.activities?.length > 0 && (

                          <div className="dr-activities">

                            <strong>
                              Activities:
                            </strong>

                            <ul>

                              {item.activities.map(
                                (
                                  activity,
                                  activityIndex
                                ) => (

                                  <li key={activityIndex}>
                                    {activity}
                                  </li>

                                )
                              )}

                            </ul>

                          </div>

                        )}


                        {item.frequency && (

                          <p className="dr-frequency">

                            <strong>
                              Frequency:
                            </strong>{" "}

                            {item.frequency}

                          </p>

                        )}

                      </div>

                    </div>

                  )
                )

              ) : (

                <p className="dr-empty">
                  No intervention recommendations
                  are available yet.
                </p>

              )}

            </div>


            <hr className="dr-divider" />


            {/* =================================================
                AI SUMMARY
                ================================================= */}

            <div className="dr-section-heading">

              <Sparkles size={18} />

              <h2 className="dr-section-title">
                AI Analysis Summary
              </h2>

            </div>


            <blockquote className="dr-summary">

              {recommendation.overview ||
                "No AI-generated summary is available for this report."}

            </blockquote>


            {recommendation.educatorCaution && (

              <div className="dr-educator-note">

                <strong>
                  Educator Note
                </strong>

                <p>
                  {
                    recommendation.educatorCaution
                  }
                </p>

              </div>

            )}


            <hr className="dr-divider" />


            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="dr-report-footer">

              <div>

                <p className="dr-footer-title">
                  Edit & Diagram Diagnostic Report
                </p>

                <p className="dr-sig-sub">
                  Generated from the DAS Assessment Engine
                </p>


                {recommendation.model && (

                  <p className="dr-sig-sub">
                    Analysis model:{" "}
                    {recommendation.model}
                  </p>

                )}

              </div>


              <div className="dr-footer-right">

                <p className="dr-sig-sub">

                  Report generated:{" "}

                  {formatDate(
                    report.createdAt
                  )}

                </p>


                <p className="dr-sig-sub">

                  Last analysis:{" "}

                  {formatDate(
                    report.openAiAnalysedAt ||
                      report.analysedAt
                  )}

                </p>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}