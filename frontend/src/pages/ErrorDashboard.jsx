import "./../css/Landing.css";
import "./../css/ErrorOptions.css";
import "./../css/ErrorDashboard.css";
import "./../css/ErrorAnswer.css";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
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
  CheckCircle2,
  ArrowRight,
  UserRound,
  GraduationCap,
  ArrowLeft,
  Trash2,
} from "lucide-react";


const API =
  import.meta.env.VITE_ERROR_API;

const PMS_API =
  import.meta.env.VITE_PMS_API;


/* =========================================================
   HELPERS
   ========================================================= */

const studentResults = (payload) =>
  payload?.students ||
  payload?.data ||
  [];


const formatAssessmentDate = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  return new Date(value).toLocaleDateString(
    "en-SG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
};


const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes)) {
    return "File stored";
  }

  if (bytes >= 1024 * 1024) {
    return `${(
      bytes /
      1024 /
      1024
    ).toFixed(1)} MB`;
  }

  return `${Math.max(
    1,
    Math.round(bytes / 1024),
  )} KB`;
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
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2",
    )
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};


const writingType = (assessment) => {
  const name =
    assessmentName(
      assessment,
    ).toLowerCase();

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

  return "Writing assignment";
};


const isAnalysedAssessment = (
  assessment,
) =>
  Boolean(
    assessment.reviewStatus ===
      "finalised" ||
      assessment
        .interventionRecommendation
        ?.status === "completed" ||
      assessment.openAiAnalysedAt ||
      assessment.writingSample?.status ===
        "analysed",
  );


/* =========================================================
   UPLOADED FILE PREVIEW
   SAME AS ERROR ANSWER
   ========================================================= */

