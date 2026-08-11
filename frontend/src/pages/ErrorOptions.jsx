import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./../css/Landing.css";
import "./../css/ErrorOptions.css";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  Sheet,
  TrendingUp,
  LayoutDashboard,
  Bell,
  Settings,
  UserRound,
  CalendarDays,
  GraduationCap,
  Search,
  BriefcaseBusiness,
} from "lucide-react";

const PMS_API = import.meta.env.VITE_PMS_API;
const ERROR_API = import.meta.env.VITE_ERROR_API;
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

/* nav and sidebar */
function TeacherSidebar({ studentId }) {
  const encodedId =
    studentId
      ? encodeURIComponent(studentId)
      : "";

  return (
    <aside className="sidebar">

      <div className="logo-section">
        <div className="logo-circle">
          DAS
        </div>

        <div>
          <h2>DAS Teacher</h2>
          <p>Educational Professional</p>
        </div>
      </div>


      <nav>

        <Link to="/">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>


        {studentId && (
          <Link to={`/student/${encodedId}?view=dashboard`}>
            <TrendingUp size={20} />
            <span>Progress Monitoring</span>
          </Link>
        )}


        <div className="eo-nav-section">
          <span className="eo-nav-heading">
            ERROR ANALYSIS
          </span>


          {studentId && (
            <>
              <Link
                to={`/error-answer/${encodedId}`}
                className="eo-nav-subitem"
              >
                <FileCheck2 size={18} />
                <span>
                  Reference-Based Analysis
                </span>
              </Link>


              <Link
                to={`/error-dashboard/${encodedId}`}
                className="eo-nav-subitem"
              >
                <BarChart3 size={19} />
                <span>Free-Form Analysis</span>
              </Link>
            </>
          )}
        </div>


        <a href="#">
          <Bell size={20} />
          <span>Notifications</span>
        </a>


        <a href="#">
          <Settings size={20} />
          <span>Settings</span>
        </a>

      </nav>

    </aside>
  );
}


