import { useEffect, useState } from "react";

import {
	Link,
	useNavigate,
	useParams,
} from "react-router-dom";

import "../css/Landing.css";
import "../css/ErrorOptions.css";
import "../css/StudentError.css";
import "../css/ErrorAnswerAnalysis.css";

import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	Bell,
	Settings,
	Search,
	FileBarChart2,
	FileCheck2,
	BriefcaseBusiness,
	UserRound,
	CalendarDays,
	GraduationCap,
	Sheet,
	ArrowLeft,
} from "lucide-react";


const API =
	import.meta.env.VITE_ERROR_API;

const PMS_API =
	import.meta.env.VITE_PMS_API;

const SHEET_URL =
	import.meta.env.VITE_GOOGLE_SHEET_URL;


/* =========================================================
   ERROR COLORS
   KEEP MULTICOLOURED FOR EASY DISTINCTION
   ========================================================= */

const errorColors = {
	visual: "#ef4444",
	phonological: "#a855f7",
	grammar: "#22c55e",
	tense: "#d97706",
	capitalisation: "#3b82f6",
};


/* =========================================================
   SHARED DAS SIDEBAR
   SAME AS ERRORANSWER
   ========================================================= */

function TeacherSidebar({ studentId }) {
	const encodedId =
		studentId
			? encodeURIComponent(
					studentId
				)
			: "";

	return (
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
   SHARED TOPBAR
   SAME AS ERRORANSWER
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
						Reference-Based Analysis
					</span>

				</div>

			</div>


			<div className="eo-topbar-right">

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
						<Search size={18} />
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
   DONUT CHART
   ========================================================= */

function DonutChart({ data }) {
	const total = data.reduce(
		(sum, item) =>
			sum + item.count,
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
		(acc, item, index) => {

			if (
				!item.count ||
				total === 0
			) {
				return acc;
			}


			const dash =
				(item.count / total) *
				circ;

			const gap =
				circ - dash;


			const circle = (
				<circle
					key={index}
					cx={cx}
					cy={cy}
					r={r}
					fill="none"
					stroke={
						item.color
					}
					strokeWidth={
						stroke
					}
					strokeDasharray={`${dash} ${gap}`}
					strokeDashoffset={
						-acc.offset
					}
					onMouseEnter={() =>
						setHoveredItem(
							item
						)
					}
					onMouseLeave={() =>
						setHoveredItem(
							null
						)
					}
					style={{
						transform:
							"rotate(-90deg)",

						transformOrigin:
							"80px 80px",

						cursor:
							"pointer",

						opacity:
							hoveredItem &&
							hoveredItem.key !==
								item.key
								? 0.4
								: 1,

						transition:
							"opacity 160ms ease",
					}}
				>
					<title>
						{`${item.label}: ${item.count}`}
					</title>
				</circle>
			);


			return {
				offset:
					acc.offset +
					dash,

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
				fill="#1f2933"
			>
				{
					hoveredItem?.count ??
					total
				}
			</text>


			<text
				x={cx}
				y={cy + 17}
				textAnchor="middle"
				fontSize="8"
				fill="#667085"
			>
				{
					hoveredItem?.label ||
					"Total errors"
				}
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
   MAIN
   ========================================================= */

export default function ErrorAnswerAnalysis() {
	const { reportId } =
		useParams();

	const navigate =
		useNavigate();


	const [report, setReport] =
		useState(null);

	const [overview, setOverview] =
		useState(null);

	const [loading, setLoading] =
		useState(true);

	const [error, setError] =
		useState(null);

	const [
		studentSearch,
		setStudentSearch,
	] = useState("");

	const [
		studentSearching,
		setStudentSearching,
	] = useState(false);

	const [
		chartView,
		setChartView,
	] = useState("donut");


	/* =====================================================
	   SEARCH STUDENT
	   SAME FUNCTIONALITY AS BEFORE
	   ===================================================== */

	const openStudentDashboard =
		async (event) => {

			event.preventDefault();

			const query =
				studentSearch.trim();

			if (!query) return;


			setStudentSearching(
				true
			);


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
					profiles.length ===
						0 &&
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


					if (
						!pmsResponse.ok
					) {
						throw new Error(
							pmsData.message ||
								"Unable to search student directory."
						);
					}


					profiles =
						Array.isArray(
							pmsData
						)
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
								.filter(
									Boolean
								)
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
	   LOAD REPORT
	   ===================================================== */

	useEffect(() => {

		const loadReport =
			async () => {

				try {

					setLoading(
						true
					);

					setError(
						null
					);


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


					setReport(
						json.data
					);

				} catch (error) {

					console.error(
						"Unable to load answer analysis:",
						error
					);


					setError(
						error.message
					);

					setReport(
						null
					);

				} finally {

					setLoading(
						false
					);

				}
			};


		loadReport();

	}, [reportId]);


	/* =====================================================
	   LOAD STUDENT OVERVIEW
	   READ ONLY
	   ===================================================== */

	useEffect(() => {

		const studentId =
			report?.student?.studentId;


		if (
			!studentId ||
			!PMS_API
		) {
			return;
		}


		const controller =
			new AbortController();


		const loadOverview =
			async () => {

				try {

					const response =
						await fetch(
							`${PMS_API}/api/progress/${encodeURIComponent(
								studentId
							)}/overview`,
							{
								signal:
									controller.signal,
							}
						);


					const data =
						await response.json();


					if (
						response.ok &&
						!data.message
					) {
						setOverview(
							data
						);
					}

				} catch (error) {

					if (
						error.name !==
						"AbortError"
					) {
						console.warn(
							"Unable to load student overview:",
							error
						);
					}

				}
			};


		loadOverview();


		return () =>
			controller.abort();

	}, [report]);


	/* =====================================================
	   LOADING / ERROR
	   ===================================================== */

	if (loading) {
		return (
			<div className="eaa-state">

				<div className="eaa-spinner" />

				<h2>
					Loading analysis...
				</h2>

			</div>
		);
	}


	if (
		error ||
		!report
	) {
		return (
			<div className="eaa-state">

				<h2>
					{
						error ||
						"Report not found."
					}
				</h2>

			</div>
		);
	}


	/* =====================================================
	   REPORT VALUES
	   ===================================================== */

	const donutData =
		report.chartData ??
		[];


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


	const expectedAnswers =
		Array.isArray(
			answerKey?.answers
		)
			? answerKey.answers
			: [];


	const studentId =
		report.student
			?.studentId ||
		"Student";


	const studentName =
		[
			report.student
				?.firstName,

			report.student
				?.lastName,
		]
			.filter(Boolean)
			.join(" ") ||

		report.student?.name ||
		"";


	const currentBand =
		overview?.latestNewBand ||
		overview?.currentBandLevel ||
		"—";


	const assignedTeacher =
		overview?.student
			?.teacherId ||
		"—";


	const assessmentDate =
		report.createdAt
			? new Date(
					report.createdAt
				).toLocaleDateString(
					"en-SG",
					{
						day: "numeric",
						month: "short",
						year: "numeric",
					}
				)
			: "—";


	/* =====================================================
	   PAGE
	   ===================================================== */

	return (
		<div className="eo-page eaa-page">

			<TeacherSidebar
				studentId={
					studentId
				}
			/>


			<main className="eo-main eaa-main">

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


				<div className="eaa-content">

					{/* =====================================
					    STUDENT INFORMATION
					    ===================================== */}

					<section className="eo-profile-card eaa-profile-card">

						<div className="eo-student-icon">

							<UserRound
								size={29}
							/>

						</div>


						<div className="eo-profile-info">

	<h1>
		{studentId}
	</h1>

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

							<div className="eo-meta-item">

								<div className="eo-meta-icon">

									<CalendarDays
										size={17}
									/>

								</div>


								<div>

									<span className="eo-meta-label">
										Assessment Date
									</span>

									<span className="eo-meta-value">
										{
											assessmentDate
										}
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
										{
											currentBand
										}
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
										Assigned Teacher
									</span>

									<span className="eo-meta-value">
										{
											assignedTeacher
										}
									</span>

								</div>

							</div>

						</div>

					</section>


					{/* =====================================
					    PAGE HEADING
					    ===================================== */}

					<div className="eaa-page-heading">

						<div>
							<h1>
								Assessment Analysis
							</h1>

							<p>
								Compare the student
								submission with the answer
								key and review detected
								error patterns.
							</p>

						</div>


						<div className="eaa-heading-actions">

							<button
								type="button"
								className="eaa-back-btn"
								onClick={() =>
									navigate(
										`/error-answer/${encodeURIComponent(
											studentId
										)}`
									)
								}
							>
								<ArrowLeft
									size={16}
								/>

								Back to Upload
							</button>


							<button
								type="button"
								className="eaa-report-btn"
								onClick={() =>
									navigate(
										`/answer-report/${reportId}`
									)
								}
							>
								<FileBarChart2
									size={17}
								/>

								Generate Report
							</button>

						</div>

					</div>

					{/* =====================================
					    EXPECTED ANSWERS
					    ===================================== */}

					{expectedAnswers.length >
						0 && (

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
										Extracted from the
										uploaded answer key.
									</p>

								</div>


								<span className="eaa-answer-count">

									{
										expectedAnswers.length
									}{" "}

									{
										expectedAnswers.length ===
										1
											? "answer"
											: "answers"
									}

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
											key={
												index
											}
										>

											<div className="eaa-answer-number">
												{
													index +
													1
												}
											</div>


											<div className="eaa-answer-content">

												<span>
													Expected Answer
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


					{/* =====================================
					    ANALYSED SAMPLE + CHART
					    ===================================== */}

					<div className="sea-grid">

						<div className="sea-card sea-writing eaa-analysis-card">

							<div className="sea-card-header">

								<h3>
									Analysed Writing Sample
								</h3>

								<span className="sea-date">
									Dated:{" "}
									{
										assessmentDate
									}
								</span>

							</div>


							<div className="sea-text-block">

								<p>
									{
										studentText
									}
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
											key={
												type
											}
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
												.charAt(
													0
												)
												.toUpperCase() +
												type.slice(
													1
												)}{" "}
											Errors

										</span>

									)
								)}

							</div>

						</div>


						{/* CHART */}

						<div className="sea-card sea-donut eaa-analysis-card">

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
									data={
										donutData
									}
								/>

							)}


							<div className="sea-donut-legend">

								{donutData.map(
									(
										item,
										index
									) => (

										<div
											key={
												index
											}
											className="sea-donut-item"
										>

											<span
												className="sea-donut-dot"
												style={{
													background:
														item.color,
												}}
											/>

											<span>
												{
													item.label
												}
											</span>

										</div>

									)
								)}

							</div>

						</div>

					</div>


					{/* =====================================
					    AI PATTERN ANALYSIS
					    ===================================== */}

					{report
						.interventionRecommendation && (

						<div className="sea-ai-card eaa-ai-card">

							<div className="eaa-ai-heading">

								<span>
									ANALYSIS SUMMARY
								</span>

								<h3>
									AI Pattern Analysis
								</h3>

							</div>


							<p className="eaa-ai-overview">
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
												className="eaa-intervention"
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


												{item
													.activities
													?.length >
													0 && (

													<p>
														Activities:{" "}
														{item.activities.join(
															", "
														)}
													</p>

												)}


												{item.frequency && (

													<p>
														Frequency:{" "}
														{
															item.frequency
														}
													</p>

												)}

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