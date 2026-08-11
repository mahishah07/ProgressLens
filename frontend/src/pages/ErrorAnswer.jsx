import "./../css/ErrorDashboard.css";
import "./../css/ErrorAnswer.css";

import { Link, useParams, useNavigate } from "react-router-dom";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Search,
  HelpCircle,
  Grid3X3,
  Upload,
  Image,
  Eye,
  CalendarDays,
  FileType2,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ArrowRight,
  FileCheck2,
} from "lucide-react";

const API = import.meta.env.VITE_ERROR_API;
const PMS_API = import.meta.env.VITE_PMS_API;

const studentResults = (payload) =>
  payload?.students || payload?.data || [];


/* =========================================================
   HELPERS COPIED FROM ERROR DASHBOARD
   ========================================================= */

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
  if (assessment.answerKey?.title) {
    return assessment.answerKey.title;
  }

  const originalName =
    assessment.writingSample?.originalName ||
    "Writing sample";

  return originalName
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};


const writingType = (assessment) => {
  const name = assessmentName(assessment).toLowerCase();

  if (name.includes("narrative")) {
    return "Narrative writing";
  }

  if (
    name.includes("exposition") ||
    name.includes("expository")
  ) {
    return "Expository writing";
  }

  if (name.includes("persuasive")) {
    return "Persuasive writing";
  }

  if (name.includes("diagram")) {
    return "Edit and diagram";
  }

  return "Writing homework";
};


