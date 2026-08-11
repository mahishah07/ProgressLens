import "./../css/Landing.css";
import "./../css/ErrorOptions.css";
import "./../css/ErrorDashboard.css";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  FileText,
  FileCheck2,
  Bell,
  Settings,
  Search,
  BriefcaseBusiness,
  Upload,
  Image,
  Eye,
  CalendarDays,
  FileType2,
  AlertTriangle,
  ArrowRight,
  UserRound,
  Sheet,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";

const API = import.meta.env.VITE_ERROR_API;
const PMS_API = import.meta.env.VITE_PMS_API;
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

const studentResults = (payload) => payload?.students || payload?.data || [];

const formatAssessmentDate = (value) => {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes)) return "File stored";
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const assessmentName = (assessment) => {
  if (assessment.answerKey?.title) return assessment.answerKey.title;
  const originalName = assessment.writingSample?.originalName || "Writing sample";
  return originalName
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const writingType = (assessment) => {
  const name = assessmentName(assessment).toLowerCase();
  if (name.includes("narrative")) return "Narrative writing";
  if (name.includes("exposition") || name.includes("expository")) return "Expository writing";
  if (name.includes("persuasive")) return "Persuasive writing";
  if (name.includes("diagram")) return "Edit and diagram";
  return "Writing Assignment";
};

const isAnalysedAssessment = (assessment) => Boolean(
  assessment.reviewStatus === "finalised" ||
  assessment.interventionRecommendation?.status === "completed" ||
  assessment.openAiAnalysedAt ||
  assessment.writingSample?.status === "analysed"
);

export default function ErrorDashboard() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [, setStudent] = useState(null);
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSearching, setStudentSearching] = useState(false);

const fileInputRef = useRef(null);

const [selectedFile, setSelectedFile] = useState(null);
const [previewURL, setPreviewURL] = useState(null);
const [dragging, setDragging] = useState(false);
const [uploading, setUploading] = useState(false);

const handleBrowse = () => {
  fileInputRef.current.click();
};

const processFile = (file) => {
  if (!file) return;

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "image/bmp",
  ];

  if (!allowedTypes.includes(file.type)) {
    alert("Please upload a PDF, PNG, JPG, JPEG, TIFF or BMP.");
    return;
  }

  const MAX_SIZE = 10 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    alert("Maximum file size is 10 MB.");
    return;
  }

  setSelectedFile(file);
  setPreviewURL(URL.createObjectURL(file));
};

const handleFileChange = (e) => {
  processFile(e.target.files[0]);
};

const handleDrop = (e) => {
  e.preventDefault();
  setDragging(false);
  processFile(e.dataTransfer.files[0]);
};