function UploadedFileCard({
  file,
  previewURL,
  onPreview,
  onRemove,
}) {
  const isImage =
    file.type.startsWith("image/");

  const isPdf =
    file.type === "application/pdf";

  return (
    <div
      className="sa-file-card-content"
      onClick={(event) =>
        event.stopPropagation()
      }
    >

      <div className="sa-preview-frame">

        {isImage && (
          <img
            src={previewURL}
            className="sa-upload-preview"
            alt="Uploaded file preview"
          />
        )}


        {isPdf && (
          <iframe
            src={`${previewURL}#toolbar=0&navpanes=0`}
            className="sa-pdf-live-preview"
            title={`${file.name} preview`}
          />
        )}

      </div>


      <div className="sa-file-details">

        <CheckCircle2
          size={17}
          className="sa-upload-success-icon"
        />

        <div>
          <h4 className="sa-file-name">
            {file.name}
          </h4>

          <p>
            {(
              file.size /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </p>
        </div>

      </div>


      <div className="sa-upload-actions">

        <button
          type="button"
          className="sa-preview-file"
          onClick={onPreview}
        >
          <Eye size={15} />
          Open preview
        </button>


        <button
          type="button"
          className="sa-remove-file"
          onClick={onRemove}
        >
          <Trash2 size={15} />
          Remove
        </button>

      </div>

    </div>
  );
}


/* =========================================================
   SIDEBAR
   ========================================================= */

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
          <Link
            to={`/student/${encodedId}?view=dashboard`}
          >
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
                className="eo-nav-subitem active"
              >
                <BarChart3 size={19} />

                <span>
                  Free-Form Analysis
                </span>
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


/* =========================================================
   TOPBAR
   ========================================================= */

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
          <h2>
            DAS Assessment Portal
          </h2>

          <span className="topbar-context">
            Free-Form Analysis
          </span>
        </div>

      </div>


      <div className="eo-topbar-right">

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
                event.target.value,
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


        <div className="eo-teacher-profile">

          <div className="eo-teacher-icon">
            <BriefcaseBusiness
              size={20}
            />
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


/* =========================================================
   COMPONENT
   ========================================================= */

export default function ErrorDashboard() {
  const navigate =
    useNavigate();

  const { id } =
    useParams();


  const [
    overview,
    setOverview,
  ] = useState(null);


  const [
    history,
    setHistory,
  ] = useState([]);


  const [, setStudent] =
    useState({
      studentId: id,
      name: id,
    });


  const [
    historyCategory,
    setHistoryCategory,
  ] = useState("all");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    sortOrder,
    setSortOrder,
  ] = useState("latest");


  const [
    studentSearch,
    setStudentSearch,
  ] = useState("");


  const [
    studentSearching,
    setStudentSearching,
  ] = useState(false);


  /* =====================================================
     FILE STATE
     ===================================================== */

  const studentFileInputRef =
    useRef(null);


  const [
    studentFile,
    setStudentFile,
  ] = useState(null);


  const [
    studentPreviewURL,
    setStudentPreviewURL,
  ] = useState(null);


  const [
    studentDragging,
    setStudentDragging,
  ] = useState(false);


  const [
    uploading,
    setUploading,
  ] = useState(false);


  /* =====================================================
     STUDENT OVERVIEW
     ===================================================== */

  useEffect(() => {
    if (!id || !PMS_API) {
      return;
    }

    const controller =
      new AbortController();


    const loadOverview = async () => {
      try {

        const response =
          await fetch(
            `${PMS_API}/api/progress/${encodeURIComponent(
              id,
            )}/overview`,
            {
              signal:
                controller.signal,
            },
          );


        const data =
          await response.json();


        if (
          response.ok &&
          !data.message
        ) {
          setOverview(data);
        }

      } catch (error) {

        if (
          error.name !==
          "AbortError"
        ) {
          console.warn(
            "Unable to load student overview:",
            error,
          );
        }

      }
    };


    loadOverview();


    return () =>
      controller.abort();

  }, [id]);


  const currentBand =
    overview?.latestNewBand ||
    overview?.currentBandLevel ||
    "—";


  const studentCentre =
    overview?.student?.centreId ||
    overview?.student?.centre ||
    "—";


  /* =====================================================
     FILE HANDLERS
     ===================================================== */

  const handleStudentBrowse =
    useCallback(() => {
      studentFileInputRef
        .current
        ?.click();
    }, []);


  const processStudentFile =
    useCallback(
      (file) => {

        if (!file) {
          return;
        }


        const allowedTypes = [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/tiff",
          "image/bmp",
        ];


        if (
          !allowedTypes.includes(
            file.type,
          )
        ) {
          alert(
            "Please upload a PDF, PNG, JPG, JPEG, TIFF or BMP.",
          );

          return;
        }


        if (
          file.size >
          10 * 1024 * 1024
        ) {
          alert(
            "Maximum file size is 10 MB.",
          );

          return;
        }


        if (studentPreviewURL) {
          URL.revokeObjectURL(
            studentPreviewURL,
          );
        }


        setStudentFile(file);


        setStudentPreviewURL(
          URL.createObjectURL(file),
        );

      },
      [studentPreviewURL],
    );


  const handleStudentFileChange =
    (event) => {

      processStudentFile(
        event.target.files?.[0],
      );
    };


  const handleStudentDrop =
    (event) => {

      event.preventDefault();

      setStudentDragging(false);


      processStudentFile(
        event.dataTransfer.files?.[0],
      );
    };


  const clearStudentFileInput =
    useCallback(() => {

      if (
        studentFileInputRef.current
      ) {
        studentFileInputRef.current.value =
          "";
      }

    }, []);


  const removeStudentFile =
    useCallback(() => {

      setStudentFile(null);


      if (studentPreviewURL) {
        URL.revokeObjectURL(
          studentPreviewURL,
        );
      }


      setStudentPreviewURL(null);

      clearStudentFileInput();

    }, [
      studentPreviewURL,
      clearStudentFileInput,
    ]);


  const previewStudentFile =
    useCallback(() => {

      if (!studentPreviewURL) {
        return;
      }


      window.open(
        studentPreviewURL,
        "_blank",
      );

    }, [studentPreviewURL]);


  /* =====================================================
     STUDENT SEARCH
     ===================================================== */

  const openStudentDashboard =
    async (event) => {

      event.preventDefault();


      const query =
        studentSearch.trim();


      if (!query) {
        return;
      }


      setStudentSearching(true);


      try {

        const response =
          await fetch(
            `${API}/api/students?q=${encodeURIComponent(
              query,
            )}`,
          );


        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to search for students.",
          );
        }


        let profiles =
          studentResults(data);


        if (
          profiles.length === 0
        ) {

          const pmsResponse =
            await fetch(
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


          profiles =
            Array.isArray(pmsData)
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
          ) ||
          profiles[0];


        if (!profile?.studentId) {

          alert(
            `No student found for “${query}”.`,
          );

          return;
        }


        setStudentSearch("");


        navigate(
          `/error-dashboard/${encodeURIComponent(
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
     LOAD HISTORY
     ===================================================== */

  const loadDashboard =
    useCallback(async () => {

      if (!id) {
        return;
      }


      try {

        const [
          studentResponse,
          reportsResponse,
        ] =
          await Promise.all([
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
          studentResults(
            studentData,
          ).find(
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
          reports.map(
            (report) => ({
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
                  report.summary
                    ?.errorCount ||
                  0
                } errors detected`,

              diagnosisRequired:
                false,
            }),
          ),
        );

      } catch (error) {

        console.error(
          "Unable to load Error Analyser history:",
          error,
        );

      }

    }, [id]);


  useEffect(() => {

    // Defer calling loadDashboard to avoid synchronous setState inside effect
    const timer = setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => clearTimeout(timer);

  }, [loadDashboard]);


  /* =====================================================
     ANALYSE
     ===================================================== */

  const analyzeAssessment =
    async () => {

      if (!studentFile) {

        alert(
          "Please upload the student submission first.",
        );

        return;
      }


      if (!id) {

        alert(
          "Please open the Error Analyser from a student dashboard.",
        );

        return;
      }


      setUploading(true);


      try {

        const searchResponse =
          await fetch(
            `${API}/api/students?q=${encodeURIComponent(
              id,
            )}`,
          );


        const searchData =
          await searchResponse.json();


        const existingProfile =
          studentResults(
            searchData,
          ).find(
            (profile) =>
              profile.studentId === id,
          );


        if (!existingProfile) {

          const createResponse =
            await fetch(
              `${API}/api/students`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  studentId: id,
                  name: id,
                }),
              },
            );


          if (
            !createResponse.ok &&
            createResponse.status !==
              409
          ) {

            const createData =
              await createResponse.json();


            throw new Error(
              createData.error ||
                "Unable to create the Error Analyser student profile.",
            );
          }
        }


        const formData =
          new FormData();


        formData.append(
          "assignment",
          studentFile,
        );


        formData.append(
          "studentId",
          id,
        );


        const uploadResponse =
          await fetch(
            `${API}/api/uploads/writing-sample`,
            {
              method: "POST",
              body: formData,
            },
          );


        const uploadData =
          await uploadResponse.json();


        if (!uploadResponse.ok) {

          throw new Error(
            uploadData.error ||
              "Upload failed.",
          );
        }


        const reportId =
          uploadData.data?.report?._id;


        if (!reportId) {

          throw new Error(
            "The upload response did not include a report ID.",
          );
        }


        const analyseResponse =
          await fetch(
            `${API}/api/reports/${reportId}/analyze`,
            {
              method: "POST",
            },
          );


        const analyseData =
          await analyseResponse.json();


        if (!analyseResponse.ok) {

          throw new Error(
            analyseData.error ||
              "Analysis failed.",
          );
        }


        removeStudentFile();


        await loadDashboard();


        navigate(
          `/student-errors/${reportId}`,
        );

      } catch (error) {

        console.error(error);

        alert(error.message);

      } finally {

        setUploading(false);

      }
    };


  /* =====================================================
     PREVIEW CLEANUP
     ===================================================== */

  useEffect(() => {

    return () => {

      if (studentPreviewURL) {
        URL.revokeObjectURL(
          studentPreviewURL,
        );
      }

    };

  }, [studentPreviewURL]);


  /* =====================================================
     HISTORY FILTERS
     ===================================================== */

  const analysedHistory =
    history
      .filter(
        isAnalysedAssessment,
      )


  const visibleHistory =
    analysedHistory

      .filter((assessment) => {

        const name =
          assessmentName(
            assessment,
          )
            .trim()
            .toLowerCase();


        /* ALL */
        if (
          historyCategory ===
          "all"
        ) {
          return true;
        }


        /* REFERENCE-BASED */
        if (
          historyCategory ===
          "reference"
        ) {
          return Boolean(
            assessment.answerKey,
          );
        }


        /* FREE-FORM */
        if (
          historyCategory ===
          "free-form"
        ) {
          return !assessment.answerKey;
        }


        /* GENERIC WRITING
          Example: Writing 16127
        */
        if (
          historyCategory ===
          "writing"
        ) {
          return name.startsWith(
            "writing"
          );
        }


        /* EDIT & DIAGRAM */
        if (
          historyCategory ===
          "edit-diagram"
        ) {
          return (
            name.startsWith("edit") ||
            name.startsWith("diagram") ||
            name.includes("edit and diagram") ||
            name.includes("edit & diagram")
          );
        }


        /* NARRATIVE */
        if (
          historyCategory ===
          "narrative"
        ) {
          return name.startsWith(
            "narrative"
          );
        }


        /* EXPOSITORY */
        if (
          historyCategory ===
          "expository"
        ) {
          return (
            name.startsWith(
              "expository"
            ) ||
            name.startsWith(
              "exposition"
            )
          );
        }


        /* PERSUASIVE */
        if (
          historyCategory ===
          "persuasive"
        ) {
          return name.startsWith(
            "persuasive"
          );
        }


        return true;
      })


      .filter((assessment) => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {
          return true;
        }


        return [
          assessmentName(
            assessment,
          ),

          writingType(
            assessment,
          ),

          assessment.errorType,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );
      })


      .sort((left, right) => {

        if (
          sortOrder ===
          "highest-risk"
        ) {
          return (
            (right.summary
              ?.errorCount ||
              0) -
            (left.summary
              ?.errorCount ||
              0)
          );
        }


        const leftDate =
          new Date(
            left.createdAt ||
              left.analysedAt ||
              0,
          ).getTime();


        const rightDate =
          new Date(
            right.createdAt ||
              right.analysedAt ||
              0,
          ).getTime();


        return sortOrder ===
          "oldest"
          ? leftDate -
              rightDate
          : rightDate -
              leftDate;
      });


  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="eo-page ea-page">

      <TeacherSidebar
        studentId={id}
      />


      <main className="eo-main ea-main">

        <TeacherTopbar
          studentSearch={
            studentSearch
          }
          setStudentSearch={
            setStudentSearch
          }
          studentSearching={
            studentSearching
          }
          onStudentSearch={
            openStudentDashboard
          }
        />


        <section className="page-content ea-content">


          {/* STUDENT PROFILE */}

          <section className="eo-profile-card ea-profile-card">

            <div className="eo-student-icon">
              <UserRound size={29} />
            </div>


            <div className="eo-profile-info">

              <h1>
                {overview?.student
                  ?.studentId ||
                  id}
              </h1>

            </div>


            <div className="eo-profile-meta">

              <div className="eo-meta-item">

                <div className="eo-meta-icon">
                  <CalendarDays
                    size={17}
                  />
                </div>


                <div>

                  <span className="eo-meta-label">
                    Last Assignment
                  </span>


                  <span className="eo-meta-value">

                    {overview?.lastAssessmentDate
                      ? formatAssessmentDate(
                          overview.lastAssessmentDate,
                        )
                      : "No assessment yet"}

                  </span>

                </div>

              </div>


              <div className="eo-meta-item">

                <div className="eo-meta-icon">
                  <GraduationCap
                    size={17}
                  />
                </div>


                <div>

                  <span className="eo-meta-label">
                    Assigned Band
                  </span>


                  <span className="eo-meta-value eo-band">
                    {currentBand}
                  </span>

                </div>

              </div>


              <div className="eo-meta-item">

                <div className="eo-meta-icon">
                  <BriefcaseBusiness
                    size={17}
                  />
                </div>


                <div>

                  <span className="eo-meta-label">
                    Centre
                  </span>


                  <span className="eo-meta-value">
                    {studentCentre}
                  </span>

                </div>

              </div>

            </div>

          </section>


          {/* PAGE HEADING */}

          <div className="ea-page-heading analysis-page-heading">

            <div>

              <span className="ea-eyebrow">
                FREE-FORM ANALYSIS
              </span>


              <h1 className="page-title analysis-upload-title">
                Upload Assignment
              </h1>


              <p className="page-subtitle">
                Upload the student submission for error pattern analysis.
              </p>

            </div>


            <button
              type="button"
              className="ea-back-options analysis-back-options"
              onClick={() =>
                navigate(
                  `/error-options/${encodeURIComponent(
                    id,
                  )}`,
                )
              }
            >
              <ArrowLeft size={16} />
              Back
            </button>

          </div>


          <section className="analysis-upload-section">


            {/* UPLOAD CARD */}

            <div className="sa-upload-card">

              <div className="sa-upload-grid ed-single-upload-grid">

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
                    studentFile
                      ? undefined
                      : handleStudentBrowse
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
                      previewURL={
                        studentPreviewURL
                      }
                      onPreview={
                        previewStudentFile
                      }
                      onRemove={
                        removeStudentFile
                      }
                    />

                  ) : (

                    <>
                      <Upload
                        size={48}
                        className="sa-student-upload-icon"
                      />


                      <h3>
                        Import Student Submission
                      </h3>


                      <p>
                        Drag & Drop or click to browse
                      </p>


                      <small>
                        PDF, PNG, JPG, JPEG, TIFF, BMP
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
                    data-cy="epa-file-input"
                    hidden
                    accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
                    onChange={
                      handleStudentFileChange
                    }
                  />

                </div>

              </div>


              {/* ANALYSE BUTTON */}

              <button
                className="analyse-button"
                disabled={
                  !studentFile ||
                  uploading
                }
                data-cy="epa-analyse-button" 
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

                    Analyze Assignment
                  </>
                )}

              </button>

            </div>


            {/* HISTORY */}

            {analysedHistory.length >
              0 && (

              <>

                <div className="history-header">

                  <div>

                    <p className="history-eyebrow">
                      RECENT SUBMISSIONS
                    </p>


                    <h2>
                      Assignment History
                    </h2>


                    <p className="history-intro">
                      Review assignment details,
                      error patterns and analysis status.
                    </p>

                  </div>


                  <span className="history-count">

                    {visibleHistory.length}{" "}

                    {visibleHistory.length ===
                    1
                      ? "record"
                      : "records"}

                  </span>

                </div>


                {/* FILTERS */}

                <div className="toolbar history-toolbar">

                  <div className="assessment-search">

                    <Search size={18} />


                    <input
                      placeholder="Search uploaded assignment..."
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value,
                        )
                      }
                    />

                  </div>


                  <select
                    value={historyCategory}
                    onChange={(event) =>
                      setHistoryCategory(
                        event.target.value,
                      )
                    }
                  >
                    <option value="all">
                      Assignment: All
                    </option>

                    <option value="reference">
                      Reference-Based
                    </option>

                    <option value="free-form">
                      Free-Form
                    </option>

                    <option value="edit-diagram">
                      Edit & Diagram
                    </option>

                    <option value="writing">
                      Writing
                    </option>

                    <option value="narrative">
                      Narrative Writing
                    </option>

                    <option value="expository">
                      Expository Writing
                    </option>

                    <option value="persuasive">
                      Persuasive Writing
                    </option>
                  </select>


                  <select
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(
                        event.target.value,
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


                {/* CARDS */}

                <div className="history-grid">

                  {visibleHistory.length ===
                  0 ? (

                    <div className="history-empty-state">

                      <FileCheck2
                        size={24}
                      />


                      <div>

                        <strong>
                          No matching assignments
                        </strong>


                        <p>
                          There are no analysed records
                          for the selected assignment type.
                        </p>

                      </div>

                    </div>

                  ) : (

                    visibleHistory.map(
                      (assessment) => {

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


                        return (

                          <article
                            className="history-card"
                            key={
                              assessment._id
                            }
                          >

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
                                  Detected errors
                                </span>


                                <strong>
                                  {errorCount}
                                </strong>

                              </div>


                              <div className="history-pattern">

                                <span>
                                  Dominant pattern
                                </span>


                                <strong>

                                  <AlertTriangle
                                    size={15}
                                  />


                                  {dominantPattern}

                                </strong>

                              </div>

                            </div>


                            <div className="history-summary-block">

                              <span>
                                AI educator summary
                              </span>


                              <p>
                                {assessment.aiSummary}
                              </p>

                            </div>


                            <div className="history-card-footer">

                              <div className="history-card-actions">

                                <Link
                                  to={`/student-errors/${assessment._id}`}
                                  className="analysis-button"
                                >
                                  <BarChart3
                                    size={17}
                                  />

                                  View analysis
                                </Link>


                                <Link
                                  to={`/error-report/${assessment._id}`}
                                  className="report-button"
                                >
                                  <Eye
                                    size={17}
                                  />

                                  View report

                                  <ArrowRight
                                    size={16}
                                  />
                                </Link>

                              </div>

                            </div>

                          </article>
                        );
                      },
                    )

                  )}

                </div>

              </>

            )}

          </section>

        </section>

      </main>

    </div>
  );
}