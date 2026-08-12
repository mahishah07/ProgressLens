import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./../css/Landing.css";
import "./../css/ErrorOptions.css";
import "./../css/StudentProgress.css";
import "./../css/AssessmentComparison.css";

import {
	LayoutDashboard,
	TrendingUp as TrendIcon,
	BarChart3,
	FileCheck2,
	FileText,
	Bell,
	Settings,
	ArrowLeft,
	Share2,
	Search,
	BriefcaseBusiness,
	UserRound,
	CalendarDays,
	GraduationCap,
} from "lucide-react";

import { Bar } from "react-chartjs-2";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Tooltip,
	Legend,
} from "chart.js";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Tooltip,
	Legend,
);

const API = import.meta.env.VITE_PMS_API;


/* =========================================================
   SIDEBAR
   ========================================================= */

function ProgressSidebar({ studentId }) {
	const encodedId = encodeURIComponent(studentId || "");

	return (
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

				<Link
					to={`/student/${encodedId}?view=dashboard`}
					className="sp-nav-progress active"
					aria-current="page"
				>
					<TrendIcon size={20} />
					<span>Progress Monitoring</span>
				</Link>

				<div className="eo-nav-section">
					<span className="eo-nav-heading">
						ERROR ANALYSIS
					</span>

					<Link
						to={`/error-answer/${encodedId}`}
						className="eo-nav-subitem"
					>
						<FileCheck2 size={18} />
						<span>Reference-Based Analysis</span>
					</Link>

					<Link
						to={`/error-dashboard/${encodedId}`}
						className="eo-nav-subitem"
					>
						<BarChart3 size={19} />
						<span>Free-Form Analysis</span>
					</Link>
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

function ComparisonTopbar({
	search,
	setSearch,
	searching,
	onSearch,
}) {
	return (
		<header className="topbar eo-main-topbar">
			<div className="topbar-brand">
				<div>
					<h2>DAS Assessment Portal</h2>

					<span className="topbar-context">
						Progress Monitoring
					</span>
				</div>
			</div>

			<div className="eo-topbar-right">
				<form
					className="eo-navbar-search"
					onSubmit={onSearch}
				>
					<button
						type="submit"
						aria-label="Search student"
						disabled={searching}
					>
						<Search size={18} />
					</button>

					<input
						value={search}
						onChange={(event) =>
							setSearch(event.target.value)
						}
						placeholder={
							searching
								? "Searching..."
								: "Search student by name or ID..."
						}
						disabled={searching}
					/>
				</form>

				<div className="eo-teacher-profile">
					<div className="eo-teacher-icon">
						<BriefcaseBusiness size={20} />
					</div>

					<div className="eo-teacher-copy">
						<strong>
							Educational Professional
						</strong>

						<span>DAS Teacher Portal</span>
					</div>
				</div>
			</div>
		</header>
	);
}


/* =========================================================
   LABELS
   ========================================================= */

const SKILL_LABELS = {
	pictureNaming: "Picture Naming",
	pictureDescription: "Picture Description",
	paIdentification: "PA Identification",
	phonics: "Phonics",
	wra: "Word Reading Accuracy",
	fluency: "Fluency",
	wordSpelling: "Word Spelling",
	letterFormation: "Letter Formation",
	editDiagram1: "Edit and Diagram 1",
	editDiagram2: "Edit and Diagram 2",
	editDiagram3: "Edit and Diagram 3",
	narrative: "Narrative Writing",
	exposition: "Exposition Writing",
	persuasive: "Persuasive Writing",
	listeningComp: "Listening Comprehension",
	readingComp: "Reading Comprehension",
	writtenVocab: "Written Vocab",
};


const formatDate = (value) => {
	if (!value) return "No assessment yet";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Invalid Date";
	}

	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};


/* =========================================================
   PAGE
   ========================================================= */

export default function AssessmentComparison() {
	const [searchParams] = useSearchParams();

	const studentId = searchParams.get("studentId");

	const navigate = useNavigate();

	const [data, setData] = useState(null);
	const [overview, setOverview] = useState(null);

	const [loading, setLoading] = useState(true);
	const [overviewLoading, setOverviewLoading] =
		useState(true);

	const [error, setError] = useState(null);

	const [assessmentIdA, setAssessmentIdA] =
		useState("");

	const [assessmentIdB, setAssessmentIdB] =
		useState("");

	const [studentSearch, setStudentSearch] =
		useState("");

	const [studentSearching, setStudentSearching] =
		useState(false);


	/* =====================================================
	   STUDENT SEARCH
	   ===================================================== */

	const searchStudent = async (event) => {
		event.preventDefault();

		const query = studentSearch.trim();

		if (!query) return;

		setStudentSearching(true);

		try {
			const response = await fetch(
				`${API}/api/progress/search?studentId=${encodeURIComponent(
					query,
				)}`,
			);

			const results = await response.json();

			if (!response.ok) {
				throw new Error(
					results.message ||
						"Unable to search students.",
				);
			}

			const profile =
				Array.isArray(results)
					? results[0]
					: null;

			if (!profile?.studentId) {
				throw new Error("Student not found.");
			}

			setStudentSearch("");

			navigate(
				`/student/${encodeURIComponent(
					profile.studentId,
				)}?view=dashboard`,
			);
		} catch (searchError) {
			alert(searchError.message);
		} finally {
			setStudentSearching(false);
		}
	};


	const topbar = (
		<ComparisonTopbar
			search={studentSearch}
			setSearch={setStudentSearch}
			searching={studentSearching}
			onSearch={searchStudent}
		/>
	);


	/* =====================================================
	   FETCH STUDENT OVERVIEW
	   Uses same PMS endpoint as ErrorOptions
	   ===================================================== */

	useEffect(() => {
		if (!studentId) return;

		const controller = new AbortController();

		const loadOverview = async () => {
			try {
				setOverviewLoading(true);

				const response = await fetch(
					`${API}/api/progress/${encodeURIComponent(
						studentId,
					)}/overview`,
					{
						signal: controller.signal,
					},
				);

				const overviewData =
					await response.json();

				if (
					!response.ok ||
					overviewData.message
				) {
					throw new Error(
						overviewData.message ||
							"Unable to load student information.",
					);
				}

				setOverview(overviewData);
			} catch (err) {
				if (err.name !== "AbortError") {
					console.error(
						"Unable to load student overview:",
						err,
					);
				}
			} finally {
				if (!controller.signal.aborted) {
					setOverviewLoading(false);
				}
			}
		};

		loadOverview();

		return () => controller.abort();
	}, [studentId]);


	/* =====================================================
	   LOAD COMPARISON
	   ===================================================== */

	useEffect(() => {
		if (!studentId) return;

		let isMounted = true;

		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch(
					`${API}/api/comparison/${encodeURIComponent(
						studentId,
					)}`,
				);

				const comparisonData =
					await response.json();

				if (
					!response.ok &&
					comparisonData.status !==
						"insufficient_data"
				) {
					throw new Error(
						comparisonData.message ||
							"Unable to load comparison.",
					);
				}

				if (
					comparisonData.message &&
					comparisonData.status !==
						"insufficient_data"
				) {
					throw new Error(
						comparisonData.message,
					);
				}

				if (isMounted) {
					setData(comparisonData);

					if (
						comparisonData.selectedA?._id
					) {
						setAssessmentIdA(
							comparisonData.selectedA._id,
						);
					}

					if (
						comparisonData.selectedB?._id
					) {
						setAssessmentIdB(
							comparisonData.selectedB._id,
						);
					}

					setLoading(false);
				}
			} catch (err) {
				if (isMounted) {
					setError(err.message);
					setLoading(false);
				}
			}
		};

		fetchData();

		return () => {
			isMounted = false;
		};
	}, [studentId]);


	/* =====================================================
	   RE-FETCH SELECTED COMPARISON
	   ===================================================== */

	const fetchComparison = async (idA, idB) => {
		if (
			!idA ||
			!idB ||
			idA === idB
		) {
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = await fetch(
				`${API}/api/comparison/${encodeURIComponent(
					studentId,
				)}?assessmentIdA=${encodeURIComponent(
					idA,
				)}&assessmentIdB=${encodeURIComponent(
					idB,
				)}`,
			);

			const comparisonData =
				await response.json();

			if (!response.ok) {
				throw new Error(
					comparisonData.message ||
						"Unable to compare assessments.",
				);
			}

			if (
				comparisonData.message &&
				comparisonData.status !==
					"insufficient_data"
			) {
				throw new Error(
					comparisonData.message,
				);
			}

			setData(comparisonData);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};


	const handleSelectA = (id) => {
		setAssessmentIdA(id);

		fetchComparison(
			id,
			assessmentIdB,
		);
	};


	const handleSelectB = (id) => {
		setAssessmentIdB(id);

		fetchComparison(
			assessmentIdA,
			id,
		);
	};


	/* =====================================================
	   CHART DATA
	   ===================================================== */

	const buildBarData = () => {
		if (!data?.componentComparison) {
			return {
				before: null,
				after: null,
			};
		}

		const entries = Object.entries(
			data.componentComparison,
		).slice(0, 8);

		const before = {
			labels: entries.map(
				([key]) =>
					SKILL_LABELS[key] || key,
			),

			datasets: [
				{
					label: "Earlier",

					data: entries.map(
						([, value]) =>
							value.before ?? 0,
					),

					backgroundColor: "#d1d5db",
					borderColor: "#9ca3af",
					borderWidth: 1,
					borderRadius: 4,
				},
			],
		};

		const after = {
			labels: entries.map(
				([key]) =>
					SKILL_LABELS[key] || key,
			),

			datasets: [
				{
					label: "Latest",

					data: entries.map(
						([, value]) =>
							value.after ?? 0,
					),

					backgroundColor: "#7f1d2d",
					borderColor: "#681624",
					borderWidth: 1,
					borderRadius: 4,
				},
			],
		};

		return {
			before,
			after,
		};
	};


	/* =====================================================
	   VARIANCE TABLE
	   ===================================================== */

	const buildVarianceRows = () => {
		if (!data?.componentComparison) {
			return [];
		}

		return Object.entries(
			data.componentComparison,
		).map(([key, value]) => ({
			skill:
				SKILL_LABELS[key] || key,

			before:
				value.before,

			after:
				value.after,

			beforePassed:
				value.beforePassed,

			afterPassed:
				value.afterPassed,

			change:
				value.change,

			bothTaken:
				value.bothTaken,
		}));
	};


	/* =====================================================
	   LOADING
	   ===================================================== */

	if (loading && !data) {
		return (
			<div className="ac-page eo-page sp-page">
				<ProgressSidebar
					studentId={studentId}
				/>

				<main className="ac-main">
					{topbar}

					<p className="state-msg">
						Loading comparison...
					</p>
				</main>
			</div>
		);
	}


	/* =====================================================
	   ERROR
	   ===================================================== */

	if (error) {
		return (
			<div className="ac-page eo-page sp-page">
				<ProgressSidebar
					studentId={studentId}
				/>

				<main className="ac-main">
					{topbar}

					<p className="state-msg error">
						{error}
					</p>

					<div className="ac-bottom-bar">
						<button
							className="ac-back-btn"
							onClick={() =>
								navigate(-1)
							}
						>
							<ArrowLeft size={16} />
							Go Back
						</button>
					</div>
				</main>
			</div>
		);
	}


	/* =====================================================
	   INSUFFICIENT DATA
	   ===================================================== */

	if (
		!data ||
		data.status === "insufficient_data"
	) {
		return (
			<div className="ac-page eo-page sp-page">
				<ProgressSidebar
					studentId={studentId}
				/>

				<main className="ac-main">
					{topbar}

					<p className="state-msg">
						{data?.message ||
							"At least one assessment is required to generate a comparison."}
					</p>

					<div className="ac-bottom-bar">
						<button
							className="ac-back-btn"
							onClick={() =>
								navigate(-1)
							}
						>
							<ArrowLeft size={16} />
							Go Back
						</button>
					</div>
				</main>
			</div>
		);
	}


	/* =====================================================
	   DERIVED DATA
	   ===================================================== */

	const {
		before: earlierBarData,
		after: laterBarData,
	} = buildBarData();

	const varianceRows =
		buildVarianceRows();

	const bandDir =
		data.bandChange?.direction ||
		"same";

	const bandSteps =
		data.bandChange?.steps ?? 0;

	const transitions =
		data.transitions || {
			newlyPassing: 0,
			newlyFailing: 0,
		};


	/*
	 * Keep these aligned with ErrorOptions.jsx.
	 * overview.student contains the actual student DB record.
	 */
	const profileStudentId =
		overview?.student?.studentId ||
		data?.student?.studentId ||
		studentId;

	const currentBand =
		overview?.latestNewBand ||
		overview?.currentBandLevel ||
		"—";

	/* =====================================================
	   NORMAL PAGE
	   ===================================================== */

	return (
		<div className="ac-page eo-page sp-page">
			<ProgressSidebar
				studentId={profileStudentId}
			/>

			<main className="ac-main">
				{topbar}

				{/* ========================================
				    STUDENT PROFILE
				    ======================================== */}

				<div className="ac-profile-section">
					<section className="eo-profile-card">
						<div className="eo-student-icon">
							<UserRound size={29} />
						</div>

						<div className="eo-profile-info">
							<h1>
								{profileStudentId}
							</h1>
						</div>

						<div className="eo-profile-meta">

							{/* LAST ASSESSMENT */}

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
										{overviewLoading
											? "Loading..."
											: formatDate(
													overview?.lastAssessmentDate,
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
										Assigned Band
									</span>

									<span className="eo-meta-value eo-band">
										{overviewLoading
											? "..."
											: currentBand}
									</span>
								</div>
							</div>


							{/* TEACHER */}

							<div className="eo-meta-item">
								<div className="eo-meta-icon">
									<UserRound
										size={17}
									/>
								</div>

								<div>
									<span className="eo-meta-label">
										CENTRE
									</span>

									<span className="eo-meta-value">
											{overview?.student?.centreId ||
												overview?.student?.centre ||
												"—"}
									</span>
								</div>
							</div>

						</div>
					</section>
				</div>


				{/* ========================================
				    COMPARISON HEADER
				    ======================================== */}

				<div className="ac-header">
					<div>
						<p className="ac-breadcrumb">
							Students ›{" "}
							{profileStudentId} ›{" "}
							<span>
								Comparative Analysis
							</span>
						</p>

						<h1>
							Assessment Comparison
						</h1>

						<p className="ac-subtitle">
							Detailed comparative analysis
							between{" "}
							{data.comparisonPeriod?.from}{" "}
							and{" "}
							{data.comparisonPeriod?.to}{" "}
							assessment cycles.
						</p>
					</div>

					<div className="ac-actions">
						<button
							className="ac-btn-primary"
							onClick={() =>
								navigate(
									`/progress-report?studentId=${encodeURIComponent(
										profileStudentId,
									)}`,
								)
							}
						>
							<Share2 size={16} />
							Generate Parent Report
						</button>
					</div>
				</div>


				{/* ========================================
				    ASSESSMENT SELECTORS
				    ======================================== */}

				<div className="ac-selector-bar">
					<div className="ac-selector-group">
						<label>
							Assessment A
						</label>

						<select
							value={assessmentIdA}
							onChange={(event) =>
								handleSelectA(
									event.target.value,
								)
							}
						>
							{data.assessmentHistory?.map(
								(assessment) => (
									<option
										key={
											assessment._id
										}
										value={
											assessment._id
										}
									>
										{
											assessment.semester
										}{" "}
										(
										{formatDate(
											assessment.assessmentDate,
										)}
										)
									</option>
								),
							)}
						</select>
					</div>


					<div className="ac-selector-group">
						<label>
							Assessment B
						</label>

						<select
							value={assessmentIdB}
							onChange={(event) =>
								handleSelectB(
									event.target.value,
								)
							}
						>
							{data.assessmentHistory?.map(
								(assessment) => (
									<option
										key={
											assessment._id
										}
										value={
											assessment._id
										}
									>
										{
											assessment.semester
										}{" "}
										(
										{formatDate(
											assessment.assessmentDate,
										)}
										)
									</option>
								),
							)}
						</select>
					</div>
				</div>


				{/* ========================================
				    SUMMARY
				    ======================================== */}

				<div className="ac-summary">
					<div className="ac-summary-card">
						<p className="ac-summary-label">
							BAND IMPROVEMENT
						</p>

						<h2
							className={
								bandDir === "improved"
									? "ac-positive"
									: bandDir ===
										  "declined"
										? "ac-negative"
										: ""
							}
						>
							{bandDir === "improved"
								? `+${bandSteps} Level${
										bandSteps > 1
											? "s"
											: ""
									}`
								: bandDir ===
									  "declined"
									? `-${bandSteps} Level${
											bandSteps >
											1
												? "s"
												: ""
										}`
									: "Same Level"}
						</h2>

						<p className="ac-summary-sub">
							{bandDir === "improved"
								? `Advanced from ${data.comparisonPeriod?.from}`
								: bandDir ===
									  "declined"
									? `Declined from ${data.comparisonPeriod?.from}`
									: "No band change"}
						</p>
					</div>


					<div className="ac-summary-card">
						<p className="ac-summary-label">
							PASS / FAIL TRANSITIONS
						</p>

						<h2
							className={
								transitions.newlyPassing >
								0
									? "ac-positive"
									: ""
							}
						>
							+
							{transitions.newlyPassing ||
								0}{" "}
							/ -
							{transitions.newlyFailing ||
								0}
						</h2>

						<p className="ac-summary-sub">
							Components newly passing /
							newly failing
						</p>
					</div>
				</div>


				{/* ========================================
				    CYCLES
				    ======================================== */}

				<div className="ac-cycle-bar">
					<span className="ac-cycle-tag">
						Cycle A
					</span>

					<span>
						{data.comparisonPeriod?.from}
						{" — "}
						Baseline Assessment
					</span>

					<span className="ac-cycle-tag ac-cycle-active">
						Cycle B
					</span>

					<span>
						{data.comparisonPeriod?.to}
					</span>

					<span className="ac-latest">
						Latest Results
					</span>
				</div>


				{/* ========================================
				    CHARTS
				    ======================================== */}

				<div className="ac-charts">
					<div className="ac-chart-card">
						<h3>
							Skill Breakdown — Earlier
						</h3>

						{earlierBarData ? (
							<Bar
								data={
									earlierBarData
								}
								options={{
									responsive: true,

									plugins: {
										legend: {
											display: false,
										},
									},
								}}
							/>
						) : (
							<p className="state-msg">
								No data
							</p>
						)}
					</div>


					<div className="ac-chart-card">
						<h3>
							Skill Breakdown — Latest
						</h3>

						{laterBarData ? (
							<Bar
								data={
									laterBarData
								}
								options={{
									responsive: true,

									plugins: {
										legend: {
											display: false,
										},
									},
								}}
							/>
						) : (
							<p className="state-msg">
								No data
							</p>
						)}
					</div>
				</div>


				{/* ========================================
				    OBSERVATIONS
				    ======================================== */}

				<div className="ac-observations">
					<div className="ac-obs-card">
						<h3>
							<FileText size={16} />
							Teacher Observations
						</h3>

						<blockquote>
							{data.selectedA
								?.teacherComments ||
								"No observations recorded for the earlier assessment."}
						</blockquote>

						<div className="ac-obs-tags">
							<span className="ac-tag ac-tag-red">
								Earliest:{" "}
								{
									data
										.comparisonPeriod
										?.from
								}
							</span>
						</div>
					</div>


					<div className="ac-obs-card">
						<h3>
							<FileText size={16} />
							Updated Observations
						</h3>

						<blockquote>
							{data.selectedB
								?.teacherComments ||
								"No observations recorded for the latest assessment."}
						</blockquote>

						<div className="ac-obs-tags">
							<span className="ac-tag ac-tag-green">
								Latest:{" "}
								{
									data
										.comparisonPeriod
										?.to
								}
							</span>
						</div>
					</div>
				</div>


				{/* ========================================
				    VARIANCE TABLE
				    ======================================== */}

				<div className="ac-variance-card">
					<h3>
						Data Variance Analysis
					</h3>

					<table className="ac-table">
						<thead>
							<tr>
								<th>
									ASSESSMENT MODULE
								</th>

								<th>EARLIER</th>

								<th>LATEST</th>

								<th>VARIANCE</th>
							</tr>
						</thead>

						<tbody>
							{varianceRows.map(
								(row, index) => (
									<tr key={index}>
										<td>
											<strong>
												{
													row.skill
												}
											</strong>
										</td>

										<td
											className={
												row.bothTaken
													? row.beforePassed
														? "ac-cell-pass"
														: "ac-cell-fail"
													: ""
											}
										>
											{row.before !==
												null &&
											row.before !==
												undefined
												? row.before
												: "—"}
										</td>

										<td
											className={
												row.bothTaken
													? row.afterPassed
														? "ac-cell-pass"
														: "ac-cell-fail"
													: "ac-highlight"
											}
										>
											{row.after !==
												null &&
											row.after !==
												undefined
												? row.after
												: "—"}
										</td>

										<td
											className={
												row.change >
												0
													? "ac-positive"
													: row.change <
														  0
														? "ac-negative"
														: ""
											}
										>
											{row.bothTaken &&
											row.change !==
												null &&
											row.change !==
												undefined
												? `${row.change > 0 ? "+" : ""}${row.change}%`
												: "—"}
										</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</div>


				{/* ========================================
				    BOTTOM BAR
				    ======================================== */}

				<div className="ac-bottom-bar">
					<button
						className="ac-back-btn"
						onClick={() =>
							navigate(`/student/${encodeURIComponent(profileStudentId)}?view=dashboard`)
						}
					>
						<ArrowLeft size={16} />
						Back
					</button>

					<button
						className="ac-primary-btn"
						onClick={() =>
							navigate(
								`/progress-report?studentId=${encodeURIComponent(
									profileStudentId,
								)}`,
							)
						}
					>
						<Share2 size={16} />
						Generate Parent Report
					</button>
				</div>

			</main>
		</div>
	);
}