const removeFile = () => {
  setSelectedFile(null);

  if (previewURL) {
    URL.revokeObjectURL(previewURL);
  }

  setPreviewURL(null);

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

const previewFile = () => {
  if (!selectedFile) return;

  window.open(previewURL, "_blank");
};

const openStudentDashboard = async (event) => {
  event.preventDefault();
  const query = studentSearch.trim();
  if (!query) return;

  setStudentSearching(true);
  try {
    const response = await fetch(`${API}/api/students?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to search for students.");

    let profiles = studentResults(data);
    if (profiles.length === 0) {
      const pmsResponse = await fetch(
        `${PMS_API}/api/progress/search?studentId=${encodeURIComponent(query)}`
      );
      const pmsData = await pmsResponse.json();
      if (!pmsResponse.ok) throw new Error(pmsData.message || "Unable to search the student directory.");
      profiles = Array.isArray(pmsData) ? pmsData : [];
    }
    const normalisedQuery = query.toLowerCase();
    const profile = profiles.find((item) =>
      item.studentId?.toLowerCase() === normalisedQuery ||
      item.name?.toLowerCase() === normalisedQuery
    ) || profiles[0];

    if (!profile?.studentId) {
      alert(`No student found for “${query}”.`);
      return;
    }

    setStudentSearch("");
    navigate(`/error-dashboard/${encodeURIComponent(profile.studentId)}`);
  } catch (error) {
    alert(error.message);
  } finally {
    setStudentSearching(false);
  }
};

const analyzeAssessment = async () => {
  if (!selectedFile) {
    alert("Please upload a file first.");
    return;
  }
  if (!id) {
    alert("Please open the Error Analyser from a student dashboard.");
    return;
  }

  setUploading(true);

  const formData = new FormData();
  formData.append("assignment", selectedFile);
  formData.append("studentId", id);

  try {
    const searchResponse = await fetch(
      `${API}/api/students?q=${encodeURIComponent(id)}`,
    );
    const searchData = await searchResponse.json();
    const existingProfile = studentResults(searchData).find((profile) => profile.studentId === id);
    if (!existingProfile) {
      const createResponse = await fetch(`${API}/api/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id, name: id }),
      });
      if (!createResponse.ok && createResponse.status !== 409) {
        const createData = await createResponse.json();
        throw new Error(createData.error || "Unable to create the Error Analyser student profile.");
      }
    }

    const uploadResponse = await fetch(
      `${API}/api/uploads/writing-sample`,
      { method: "POST", body: formData },
    );
    const uploadData = await uploadResponse.json();
    console.log("Upload response:", uploadData);
    if (!uploadResponse.ok) throw new Error(uploadData.error || "Upload failed.");

    const reportId = uploadData.data?.report?._id;
    if (!reportId) throw new Error("The upload response did not include a report ID.");
    const analyseResponse = await fetch(
      `${API}/api/reports/${reportId}/analyze`,
      { method: "POST" },
    );
    const analyseData = await analyseResponse.json();
    console.log("Analyse response:", analyseData);
    if (!analyseResponse.ok) throw new Error(analyseData.error || "Analysis failed.");

    removeFile();
    await loadDashboard();

    console.log("Navigating with reportId:", reportId);
    navigate(`/student-errors/${reportId}`);

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    setUploading(false);
  }
};

  const loadDashboard = async () => {
    if (!id) return;
    try {
      const [studentResponse, reportsResponse] = await Promise.all([
        fetch(`${API}/api/students?q=${encodeURIComponent(id)}`),
        fetch(`${API}/api/students/${encodeURIComponent(id)}/reports`),
      ]);
      const studentData = await studentResponse.json();
      const reportsData = await reportsResponse.json();
      setStudent(studentResults(studentData).find((profile) => profile.studentId === id) || { studentId: id, name: id });
      const reports = reportsResponse.ok ? reportsData.data || [] : [];
      setHistory(reports.map((report) => ({
        ...report,
        errorType: report.interventionRecommendation?.dominantPattern || "Writing analysis",
        aiSummary: report.interventionRecommendation?.overview || `${report.summary?.errorCount || 0} errors detected`,
        diagnosisRequired: false,
      })));
    } catch (error) {
      console.error("Unable to load Error Analyser history:", error);
    }
  };

    // end analyzeAssessment

  useEffect(() => {
    loadDashboard();
  }, [id]);

  useEffect(() => {
    if (!id || !PMS_API) return;
    const controller = new AbortController();

    const loadOverview = async () => {
      try {
        const response = await fetch(
          `${PMS_API}/api/progress/${encodeURIComponent(id)}/overview`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (response.ok && !data.message) setOverview(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Unable to load student overview:", error);
        }
      }
    };

    loadOverview();
    return () => controller.abort();
  }, [id]);

  const analysedHistory = history
  .filter(isAnalysedAssessment)
  .filter((assessment) => !assessment.answerKey)

  const visibleHistory = analysedHistory
  .filter((assessment) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return [assessmentName(assessment), writingType(assessment), assessment.errorType]
        .some((value) => value.toLowerCase().includes(query));
    })
    .sort((left, right) => {
      if (sortOrder === "highest-risk") {
        return (right.summary?.errorCount || 0) - (left.summary?.errorCount || 0);
      }
      const leftDate = new Date(left.createdAt || left.analysedAt || 0).getTime();
      const rightDate = new Date(right.createdAt || right.analysedAt || 0).getTime();
      return sortOrder === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });

  return (
    <div className="landing-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-circle">DAS</div>
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

          <Link to={`/student/${encodeURIComponent(id)}?view=dashboard`}>
            <TrendingUp size={20} />
            <span>Progress Monitoring</span>
          </Link>

          <div className="dashboard-nav-section">
            <span className="dashboard-nav-heading">ERROR ANALYSIS</span>

            <Link
              to={`/error-answer/${encodeURIComponent(id)}`}
              className="dashboard-nav-subitem"
            >
              <FileCheck2 size={18} />
              <span>Reference-Based Analysis</span>
            </Link>

            <Link
              to={`/error-dashboard/${encodeURIComponent(id)}`}
              className="dashboard-nav-subitem active"
            >
              <BarChart3 size={19} />
              <span>Free-Form Analysis</span>
            </Link>
          </div>

          <Link>
            <Bell size={20} />
            <span>Notifications</span>
          </Link>

          <Link>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* ================= Main ================= */}
      <main className="main-content">
        <header className="topbar eo-main-topbar dashboard-shared-topbar">
          <div className="topbar-brand">
            <div>
              <h2>DAS Assessment Portal</h2>
              <span className="topbar-context">Reference-Based Analysis</span>
            </div>
          </div>

          <div className="eo-topbar-right">
            <form className="eo-navbar-search" onSubmit={openStudentDashboard}>
              <button type="submit" aria-label="Open student error dashboard" disabled={studentSearching}>
                <Search size={18} />
              </button>
              <input
                placeholder={studentSearching ? "Searching..." : "Search student by name or ID..."}
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                disabled={studentSearching}
              />
            </form>

            <div className="eo-teacher-profile">
              <div className="eo-teacher-icon">
                <BriefcaseBusiness size={20} />
              </div>
              <div className="eo-teacher-copy">
                <strong>Educational Professional</strong>
                <span>DAS Teacher Portal</span>
              </div>
            </div>
          </div>
        </header>

        {/* ================= Page ================= */}
        <section className="page-content">
          <section className="dashboard-profile-card">
            <div className="dashboard-student-icon">
              <UserRound size={29} />
            </div>

            <div className="dashboard-profile-info">
              <h1>{overview?.student?.studentId || id}</h1>
              {SHEET_URL && (
                <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="dashboard-sheets-btn">
                  <Sheet size={16} />
                  Open Google Sheets
                </a>
              )}
            </div>

            <div className="dashboard-profile-meta">
              <div className="dashboard-meta-item">
                <div className="dashboard-meta-icon"><CalendarDays size={17} /></div>
                <div>
                  <span className="dashboard-meta-label">Last Assignment Upload</span>
                  <span className="dashboard-meta-value">
                    {overview?.lastAssessmentDate
                      ? formatAssessmentDate(overview.lastAssessmentDate)
                      : "No assessment yet"}
                  </span>
                </div>
              </div>

              <div className="dashboard-meta-item">
                <div className="dashboard-meta-icon"><GraduationCap size={17} /></div>
                <div>
                  <span className="dashboard-meta-label">Assigned Band</span>
                  <span className="dashboard-meta-value dashboard-band">
                    {overview?.latestNewBand || overview?.currentBandLevel || "—"}
                  </span>
                </div>
              </div>

              <div className="dashboard-meta-item">
                <div className="dashboard-meta-icon"><BriefcaseBusiness size={17} /></div>
                <div>
                  <span className="dashboard-meta-label">Assigned Teacher</span>
                  <span className="dashboard-meta-value">
                    {overview?.student?.teacherId || "—"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="dashboard-section-heading analysis-page-heading">
            <div>
              <span className="dashboard-section-eyebrow">FREE-FORM ANALYSIS</span>
              <h1 className="page-title analysis-upload-title">Upload Assignment</h1>
              <p className="page-subtitle">
                Upload the student submission for free-form error analysis.
              </p>
            </div>

            <Link to={`/error-options/${encodeURIComponent(id)}`} className="dashboard-back-button analysis-back-options">
              <ArrowLeft size={16} />
              Back to Analysis Options
            </Link>
          </div>

          {/* ================= Upload ================= */}
          <div className="upload-card">
  <div
    className={`upload-area ${
      dragging ? "dragging" : ""
    } ${selectedFile ? "uploaded" : ""}`}
    onClick={handleBrowse}
    onDragOver={(e) => {
      e.preventDefault();
      setDragging(true);
    }}
    onDragLeave={() => setDragging(false)}
    onDrop={handleDrop}
  >
    {selectedFile ? (
      <>
        {selectedFile.type.startsWith("image/") ? (
          <img
            src={previewURL}
            className="upload-preview"
            alt="preview"
          />
        ) : (
          <div className="pdf-preview-card">
            <FileText size={80} />
            <h4>{selectedFile.name}</h4>
            <p>PDF Document</p>
          </div>
        )}

        <h3>Upload Complete</h3>

        <h4>{selectedFile.name}</h4>

        <p>
          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
        </p>

        <div className="upload-actions">
          <button
            className="preview-file"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              previewFile();
            }}
          >
            Preview
          </button>

          <button
            className="remove-file"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeFile();
            }}
          >
            Remove
          </button>
        </div>
      </>
    ) : (
      <>
        <Upload size={50} />

        <h3>Import Student Submission</h3>

        <p>Drag & Drop or click to browse</p>

        <small>
          PDF, PNG, JPG, JPEG, TIFF, BMP
          <br />
          Maximum size: 10 MB
        </small>
      </>
    )}

    <input
      ref={fileInputRef}
      type="file"
      hidden
      accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
      onChange={handleFileChange}
    />
  </div>

  <button
    className="analyse-button"
    disabled={!selectedFile || uploading}
    onClick={analyzeAssessment}
  >
    {uploading ? (
      <>
        <Image size={18} />
        Processing...
      </>
    ) : (
      <>
        <Image size={18} />
        Analyze Assignment
      </>
    )}
  </button>
