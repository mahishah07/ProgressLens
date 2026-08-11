import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./../css/ErrorOptions.css";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  Sheet,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const API = import.meta.env.VITE_PMS_API;
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

export default function ErrorOptions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // FETCH STUDENT OVERVIEW FROM BACKEND
  // ==========================================

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const loadOverview = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API}/api/progress/${encodeURIComponent(id)}/overview`,
          {
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok || data.message) {
          throw new Error(
            data.message || "Unable to load student information.",
          );
        }

        setOverview(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load student overview:", err);
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadOverview();

    return () => controller.abort();
  }, [id]);

  // ==========================================
  // HELPERS
  // ==========================================

  const getInitials = (studentId) => {
    if (!studentId) return "ST";

    const parts = studentId.trim().split(/\s+/);

    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return studentId.slice(0, 2).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "No assessment yet";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const studentId = overview?.student?.studentId;

  const currentBand =
    overview?.latestNewBand ||
    overview?.currentBandLevel ||
    "—";

  const teacher = overview?.student?.teacherId || "—";

  // ==========================================
  // NAVIGATION
  // ==========================================

  const openWithAnswerKey = () => {
    navigate(`/error-answer/${encodeURIComponent(id)}`);
  };

  const openWithoutAnswerKey = () => {
    navigate(`/error-dashboard/${encodeURIComponent(id)}`);
  };

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  if (loading) {
    return (
      <div className="eo-page">
        <main className="eo-main">
          <div className="eo-state-card">
            <div className="eo-loading-spinner" />

            <h3>Loading student profile</h3>

            <p>
              Retrieving the latest student information...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eo-page">
        <main className="eo-main">
          <div className="eo-state-card eo-error-state">
            <h3>Unable to load student</h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="eo-state-back"
            >
              <ArrowLeft size={17} />
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="eo-page">
      <main className="eo-main">

        {/* =====================================
            TOP BAR
        ====================================== */}

        <header className="eo-topbar">
          <h2>DAS Assessment Portal</h2>

          <span className="eo-topbar-sub">
            Student Progress
          </span>
        </header>

        {/* =====================================
            STUDENT PROFILE
        ====================================== */}

        <section className="eo-profile-card">

          <div className="eo-avatar-wrapper">
            <div className="eo-avatar">
              {getInitials(studentId)}
            </div>

            <div className="eo-verified-badge">
              <CheckCircle2 size={15} />
            </div>
          </div>

          <div className="eo-profile-info">
            <h1>{studentId}</h1>

            {SHEET_URL && (
              <a
                href={SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="eo-sheets-btn"
              >
                <Sheet size={17} />
                Open Google Sheets
              </a>
            )}
          </div>

          <div className="eo-profile-meta">

            <div className="eo-meta-item">
              <span className="eo-meta-label">
                Last Assessment
              </span>

              <span className="eo-meta-value eo-meta-blue">
                {formatDate(overview?.lastAssessmentDate)}
              </span>
            </div>

            <div className="eo-meta-item">
              <span className="eo-meta-label">
                Assigned Band
              </span>

              <span className="eo-meta-value eo-band">
                <Sparkles size={16} />
                {currentBand}
              </span>
            </div>

            <div className="eo-meta-item">
              <span className="eo-meta-label">
                Assigned Teacher
              </span>

              <span className="eo-meta-value">
                {teacher}
              </span>
            </div>

          </div>
        </section>

        {/* =====================================
            INTRO
        ====================================== */}

        <section className="eo-section-heading">
          <div>
            <span className="eo-eyebrow">
              ERROR PATTERN ANALYSIS
            </span>

            <h2>Select Assessment Type</h2>

            <p>
              Choose how the student's submission should be
              evaluated.
            </p>
          </div>
        </section>

        {/* =====================================
            OPTIONS
        ====================================== */}

        <section className="eo-options">

          {/* =================================
              WITH ANSWER KEY
          ================================== */}

          <article
            className="eo-option-card eo-option-blue"
            onClick={openWithAnswerKey}
          >
            <div className="eo-card-glow eo-blue-glow" />

            <div className="eo-background-icon">
              <KeyRound size={190} strokeWidth={1.2} />
            </div>

            <div className="eo-option-header">
              <div className="eo-option-icon">
                <FileCheck2 size={31} />
              </div>

              <span className="eo-card-type">
                STRUCTURED ASSESSMENT
              </span>
            </div>

            <div className="eo-option-content">
              <h3>With Answer Key</h3>

              <p>
                Upload a standardized answer key and student
                submission to automatically compare responses,
                identify incorrect answers, and analyse error
                patterns.
              </p>
            </div>

            <div className="eo-feature-list">
              <span>
                <CheckCircle2 size={15} />
                Compare against expected responses
              </span>

              <span>
                <CheckCircle2 size={15} />
                Detect incorrect or missing answers
              </span>

              <span>
                <CheckCircle2 size={15} />
                Generate structured error insights
              </span>
            </div>

            <button
              type="button"
              className="eo-option-btn"
              onClick={(event) => {
                event.stopPropagation();
                openWithAnswerKey();
              }}
            >
              <KeyRound size={17} />
              Start With Answer Key
              <span className="eo-button-arrow">→</span>
            </button>
          </article>

          {/* =================================
              WITHOUT ANSWER KEY
          ================================== */}

          <article
            className="eo-option-card eo-option-purple"
            onClick={openWithoutAnswerKey}
          >
            <div className="eo-card-glow eo-purple-glow" />

            <div className="eo-background-icon">
              <BarChart3 size={190} strokeWidth={1.2} />
            </div>

            <div className="eo-option-header">
              <div className="eo-option-icon">
                <BarChart3 size={31} />
              </div>

              <span className="eo-card-type">
                FREE-FORM ANALYSIS
              </span>
            </div>

            <div className="eo-option-content">
              <h3>Without Answer Key</h3>

              <p>
                Analyse free-form writing and open-ended
                submissions without a predefined answer key,
                identifying recurring literacy and writing
                patterns.
              </p>
            </div>

            <div className="eo-feature-list">
              <span>
                <CheckCircle2 size={15} />
                Analyse written student responses
              </span>

              <span>
                <CheckCircle2 size={15} />
                Identify recurring error patterns
              </span>

              <span>
                <CheckCircle2 size={15} />
                Generate educator-focused insights
              </span>
            </div>

            <button
              type="button"
              className="eo-option-btn"
              onClick={(event) => {
                event.stopPropagation();
                openWithoutAnswerKey();
              }}
            >
              <TrendingUp size={17} />
              Start Free-Form Analysis
              <span className="eo-button-arrow">→</span>
            </button>
          </article>

        </section>

        {/* =====================================
            BACK
        ====================================== */}

        <div className="eo-back-bar">
          <Link
            to={`/student-progress/${encodeURIComponent(id)}`}
            className="eo-back-btn"
          >
            <ArrowLeft size={16} />
            Back to Student Progress
          </Link>
        </div>

      </main>
    </div>
  );
}