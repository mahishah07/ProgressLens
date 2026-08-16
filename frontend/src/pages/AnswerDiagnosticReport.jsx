import { useEffect, useState } from "react";

import {
	Link,
	useNavigate,
	useParams,
} from "react-router-dom";

import "../css/Landing.css";
import "../css/ErrorOptions.css";
import "../css/DiagnosticReport.css";
import "../css/AnswerDiagnosticReport.css";

import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	FileText,
	Bell,
	Settings,
	Search,
	Download,
	UserRound,
	BriefcaseBusiness,
	CalendarDays,
	GraduationCap,
	ArrowLeft,
	KeyRound,
	FileCheck2,
	Sparkles,
	ChartNoAxesCombined,
	BrainCircuit,
} from "lucide-react";


const ERROR_API =
	import.meta.env.VITE_ERROR_API;

const PMS_API =
	import.meta.env.VITE_PMS_API;


/* =========================================================
   DATE FORMATTER
   ========================================================= */

function formatDate(date) {
	if (!date) return "—";

	const parsed = new Date(date);

	if (Number.isNaN(parsed.getTime())) {
		return "—";
	}

	return parsed.toLocaleDateString(
		"en-SG",
		{
			day: "2-digit",
			month: "short",
			year: "numeric",
		}
	);
}


/* =========================================================
   SHARED DAS SIDEBAR
   ========================================================= */

function TeacherSidebar({
	studentId,
}) {
	const encodedId =
		studentId
			? encodeURIComponent(
					studentId
				)
			: "";

	return (
		<aside className="sidebar">

			{/* LOGO */}

			<div className="logo-section">

				<div className="logo-circle">
					DAS
				</div>

				<div>
					<h2>
						DAS Teacher
					</h2>

					<p>
						Educational Professional
					</p>
				</div>

			</div>


			{/* NAVIGATION */}

			<nav>

				<Link to="/">
					<LayoutDashboard
						size={20}
					/>

					<span>
						Dashboard
					</span>
				</Link>


				{studentId && (
					<Link
						to={`/student/${encodedId}?view=dashboard`}
					>
						<TrendingUp
							size={20}
						/>

						<span>
							Progress Monitoring
						</span>
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
								className="eo-nav-subitem active"
							>
								<FileCheck2
									size={18}
								/>

								<span>
									Reference-Based Analysis
								</span>
							</Link>


							<Link
								to={`/error-dashboard/${encodedId}`}
								className="eo-nav-subitem"
							>
								<BarChart3
									size={19}
								/>

								<span>
									Free-Form Analysis
								</span>
							</Link>

						</>
					)}

				</div>


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
	);
}


/* =========================================================
   SHARED DAS NAVBAR
   ========================================================= */