</div>
          {/* ================= History ================= */}
          {analysedHistory.length > 0 && (
            <>
              <div className="history-header">
                <div>
                  <p className="history-eyebrow">RECENT SUBMISSIONS</p>
                  <h2>Assignment History</h2>
                  <p className="history-intro">Review analysed assignments and their error patterns.</p>
                </div>
                <span className="history-count">{analysedHistory.length} {analysedHistory.length === 1 ? "record" : "records"}</span>
              </div>

              <div className="toolbar history-toolbar">
                <div className="assessment-search">
                  <Search size={18} />
                  <input
                    placeholder="Search uploaded assignment..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="latest">Sort by: Latest date</option>
                  <option value="oldest">Sort by: Oldest</option>
                  <option value="highest-risk">Sort by: Most errors</option>
                </select>
              </div>

              <div className="history-grid">
                {visibleHistory.map((assessment) => {
                  const errorCount = assessment.summary?.errorCount || assessment.errorCounts?.total || 0;
                  const dominantPattern = assessment.errorType || "Writing analysis";
                  const file = assessment.writingSample || {};
                  const hasAnswerKey = Boolean(assessment.answerKey);

                  return (
                    <article className="history-card" key={assessment._id}>
                      <div className="history-card-accent" />
                      <div className="history-top">
                        <div className="history-title-block">
                          <span className="history-type">{writingType(assessment)}</span>
                          <h3>{assessmentName(assessment)}</h3>
                        </div>
                      </div>

                      <div className="history-meta-row">
                        <span><CalendarDays size={15} /> {formatAssessmentDate(assessment.createdAt || assessment.analysedAt)}</span>
                        <span><FileType2 size={15} /> {file.mimeType === "application/pdf" ? "PDF" : "Image"} · {formatFileSize(file.fileSize)}</span>
                      </div>

                      <div className="history-insights">
                        <div className="history-metric">
                          <span>Detected errors</span>
                          <strong>{errorCount}</strong>
                        </div>
                        <div className="history-pattern">
                          <span>Dominant pattern</span>
                          <strong><AlertTriangle size={15} /> {dominantPattern}</strong>
                        </div>
                      </div>

                      <div className="history-summary-block">
                        <span>AI educator summary</span>
                        <p>{assessment.aiSummary}</p>
                      </div>

                      <div className="history-card-footer">
                        <div className="history-card-actions">
                          <Link
                            to={
                              hasAnswerKey
                                ? `/answer-analysis/${assessment._id}`
                                : `/student-errors/${assessment._id}`
                            }
                            className="analysis-button"
                          >
                            <BarChart3 size={17} />
                            View analysis
                          </Link>

                          <Link
                            to={
                              hasAnswerKey
                                ? `/answer-report/${assessment._id}`
                                : `/error-report/${assessment._id}`
                            }
                            className="report-button"
                          >
                            <Eye size={17} />
                            View report
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {visibleHistory.length === 0 && (
                <div className="history-empty-search">No assessments match “{search}”.</div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