function TeacherTopbar({
  studentSearch,
  setStudentSearch,
  studentSearching,
  onStudentSearch,
}) {
  return (
    <header className="topbar eo-main-topbar">

      <div className="topbar-brand">
        <div>
          <h2>DAS Assessment Portal</h2>

          <span className="topbar-context">
            Error Pattern Analysis
          </span>
        </div>
      </div>


      <div className="eo-topbar-right">

        {/* STUDENT SEARCH */}

        <form
          className="eo-navbar-search"
          onSubmit={onStudentSearch}
        >
          <button
            type="submit"
            aria-label="Search student"
            disabled={studentSearching}
          >
            <Search size={18} />
          </button>

          <input
            type="text"
            value={studentSearch}
            onChange={(event) =>
              setStudentSearch(
                event.target.value
              )
            }
            placeholder={
              studentSearching
                ? "Searching..."
                : "Search student by name or ID..."
            }
            disabled={studentSearching}
          />
        </form>


        {/* TEACHER / USER */}

        <div className="eo-teacher-profile">

          <div className="eo-teacher-icon">
            <BriefcaseBusiness size={20} />
          </div>

          <div className="eo-teacher-copy">
            <strong>
              Educational Professional
            </strong>

            <span>
              DAS Teacher Portal
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function ErrorOptions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentSearching, setStudentSearching] = useState(false);

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
          `${PMS_API}/api/progress/${encodeURIComponent(id)}/overview`,
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
  const openStudentDashboard = async (event) => {
  event.preventDefault();

  const query = studentSearch.trim();

  if (!query) return;

  setStudentSearching(true);

  try {
    let profiles = [];

    // ==========================================
    // 1. SEARCH ERROR ANALYSER DATABASE
    // ==========================================

    if (ERROR_API) {
      const response = await fetch(
        `${ERROR_API}/api/students?q=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (response.ok) {
        profiles =
          data?.students ||
          data?.data ||
          [];
      }
    }


    // ==========================================
    // 2. FALL BACK TO PMS DIRECTORY
    // ==========================================

    if (profiles.length === 0) {
      const response = await fetch(
        `${PMS_API}/api/progress/search?studentId=${encodeURIComponent(
          query
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to search the student directory."
        );
      }

      profiles = Array.isArray(data)
        ? data
        : [];
    }


    // ==========================================
    // 3. FIND BEST MATCH
    // ==========================================

    const normalised =
      query.toLowerCase();

    const profile =
      profiles.find((student) => {
        const fullName = [
          student.firstName,
          student.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          student.studentId?.toLowerCase() ===
            normalised ||
          student.name?.toLowerCase() ===
            normalised ||
          fullName === normalised
        );
      }) || profiles[0];


    if (!profile?.studentId) {
      alert(`No student found for “${query}”.`);
      return;
    }


    setStudentSearch("");

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
      <TeacherSidebar studentId={studentId} />
      <main className="eo-main">
        <TeacherTopbar
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          studentSearching={studentSearching}
          onStudentSearch={openStudentDashboard}
        />
        <div className="eo-content">
          {/* STUDENT PROFILE */}
          <section className="eo-profile-card">
            <div className="eo-student-icon">
              <UserRound size={29} />
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
                  <Sheet size={16} />
                  Open Google Sheets
                </a>
              )}
            </div>

            <div className="eo-profile-meta">
              {/* LAST ASSESSMENT */}
              <div className="eo-meta-item">
                <div className="eo-meta-icon">
                  <CalendarDays size={17} />
                </div>

                <div>
                  <span className="eo-meta-label">Last Assessment</span>
                  <span className="eo-meta-value">
                    {formatDate(overview?.lastAssessmentDate)}
                  </span>
                </div>
              </div>

              {/* BAND */}
              <div className="eo-meta-item">
                <div className="eo-meta-icon">
                  <GraduationCap size={17} />
                </div>

                <div>
                  <span className="eo-meta-label">Assigned Band</span>
                  <span className="eo-meta-value eo-band">{currentBand}</span>
                </div>
              </div>

              {/* TEACHER */}
              <div className="eo-meta-item">
                <div className="eo-meta-icon">
                  <UserRound size={17} />
                </div>

                <div>
                  <span className="eo-meta-label">Assigned Teacher</span>
                  <span className="eo-meta-value">{teacher}</span>
                </div>
              </div>
            </div>
          </section>

          {/* INTRO */}
          <section className="eo-section-heading">
            <div>
              <span className="eo-eyebrow">
                ERROR ANALYSIS
              </span>

              <h2>Choose an analysis method</h2>

              <p>
                Select the workflow that matches the assessment.
              </p>
            </div>
          </section>

          {/* OPTIONS */}
          <section className="eo-options">
            {/* WITH ANSWER KEY */}
            <article
              className="eo-option-card eo-option-key"
              onClick={openWithAnswerKey}
            >
              <div className="eo-card-accent" />


              <div className="eo-option-header">

                <div className="eo-option-icon eo-key-icon">
                  <FileCheck2 size={28} />
                </div>

                <span className="eo-card-type">
                  ANSWER KEY REQUIRED
                </span>

              </div>


              <div className="eo-option-content">

                <h3>
                  Reference-Based Analysis
                </h3>

                <p>
                  Compare a student submission with an
                  uploaded answer key and identify
                  differences in responses.
                </p>

              </div>


              <div className="eo-feature-list">

                <span>
                  <CheckCircle2 size={16} />
                  Student and answer-key comparison
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Structured error analysis
                </span>

              </div>


              <button
                type="button"
                className="eo-option-btn eo-key-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  openWithAnswerKey();
                }}
              >
                Start analysis
                <span className="eo-button-arrow">
                  →
                </span>
              </button>

              <FileCheck2
                className="eo-background-icon"
                size={185}
              />

            </article>

            {/* WITHOUT ANSWER KEY */}
            <article
              className="eo-option-card eo-option-free"
              onClick={openWithoutAnswerKey}
            >
              <div className="eo-card-accent" />


              <div className="eo-option-header">

                <div className="eo-option-icon eo-free-icon">
                  <BarChart3 size={28} />
                </div>

                <span className="eo-card-type">
                  NO ANSWER KEY
                </span>

              </div>


              <div className="eo-option-content">

                <h3>
                  Free-Form Analysis
                </h3>

                <p>
                  Analyse open-ended writing for recurring
                  literacy and writing error patterns.
                </p>

              </div>


              <div className="eo-feature-list">

                <span>
                  <CheckCircle2 size={16} />
                  Writing-pattern detection
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Educator-focused insights
                </span>

              </div>


              <button
                type="button"
                className="eo-option-btn eo-free-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  openWithoutAnswerKey();
                }}
              >
                Start analysis
                <span className="eo-button-arrow">
                  →
                </span>
              </button>

              <BarChart3
                className="eo-background-icon"
                size={185}
              />

            </article>
          </section>

          {/* BACK */}
          <div className="eo-back-bar">
            <button
              type="button"
              className="eo-back-btn"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} />
              Back to Student Progress
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}