function TeacherTopbar({
	studentSearch,
	setStudentSearch,
	studentSearching,
	onStudentSearch,
}) {
	return (
		<header className="topbar eo-main-topbar">

			{/* BRAND */}

			<div className="topbar-brand">

				<div>

					<h2>
						DAS Assessment Portal
					</h2>

					<span className="topbar-context">
						Reference-Based Analysis
					</span>

				</div>

			</div>


			{/* RIGHT SIDE */}

			<div className="eo-topbar-right">

				{/* SEARCH */}

				<form
					className="eo-navbar-search"
					onSubmit={
						onStudentSearch
					}
				>

					<button
						type="submit"
						aria-label="Search student"
						disabled={
							studentSearching
						}
					>
						<Search
							size={18}
						/>
					</button>


					<input
						type="text"
						value={
							studentSearch
						}
						onChange={(
							event
						) =>
							setStudentSearch(
								event.target
									.value
							)
						}
						placeholder={
							studentSearching
								? "Searching..."
								: "Search student by name or ID..."
						}
						disabled={
							studentSearching
						}
					/>

				</form>


				{/* TEACHER */}

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
   MAIN COMPONENT
   ========================================================= */

export default function AnswerDiagnosticReport() {
	const { reportId } =
		useParams();

	const navigate =
		useNavigate();


	/* =====================================================
	   STATE
	   ===================================================== */

	const [report, setReport] =
		useState(null);

	const [student, setStudent] =
		useState(null);

	const [loading, setLoading] =
		useState(true);

	const [error, setError] =
		useState("");


	const [
		studentSearch,
		setStudentSearch,
	] = useState("");

	const [
		studentSearching,
		setStudentSearching,
	] = useState(false);


	/* =====================================================
	   LOAD REPORT + PMS STUDENT DATA

	   EXISTING BACKEND LOGIC
	   ===================================================== */

	useEffect(() => {

		async function loadReport() {

			try {

				setLoading(true);

				setError("");


				/* ==========================================
				   1. ERROR ANALYSIS REPORT
				   ========================================== */

				if (!ERROR_API) {
					throw new Error(
						"Error Analyser API is not configured."
					);
				}


				const reportResponse =
					await fetch(
						`${ERROR_API}/reports/${reportId}`
					);


				const reportJson =
					await reportResponse.json();


				if (
					!reportResponse.ok ||
					!reportJson.success
				) {
					throw new Error(
						reportJson.error ||
							"Unable to load diagnostic report."
					);
				}


				const reportData =
					reportJson.data;


				setReport(
					reportData
				);


				/* ==========================================
				   2. STUDENT ID FROM REPORT
				   ========================================== */

				const studentId =
					reportData
						?.student
						?.studentId;


				if (!studentId) {
					throw new Error(
						"Student ID is missing from this diagnostic report."
					);
				}


				/* ==========================================
				   3. PMS STUDENT PROFILE
				   ========================================== */

				if (!PMS_API) {
					throw new Error(
						"PMS API is not configured."
					);
				}


				const studentResponse =
					await fetch(
						`${PMS_API}/api/students/${encodeURIComponent(
							studentId
						)}`
					);


				if (!studentResponse.ok) {

					const studentJson =
						await studentResponse
							.json()
							.catch(
								() => ({})
							);


					throw new Error(
						studentJson.message ||
							"Unable to load student profile."
					);
				}


				const studentData =
					await studentResponse.json();


				setStudent(
					studentData
				);

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
	   STUDENT SEARCH
	   SAME BEHAVIOUR AS ERRORANSWER
	   ===================================================== */

	const openStudentDashboard =
		async (event) => {

			event.preventDefault();


			const query =
				studentSearch.trim();


			if (!query) {
				return;
			}


			setStudentSearching(
				true
			);


			try {

				let profiles = [];


				/* ==========================================
				   SEARCH ERROR ANALYSER STUDENTS
				   ========================================== */

				if (ERROR_API) {

					const response =
						await fetch(
							`${ERROR_API}/students?q=${encodeURIComponent(
								query
							)}`
						);


					const data =
						await response.json();


					if (response.ok) {

						profiles =
							data?.students ||
							data?.data ||
							[];

					}
				}


				/* ==========================================
				   PMS FALLBACK
				   ========================================== */

				if (
					profiles.length ===
						0 &&
					PMS_API
				) {

					const response =
						await fetch(
							`${PMS_API}/api/progress/search?studentId=${encodeURIComponent(
								query
							)}`
						);


					const data =
						await response.json();


					if (!response.ok) {
						throw new Error(
							data.message ||
								"Unable to search the student directory."
						);
					}


					profiles =
						Array.isArray(
							data
						)
							? data
							: [];

				}


				/* ==========================================
				   BEST MATCH
				   ========================================== */

				const normalised =
					query.toLowerCase();


				const profile =
					profiles.find(
						(item) => {

							const fullName =
								[
									item.firstName,
									item.lastName,
								]
									.filter(
										Boolean
									)
									.join(" ")
									.toLowerCase();


							return (
								item.studentId
									?.toLowerCase() ===
									normalised ||

								item.name
									?.toLowerCase() ===
									normalised ||

								fullName ===
									normalised
							);

						}
					) ||
					profiles[0];


				if (
					!profile?.studentId
				) {

					alert(
						`No student found for “${query}”.`
					);

					return;
				}


				setStudentSearch("");


				navigate(
					`/error-options/${encodeURIComponent(
						profile.studentId
					)}`
				);

			} catch (error) {

				alert(
					error.message
				);

			} finally {

				setStudentSearching(
					false
				);

			}
		};


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
						Retrieving the student's
						assessment and answer key...
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
		report.writingSample ||
		{};


	const answerKey =
		report.answerKey ||
		{};


	const recommendation =
		report.interventionRecommendation ||
		{};


	const assessmentDate =
		report.analysedAt ||
		report.createdAt ||
		writingSample.createdAt;


	const studentText =
		writingSample.cleanedText ||
		writingSample.handwrittenText ||
		writingSample.ocrText ||
		"No student response text available.";


	const expectedAnswers =
		Array.isArray(
			answerKey.answers
		)
			? answerKey.answers
			: [];

  
  const chartData =
	Array.isArray(report.chartData)
		? report.chartData
		: [];

	const studentId =
		student.studentId ||
		report.student?.studentId ||
		"";


	/* =====================================================
	   PAGE
	   ===================================================== */

	return (
		<div className="eo-page adr-page">

			{/* =============================================
			    SIDEBAR
			    ============================================= */}

			<TeacherSidebar
				studentId={
					studentId
				}
			/>


			{/* =============================================
			    MAIN
			    ============================================= */}

			<main className="eo-main adr-main">

				{/* NAVBAR */}

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


				<div className="adr-page-content">

					{/* =====================================
					    STUDENT INFORMATION
					    SAME STYLE AS OTHER PAGES
					    ===================================== */}

					<section className="eo-profile-card adr-profile-card">

						<div className="eo-student-icon">

							<UserRound
								size={29}
							/>

						</div>


						<div className="eo-profile-info">

							<h1>
								{
									studentId
								}
							</h1>

						</div>


						<div className="eo-profile-meta">

							{/* ASSESSMENT DATE */}

							<div className="eo-meta-item">

								<div className="eo-meta-icon">

									<CalendarDays
										size={17}
									/>

								</div>


								<div>

									<span className="eo-meta-label">
										Last Assessment
									</span>

									<span className="eo-meta-value">
										{formatDate(
											assessmentDate
										)}
									</span>

								</div>

							</div>


							{/* BAND */}

							<div className="eo-meta-item">

								<div className="eo-meta-icon">

									<GraduationCap
										size={17}
									/>

								</div>


								<div>

									<span className="eo-meta-label">
										Band Level
									</span>

									<span className="eo-meta-value eo-band">
										{student.summaryBand ||
											"—"}
									</span>

								</div>

							</div>


							{/* CENTRE */}

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
										{student.centreId ||
											"—"}
									</span>

								</div>

							</div>

						</div>

					</section>


					{/* =====================================
					    PAGE HEADER + BUTTONS
					    ===================================== */}

					<div className="adr-page-actions">

						<div>

							<span className="adr-page-eyebrow">
								REFERENCE-BASED REPORT
							</span>


							<h1>
								Diagnostic Report
							</h1>


							<p>
								Review the student submission,
								answer-key breakdown and
								recommended interventions.
							</p>

						</div>


						<div className="adr-action-buttons">

							{/* BACK */}

							<button
								type="button"
								className="adr-back-button"
								onClick={() =>
									navigate(
										`/answer-analysis/${reportId}`
									)
								}
							>

								<ArrowLeft
									size={16}
								/>

								Back

							</button>


							{/* PDF */}

							<button
								type="button"
								className="adr-download-button"
								onClick={() =>
									window.print()
								}
							>

								<Download
									size={16}
								/>

								Download PDF

							</button>

						</div>

					</div>


					{/* =====================================
					    REPORT DOCUMENT
					    ===================================== */}

					<div className="dr-doc-wrapper">

						<div className="dr-doc adr-doc">

							{/* ===============================
							    REPORT HEADER
							    =============================== */}

							<div className="dr-doc-header">

								<div>

									<div className="adr-report-type">

										<KeyRound
											size={14}
										/>

										ANSWER-KEY ASSIGNMENT

									</div>


									<h1>
										Edit & Diagram Diagnostic Report
									</h1>


									<p className="dr-org">
										Dyslexia Association of Singapore
										(DAS)
									</p>

								</div>


								<div className="dr-report-meta">

									<p className="dr-meta-label">

										REPORT ID:{" "}

										<strong>
											#
											{String(
												report._id
											)
												.slice(
													-8
												)
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
							{/* ===============================
							    STUDENT SUBMISSION
							    =============================== */}

							<div className="dr-section-heading">

								<FileText
									size={18}
								/>

								<h2 className="dr-section-title">
									Student Submission
								</h2>

							</div>


							<p className="adr-section-description">
								Extracted text from the
								submitted student assessment.
							</p>


							<div className="adr-comparison-grid adr-single-submission">

								<div className="adr-comparison-card adr-student-card">

									<div className="adr-comparison-header">

										<div className="adr-header-title">

											<FileText
												size={17}
											/>

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

										{
											studentText
										}

									</div>

								</div>

							</div>


							{/* ===============================
							    ANSWER KEY BREAKDOWN
							    =============================== */}

							{expectedAnswers.length >
								0 && (

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
												Individual responses
												extracted from the
												uploaded marking
												reference.
											</p>

										</div>


										<span className="adr-answer-count">

											{
												expectedAnswers.length
											}{" "}

											{expectedAnswers.length ===
											1
												? "response"
												: "responses"}

										</span>

									</div>


									<div className="adr-answer-list">

										{expectedAnswers.map(
											(
												answer,
												index
											) => (

												<div
													className="adr-answer-item"
													key={
														index
													}
												>

													<div className="adr-answer-number">
														{index +
															1}
													</div>


													<div>

														<span>
															EXPECTED RESPONSE
														</span>


														<p>
															{
																answer
															}
														</p>

													</div>

												</div>

											)
										)}

									</div>

								</div>

							)}


							<hr className="dr-divider" />

              {/* =====================================
    ANALYSIS BREAKDOWN
    ===================================== */}

<div className="adr-analysis-section">

	<div className="adr-analysis-heading">

		<span className="adr-small-label">
			ASSESSMENT ANALYSIS
		</span>

		<h2>
			Error Pattern Analysis
		</h2>

		<p>
			Summary of detected error categories and
			the main writing patterns identified in
			this assessment.
		</p>

	</div>


	<div className="adr-analysis-grid">

		{/* =================================
		    ERROR FREQUENCY CHART
		    ================================= */}

		<div className="adr-analysis-panel adr-chart-panel">

			<div className="adr-analysis-panel-header">

				<div className="adr-analysis-icon adr-chart-icon">
					<ChartNoAxesCombined size={19} />
				</div>

				<div>
					<span>
						ERROR DISTRIBUTION
					</span>

					<h3>
						Error Frequency Analysis
					</h3>
				</div>

			</div>


			{chartData.length > 0 ? (

				<div className="adr-report-chart">

					{chartData.map((item, index) => {

						const maxCount = Math.max(
							1,
							...chartData.map(
								(entry) =>
									entry.count || 0
							)
						);


						const percentage =
							((item.count || 0) /
								maxCount) *
							100;


						return (
							<div
								className="adr-chart-row"
								key={
									item.key ||
									item.label ||
									index
								}
							>

								<div className="adr-chart-row-label">

									<div>

										<span
											className="adr-chart-dot"
											style={{
												background:
													item.color,
											}}
										/>

										<span>
											{item.label}
										</span>

									</div>


									<strong>
										{item.count || 0}
									</strong>

								</div>


								<div className="adr-chart-track">

									<div
										className="adr-chart-fill"
										style={{
											width: `${percentage}%`,
											background:
												item.color,
										}}
									/>

								</div>

							</div>
						);
					})}

				</div>

			) : (

				<p className="adr-analysis-empty">
					No error-frequency data is
					available for this report.
				</p>

			)}

		</div>


		{/* =================================
		    AI WRITING ANALYSIS
		    ================================= */}

		<div className="adr-analysis-panel adr-ai-panel">

			<div className="adr-analysis-panel-header">

				<div className="adr-analysis-icon adr-ai-icon">
					<BrainCircuit size={19} />
				</div>

				<div>
					<span>
						WRITING INSIGHTS
					</span>

					<h3>
						AI Writing Analysis
					</h3>
				</div>

			</div>


			<div className="adr-ai-analysis-content">

				<div className="adr-ai-summary-block">

					<span className="adr-analysis-mini-label">
						ASSESSMENT SUMMARY
					</span>

					<p>
						{recommendation.overview ||
							"No writing analysis summary is available."}
					</p>

				</div>


				{recommendation.dominantPattern && (

					<div className="adr-ai-insight">

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

			</div>

		</div>

	</div>

</div>


<hr className="dr-divider" />


							{/* ===============================
							    TARGETED INTERVENTIONS
							    =============================== */}

							<div className="adr-interventions-card">

	<div className="adr-interventions-header">

		<div>

			<span className="adr-interventions-eyebrow">
				RECOMMENDED SUPPORT
			</span>

			<h2>
				Targeted Interventions
			</h2>

			<p>
				Recommended next steps based on the
				student's response patterns.
			</p>

		</div>


		<div className="adr-interventions-icon">

			<Sparkles size={20} />

		</div>

	</div>


	{recommendation.interventions?.length > 0 ? (

		<div className="adr-interventions-list">

			{recommendation.interventions.map(
				(item, index) => (

					<div
						key={`${item.title}-${index}`}
						className="adr-intervention-card"
					>

						<div className="adr-intervention-top">

							<div className="adr-intervention-number">
								{index + 1}
							</div>


							<div className="adr-intervention-heading">

								<h3>
									{item.title}
								</h3>

								{item.frequency && (

									<span className="adr-frequency-pill">
										{item.frequency}
									</span>

								)}

							</div>

						</div>


						<p className="adr-intervention-rationale">
							{item.rationale}
						</p>


						{item.activities?.length > 0 && (

							<div className="adr-activities-block">

								<span className="adr-activities-label">
									SUGGESTED ACTIVITIES
								</span>


								<ul>

									{item.activities.map(
										(
											activity,
											activityIndex
										) => (

											<li
												key={
													activityIndex
												}
											>
												{activity}
											</li>

										)
									)}

								</ul>

							</div>

						)}

					</div>

				)
			)}

		</div>

	) : (

		<p className="dr-empty">
			No intervention recommendations
			are available yet.
		</p>

	)}

</div>


							<hr className="dr-divider" />


							{/* ===============================
							    EDUCATOR SUMMARY
							    =============================== */}

							<div className="adr-summary-section">

								<span className="adr-small-label">
									EDUCATOR SUMMARY
								</span>


								<h2 className="dr-section-title">
									Assessment Summary
								</h2>


								<blockquote className="dr-summary">

									{recommendation.overview ||
										"No summary is available for this report."}

								</blockquote>


								{recommendation
									.educatorCaution && (

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

							</div>


							<hr className="dr-divider" />


							{/* ===============================
							    REPORT FOOTER
							    =============================== */}

							<div className="dr-report-footer">

								<div>

									<p className="dr-footer-title">
										Edit & Diagram Diagnostic Report
									</p>


									<p className="dr-sig-sub">
										Generated from the DAS
										Assessment Engine
									</p>


									{recommendation.model && (

										<p className="dr-sig-sub">

											Analysis model:{" "}

											{
												recommendation.model
											}

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
											report
												.openAiAnalysedAt ||
												report.analysedAt
										)}

									</p>

								</div>

							</div>

						</div>

					</div>

				</div>

			</main>

		</div>
	);
}