const analysisStatus = (assessment) => {
  if (assessment.reviewStatus === "finalised") {
    return {
      label: "Finalised",
      className: "finalised",
      icon: CheckCircle2,
    };
  }

  if (
    assessment.interventionRecommendation?.status ===
    "completed"
  ) {
    return {
      label: "Analysed",
      className: "analysed",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Processing",
    className: "processing",
    icon: Clock3,
  };
};


/* =========================================================
   REUSABLE UPLOAD PREVIEW CARD
   ========================================================= */

const UploadedFileCard = ({
  file,
  previewURL,
  onPreview,
  onRemove,
}) => {
  return (
    <>
      {file.type.startsWith("image/") ? (
        <img
          src={previewURL}
          className="sa-upload-preview"
          alt="File preview"
        />
      ) : (
        <div className="sa-pdf-preview">
          <FileText size={54} />

          <h4>{file.name}</h4>

          <p>PDF Document</p>
        </div>
      )}

      <h3>Upload Complete</h3>

      <h4 className="sa-file-name">
        {file.name}
      </h4>

      <p>
        {(file.size / 1024 / 1024).toFixed(2)} MB
      </p>

      <div className="sa-upload-actions">
        <button
          type="button"
          className="sa-preview-file"
          onClick={(event) => {
            event.stopPropagation();

            onPreview();
          }}
        >
          Preview
        </button>

        <button
          type="button"
          className="sa-remove-file"
          onClick={(event) => {
            event.stopPropagation();

            onRemove();
          }}
        >
          Remove
        </button>
      </div>
    </>
  );
};

/* =========================================================
   COMPONENT
   ========================================================= */

export default function ErrorAnswer() {
  const navigate = useNavigate();
  const { id } = useParams();

  /* ================= HISTORY / STUDENT ================= */

  const [history, setHistory] = useState([]);
  const [, setStudent] = useState({
    studentId: id,
    name: id,
  });

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] =
    useState("latest");

  const [studentSearch, setStudentSearch] =
    useState("");

  const [studentSearching, setStudentSearching] =
    useState(false);


  /* =====================================================
     STUDENT SUBMISSION UPLOAD
     ===================================================== */

  const studentFileInputRef = useRef(null);

  const [studentFile, setStudentFile] =
    useState(null);

  const [studentPreviewURL, setStudentPreviewURL] =
    useState(null);

  const [studentDragging, setStudentDragging] =
    useState(false);


  /* =====================================================
     ANSWER KEY UPLOAD
     ===================================================== */

  const answerKeyInputRef = useRef(null);

  const [answerKeyFile, setAnswerKeyFile] =
    useState(null);

  const [answerKeyPreviewURL, setAnswerKeyPreviewURL] =
    useState(null);

  const [answerKeyDragging, setAnswerKeyDragging] =
    useState(false);


  const [uploading, setUploading] =
    useState(false);


  /* =====================================================
     FILE VALIDATION
     SAME TYPES AS ORIGINAL ERROR DASHBOARD
     ===================================================== */

  const validateFile = (file) => {
    if (!file) return false;

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/tiff",
      "image/bmp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please upload a PDF, PNG, JPG, JPEG, TIFF or BMP.",
      );

      return false;
    }

    const MAX_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      alert("Maximum file size is 10 MB.");

      return false;
    }

    return true;
  };


  /* =====================================================
     STUDENT SUBMISSION HANDLERS
     ===================================================== */

  const handleStudentBrowse = useCallback(() => {
    studentFileInputRef.current?.click();
  }, []);


  const processStudentFile = useCallback((file) => {
    if (!validateFile(file)) return;

    if (studentPreviewURL) {
      URL.revokeObjectURL(studentPreviewURL);
    }

    setStudentFile(file);
    setStudentPreviewURL(
      URL.createObjectURL(file),
    );
  }, [studentPreviewURL]);


  const handleStudentFileChange = (event) => {
    processStudentFile(
      event.target.files?.[0],
    );
  };


  const handleStudentDrop = (event) => {
    event.preventDefault();

    setStudentDragging(false);

    processStudentFile(
      event.dataTransfer.files?.[0],
    );
  };


  const clearStudentFileInput = useCallback(() => {
    if (studentFileInputRef.current) {
      studentFileInputRef.current.value = "";
    }
  }, []);

  const removeStudentFile = useCallback(() => {
    setStudentFile(null);

    if (studentPreviewURL) {
      URL.revokeObjectURL(
        studentPreviewURL,
      );
    }

    setStudentPreviewURL(null);
    clearStudentFileInput();
  }, [studentPreviewURL, clearStudentFileInput]);


  const previewStudentFile = useCallback(() => {
    if (!studentPreviewURL) return;

    window.open(
      studentPreviewURL,
      "_blank",
    );
  }, [studentPreviewURL]);


  /* =====================================================
     ANSWER KEY HANDLERS
     ===================================================== */

  const handleAnswerKeyBrowse = useCallback(() => {
    answerKeyInputRef.current?.click();
  }, []);


  const processAnswerKeyFile = useCallback((file) => {
    if (!validateFile(file)) return;

    if (answerKeyPreviewURL) {
      URL.revokeObjectURL(
        answerKeyPreviewURL,
      );
    }

    setAnswerKeyFile(file);

    setAnswerKeyPreviewURL(
      URL.createObjectURL(file),
    );
  }, [answerKeyPreviewURL]);


  const handleAnswerKeyChange = (event) => {
    processAnswerKeyFile(
      event.target.files?.[0],
    );
  };


  const handleAnswerKeyDrop = (event) => {
    event.preventDefault();

    setAnswerKeyDragging(false);

    processAnswerKeyFile(
      event.dataTransfer.files?.[0],
    );
  };


  const clearAnswerKeyInput = useCallback(() => {
    if (answerKeyInputRef.current) {
      answerKeyInputRef.current.value = "";
    }
  }, []);

  const removeAnswerKeyFile = useCallback(() => {
    setAnswerKeyFile(null);

    if (answerKeyPreviewURL) {
      URL.revokeObjectURL(
        answerKeyPreviewURL,
      );
    }

    setAnswerKeyPreviewURL(null);
    clearAnswerKeyInput();
  }, [answerKeyPreviewURL, clearAnswerKeyInput]);


  const previewAnswerKey = useCallback(() => {
    if (!answerKeyPreviewURL) return;

    window.open(
      answerKeyPreviewURL,
      "_blank",
    );
  }, [answerKeyPreviewURL]);


  /* =====================================================
     SEARCH STUDENT
     COPIED FROM ERROR DASHBOARD
     ===================================================== */

  const openStudentDashboard = async (event) => {
    event.preventDefault();

    const query = studentSearch.trim();

    if (!query) return;

    setStudentSearching(true);

    try {
      const response = await fetch(
        `${API}/api/students?q=${encodeURIComponent(query)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to search for students.",
        );
      }

      let profiles =
        studentResults(data);

      if (profiles.length === 0) {
        const pmsResponse = await fetch(
          `${PMS_API}/api/progress/search?studentId=${encodeURIComponent(
            query,
          )}`,
        );

        const pmsData =
          await pmsResponse.json();

        if (!pmsResponse.ok) {
          throw new Error(
            pmsData.message ||
              "Unable to search the student directory.",
          );
        }

        profiles = Array.isArray(pmsData)
          ? pmsData
          : [];
      }

      const normalisedQuery =
        query.toLowerCase();

      const profile =
        profiles.find(
          (item) =>
            item.studentId?.toLowerCase() ===
              normalisedQuery ||
            item.name?.toLowerCase() ===
              normalisedQuery,
        ) || profiles[0];

      if (!profile?.studentId) {
        alert(
          `No student found for “${query}”.`,
        );

        return;
      }

      setStudentSearch("");

      navigate(
        `/error-answer/${encodeURIComponent(
          profile.studentId,
        )}`,
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setStudentSearching(false);
    }
  };


  /* =====================================================
     ANALYSE ASSESSMENT
     ===================================================== */

  const analyzeAssessment = async () => {
  if (!studentFile || !answerKeyFile) {
    alert(
      "Please upload both the student submission and answer key first."
    );
    return;
  }

  if (!id) {
    alert(
      "Please open the Error Analyser from a student dashboard."
    );
    return;
  }

  setUploading(true);

  try {
    // =====================================================
    // 1. MAKE SURE STUDENT EXISTS
    // =====================================================

    const searchResponse = await fetch(
      `${API}/api/students?q=${encodeURIComponent(id)}`
    );

    const searchData = await searchResponse.json();

    const existingProfile = studentResults(searchData).find(
      (profile) => profile.studentId === id
    );

    if (!existingProfile) {
      const createResponse = await fetch(
        `${API}/api/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: id,
            name: id,
          }),
        }
      );

      if (
        !createResponse.ok &&
        createResponse.status !== 409
      ) {
        const createData = await createResponse.json();

        throw new Error(
          createData.error ||
            "Unable to create student profile."
        );
      }
    }

    // =====================================================
    // 2. UPLOAD ANSWER KEY
    // =====================================================

    const answerKeyForm = new FormData();

    answerKeyForm.append(
      "answerKey",
      answerKeyFile
    );

    answerKeyForm.append(
      "title",
      answerKeyFile.name.replace(/\.[^.]+$/, "")
    );

    const answerKeyResponse = await fetch(
      `${API}/api/uploads/answer-key`,
      {
        method: "POST",
        body: answerKeyForm,
      }
    );

    const answerKeyData =
      await answerKeyResponse.json();

    console.log(
      "Answer key response:",
      answerKeyData
    );

    if (!answerKeyResponse.ok) {
      throw new Error(
        answerKeyData.error ||
          "Answer key upload failed."
      );
    }

    const answerKeyId =
      answerKeyData.data?._id;

    if (!answerKeyId) {
      throw new Error(
        "Answer key upload did not return an ID."
      );
    }

    // =====================================================
    // 3. UPLOAD STUDENT SUBMISSION
    //    LINK IT TO THE ANSWER KEY
    // =====================================================

    const submissionForm = new FormData();

    submissionForm.append(
      "assignment",
      studentFile
    );

    submissionForm.append(
      "studentId",
      id
    );

    submissionForm.append(
      "answerKeyId",
      answerKeyId
    );

    const uploadResponse = await fetch(
      `${API}/api/uploads/writing-sample`,
      {
        method: "POST",
        body: submissionForm,
      }
    );

    const uploadData =
      await uploadResponse.json();

    console.log(
      "Submission upload response:",
      uploadData
    );

    if (!uploadResponse.ok) {
      throw new Error(
        uploadData.error ||
          "Student submission upload failed."
      );
    }

    const reportId =
      uploadData.data?.report?._id;

    if (!reportId) {
      throw new Error(
        "Upload did not return a report ID."
      );
    }

    // =====================================================
    // 4. ANALYSE REPORT
    // =====================================================

    const analyseResponse = await fetch(
      `${API}/api/reports/${reportId}/analyze`,
      {
        method: "POST",
      }
    );

    const analyseData =
      await analyseResponse.json();

    console.log(
      "Analysis response:",
      analyseData
    );

    if (!analyseResponse.ok) {
      throw new Error(
        analyseData.error ||
          "Assessment analysis failed."
      );
    }

    // =====================================================
    // 5. CLEAR UPLOADS
    // =====================================================

    removeStudentFile();
    removeAnswerKeyFile();

    // =====================================================
    // 6. OPEN NEW ANSWER-KEY ANALYSIS PAGE
    // =====================================================

    navigate(
      `/answer-analysis/${reportId}`
    );

  } catch (error) {
    console.error(
      "Answer-key analysis failed:",
      error
    );

    alert(error.message);
  } finally {
    setUploading(false);
  }
};


  /* =====================================================
     LOAD HISTORY
     EXACT SAME DATA SOURCE AS ERROR DASHBOARD
     ===================================================== */

  const loadDashboard = useCallback(async () => {
    if (!id) return;

    try {
      const [
        studentResponse,
        reportsResponse,
      ] = await Promise.all([
        fetch(
          `${API}/api/students?q=${encodeURIComponent(
            id,
          )}`,
        ),

        fetch(
          `${API}/api/students/${encodeURIComponent(
            id,
          )}/reports`,
        ),
      ]);

      const studentData =
        await studentResponse.json();

      const reportsData =
        await reportsResponse.json();

      setStudent(
        studentResults(studentData).find(
          (profile) =>
            profile.studentId === id,
        ) || {
          studentId: id,
          name: id,
        },
      );

      const reports =
        reportsResponse.ok
          ? reportsData.data || []
          : [];

      setHistory(
        reports.map((report) => ({
          ...report,

          errorType:
            report
              .interventionRecommendation
              ?.dominantPattern ||
            "Writing analysis",

          aiSummary:
            report
              .interventionRecommendation
              ?.overview ||
            `${
              report.summary?.errorCount || 0
            } errors detected`,

          diagnosisRequired: false,
        })),
      );
    } catch (error) {
      console.error(
        "Unable to load Error Analyser history:",
        error,
      );
    }
  }, [id]);


  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void loadDashboard();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);

      if (studentPreviewURL) {
        URL.revokeObjectURL(
          studentPreviewURL,
        );
      }

      if (answerKeyPreviewURL) {
        URL.revokeObjectURL(
          answerKeyPreviewURL,
        );
      }
    };
  }, [
    loadDashboard,
    studentPreviewURL,
    answerKeyPreviewURL,
  ]);


  /* =====================================================
     HISTORY FILTERING
     COPIED FROM ERROR DASHBOARD
     ===================================================== */

  const visibleHistory = history
  .filter((assessment) => Boolean(assessment.answerKey))
  .filter((assessment) => {
      const query =
        search.trim().toLowerCase();

      if (!query) return true;

      return [
        assessmentName(assessment),
        writingType(assessment),
        assessment.errorType,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(query),
      );
    })
    .sort((left, right) => {
      if (
        sortOrder === "highest-risk"
      ) {
        return (
          (right.summary?.errorCount ||
            0) -
          (left.summary?.errorCount ||
            0)
        );
      }

      const leftDate = new Date(
        left.createdAt ||
          left.analysedAt ||
          0,
      ).getTime();

      const rightDate = new Date(
        right.createdAt ||
          right.analysedAt ||
          0,
      ).getTime();

      return sortOrder === "oldest"
        ? leftDate - rightDate
        : rightDate - leftDate;
    });


  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="landing-page">

      {/* =================================================
          SIDEBAR
          SAME AS ERROR DASHBOARD
          ================================================= */}

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

            <span>Dashboard</span>
          </Link>

          <Link className="active">
            <BarChart3 size={20} />

            <span>
              Error Pattern Analysis
            </span>
          </Link>

          <Link>
            <FileText size={20} />

            <span>Reports</span>
          </Link>

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


      {/* =================================================
          MAIN
          ================================================= */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">
          <h2>DAS Assessment Portal</h2>

          <div className="top-right">

            <form
              className="search-box-top"
              onSubmit={
                openStudentDashboard
              }
            >
              <button
                type="submit"
                aria-label="Open student error dashboard"
                disabled={
                  studentSearching
                }
              >
                <Search size={18} />
              </button>

              <input
                placeholder={
                  studentSearching
                    ? "Searching..."
                    : "Search student by name or ID..."
                }
                value={studentSearch}
                onChange={(event) =>
                  setStudentSearch(
                    event.target.value,
                  )
                }
                disabled={
                  studentSearching
                }
              />
            </form>

            <HelpCircle size={22} />

            <Grid3X3 size={22} />

            <div className="teacher-avatar" />
          </div>
        </header>


        {/* =================================================
            PAGE
            ================================================= */}

        <section className="page-content">

          <h1 className="page-title">
            Student Error Pattern Analyser
          </h1>

          <p className="page-subtitle">
            Overview of linguistic and
            visual-spatial errors across
            student submissions.
          </p>


          {/* =================================================
              TWO UPLOAD AREAS
              ================================================= */}

          <div className="sa-upload-card">

            <div className="sa-upload-grid">

              {/* =============================================
                  STUDENT SUBMISSION
                  ============================================= */}

              <div
                className={`sa-upload-area ${
                  studentDragging
                    ? "dragging"
                    : ""
                } ${
                  studentFile
                    ? "uploaded"
                    : ""
                }`}
                onClick={
                  handleStudentBrowse
                }
                onDragOver={(event) => {
                  event.preventDefault();

                  setStudentDragging(
                    true,
                  );
                }}
                onDragLeave={() =>
                  setStudentDragging(
                    false,
                  )
                }
                onDrop={
                  handleStudentDrop
                }
              >
                {studentFile ? (
                  <UploadedFileCard
                    file={studentFile}
                    previewURL={studentPreviewURL}
                    onPreview={previewStudentFile}
                    onRemove={() => {
                      setStudentFile(null);

                      if (studentPreviewURL) {
                        URL.revokeObjectURL(
                          studentPreviewURL,
                        );
                      }

                      setStudentPreviewURL(null);

                      if (
                        studentFileInputRef.current
                      ) {
                        studentFileInputRef.current.value =
                          "";
                      }
                    }}
                  />
                ) : (
                  <>
                    <Upload
                      size={48}
                      className="sa-student-upload-icon"
                    />

                    <h3>
                      Import Student
                      Submission
                    </h3>

                    <p>
                      Drag & Drop or click
                      to browse
                    </p>

                    <small>
                      PDF, PNG, JPG, JPEG,
                      TIFF, BMP
                      <br />
                      Maximum size: 10 MB
                    </small>
                  </>
                )}

                <input
                  ref={
                    studentFileInputRef
                  }
                  type="file"
                  hidden
                  accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
                  onChange={
                    handleStudentFileChange
                  }
                />
              </div>


              {/* =============================================
                  ANSWER KEY
                  ============================================= */}

              <div
                className={`sa-upload-area sa-answer-key-area ${
                  answerKeyDragging
                    ? "dragging"
                    : ""
                } ${
                  answerKeyFile
                    ? "uploaded"
                    : ""
                }`}
                onClick={
                  handleAnswerKeyBrowse
                }
                onDragOver={(event) => {
                  event.preventDefault();

                  setAnswerKeyDragging(
                    true,
                  );
                }}
                onDragLeave={() =>
                  setAnswerKeyDragging(
                    false,
                  )
                }
                onDrop={
                  handleAnswerKeyDrop
                }
              >
                {answerKeyFile ? (
                  <UploadedFileCard
                    file={answerKeyFile}
                    previewURL={answerKeyPreviewURL}
                    onPreview={previewAnswerKey}
                    onRemove={() => {
                      removeAnswerKeyFile();
                    }}
                  />
                ) : (
                  <>
                    <div className="sa-answer-icon-wrapper">
                      <FileCheck2
                        size={35}
                      />
                    </div>

                    <h3>
                      Import Answer Key
                    </h3>

                    <p>
                      Upload the reference
                      answer or marking
                      rubric
                    </p>

                    <small>
                      PDF, PNG, JPG, JPEG,
                      TIFF, BMP
                      <br />
                      Maximum size: 10 MB
                    </small>
                  </>
                )}

                <input
                  ref={
                    answerKeyInputRef
                  }
                  type="file"
                  hidden
                  accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
                  onChange={
                    handleAnswerKeyChange
                  }
                />
              </div>

            </div>


            {/* ANALYSE BUTTON */}

            <button
              className="analyse-button"
              disabled={
                !studentFile ||
                !answerKeyFile ||
                uploading
              }
              onClick={
                analyzeAssessment
              }
            >
              {uploading ? (
                <>
                  <Image size={18} />

                  Processing...
                </>
              ) : (
                <>
                  <BarChart3
                    size={18}
                  />

                  Analyze Assessment
                </>
              )}
            </button>

          </div>


          {/* =================================================
              HISTORY
              EXACT SAME STRUCTURE AS ERROR DASHBOARD
              ================================================= */}

          {history.length > 0 && (
            <>
              <div className="history-header">
                <div>
                  <p className="history-eyebrow">
                    RECENT SUBMISSIONS
                  </p>

                  <h2>
                    Homework History
                  </h2>

                  <p className="history-intro">
                    Review homework
                    details, error
                    patterns and analysis
                    status.
                  </p>
                </div>

                <span className="history-count">
                  {history.length}{" "}
                  {history.length === 1
                    ? "record"
                    : "records"}
                </span>
              </div>


              <div className="toolbar history-toolbar">

                <div className="assessment-search">
                  <Search size={18} />

                  <input
                    placeholder="Search uploaded homework..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target
                          .value,
                      )
                    }
                  />
                </div>

                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(
                      event.target
                        .value,
                    )
                  }
                >
                  <option value="latest">
                    Sort by: Latest date
                  </option>

                  <option value="oldest">
                    Sort by: Oldest
                  </option>

                  <option value="highest-risk">
                    Sort by: Most errors
                  </option>
                </select>
              </div>


              <div className="history-grid">

                {visibleHistory.map(
                  (assessment) => {
                    const status =
                      analysisStatus(
                        assessment,
                      );

                    const StatusIcon =
                      status.icon;

                    const errorCount =
                      assessment
                        .summary
                        ?.errorCount ||
                      assessment
                        .errorCounts
                        ?.total ||
                      0;

                    const dominantPattern =
                      assessment.errorType ||
                      "Writing analysis";

                    const file =
                      assessment.writingSample ||
                      {};
                    
                    const hasAnswerKey = Boolean(assessment.answerKey);

                    return (
                      <article
                        className="history-card"
                        key={
                          assessment._id
                        }
                      >
                        <div className="history-card-accent" />

                        <div className="history-top">

                          <div className="history-title-block">
                            <span className="history-type">
                              {writingType(
                                assessment,
                              )}
                            </span>

                            <h3>
                              {assessmentName(
                                assessment,
                              )}
                            </h3>
                          </div>

                          <span
                            className={`history-status ${status.className}`}
                          >
                            <StatusIcon
                              size={14}
                            />

                            {status.label}
                          </span>

                        </div>


                        <div className="history-meta-row">
                          <span>
                            <CalendarDays
                              size={15}
                            />

                            {formatAssessmentDate(
                              assessment.createdAt ||
                                assessment.analysedAt,
                            )}
                          </span>

                          <span>
                            <FileType2
                              size={15}
                            />

                            {file.mimeType ===
                            "application/pdf"
                              ? "PDF"
                              : "Image"}{" "}
                            ·{" "}
                            {formatFileSize(
                              file.fileSize,
                            )}
                          </span>
                        </div>


                        <div className="history-insights">

                          <div className="history-metric">
                            <span>
                              Detected
                              errors
                            </span>

                            <strong>
                              {errorCount}
                            </strong>
                          </div>

                          <div className="history-pattern">
                            <span>
                              Dominant
                              pattern
                            </span>

                            <strong>
                              <AlertTriangle
                                size={15}
                              />

                              {
                                dominantPattern
                              }
                            </strong>
                          </div>

                        </div>


                        <div className="history-summary-block">
                          <span>
                            AI educator
                            summary
                          </span>

                          <p>
                            {
                              assessment.aiSummary
                            }
                          </p>
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
                  },
                )}

              </div>


              {visibleHistory.length ===
                0 && (
                <div className="history-empty-search">
                  No assessments match
                  “{search}”.
                </div>
              )}
            </>
          )}

        </section>
      </main>
    </div>
  );
}