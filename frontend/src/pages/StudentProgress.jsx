import { useState, useEffect, useCallback } from "react";
import {
	Link,
	useParams,
	useNavigate,
	useSearchParams,
} from "react-router-dom";

import "./../css/Landing.css";
import "./../css/ErrorOptions.css";
import "./../css/StudentProgress.css";
import {
	FileText,
	ArrowLeft,
	Save,
	TrendingUp as TrendIcon,
	FileBarChart,
	Sheet,
	LayoutDashboard,
	Bell,
	Settings,
	UserRound,
	CalendarDays,
	GraduationCap,
	Search,
	BriefcaseBusiness,
	BarChart3,
	FileCheck2,
} from "lucide-react";
import { Line, Radar, Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	RadialLinearScale,
	Filler,
	Tooltip,
	Legend,
} from "chart.js";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	RadialLinearScale,
	Filler,
	Tooltip,
	Legend,
);

const API = import.meta.env.VITE_PMS_API;
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;
const ERROR_API = import.meta.env.VITE_ERROR_API;

const SKILL_LABELS = {
	pictureNaming: "Picture Naming",
	pictureDescription: "Picture Description",
	paIdentification: "PA Identification",
	phonics: "Phonics",
	wra: "Word Reading Accuracy",
	fluency: "Fluency",
	wordSpelling: "Word Spelling",
	letterFormation: "Letter Formation",
	ed1: "Edit and Diagram 1",
	ed2: "Edit and Diagram 2",
	ed3: "Edit and Diagram 3",
	editDiagram1: "Edit and Diagram 1",
	editDiagram2: "Edit and Diagram 2",
	editDiagram3: "Edit and Diagram 3",
	narrative: "Narrative Writing",
	exposition: "Exposition Writing",
	persuasive: "Persuasive Writing",
	lsComprehension: "Listening Comprehension",
	rdComprehension: "Reading Comprehension",
	readingComp: "Reading Comprehension",
	listeningComp: "Listening Comprehension",
	writtenVocab: "Written Vocab",
};

function TeacherSidebar({ studentId }) {
	const encodedId = studentId ? encodeURIComponent(studentId) : "";

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

				{studentId && (
					<Link
						to={`/student/${encodedId}?view=dashboard`}
						className="sp-nav-progress"
					>
						<TrendIcon size={20} />
						<span>Progress Monitoring</span>
					</Link>
				)}

				<div className="eo-nav-section">
					<span className="eo-nav-heading">ERROR ANALYSIS</span>

					{studentId && (
						<>
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

					<span className="topbar-context">Progress Monitoring</span>
				</div>
			</div>

			<div className="eo-topbar-right">
				{/* STUDENT SEARCH */}

				<form className="eo-navbar-search" onSubmit={onStudentSearch}>
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
						onChange={(event) => setStudentSearch(event.target.value)}
						placeholder={
							studentSearching
								? "Searching..."
								: "Search student by name or ID..."
						}
						disabled={studentSearching}
					/>
				</form>

				{/* EDUCATOR */}

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
	);
}
export default function StudentProgress() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [view, setView] = useState("overview");
	const [overview, setOverview] = useState(null);
	const [dashboard, setDashboard] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [studentSearch, setStudentSearch] = useState("");
	const [studentSearching, setStudentSearching] = useState(false);
	const [selectedSkills, setSelectedSkills] = useState([]);
	const [chartType, setChartType] = useState("radar");

	const isPending =
		dashboard?.status === "assessment_pending" ||
		(dashboard &&
			Array.isArray(dashboard.assessmentHistory) &&
			dashboard.assessmentHistory.length === 0);

	useEffect(() => {
		if (!id) return;
		const controller = new AbortController();

		const loadOverview = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(`${API}/api/progress/${id}/overview`, {
					signal: controller.signal,
				});
				const data = await response.json();
				if (data.message) throw new Error(data.message);
				setOverview(data);
			} catch (err) {
				if (err.name !== "AbortError") {
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

	const openStudentDashboard = async (event) => {
		event.preventDefault();

		const query = studentSearch.trim();

		if (!query) return;

		setStudentSearching(true);

		try {
			let profiles = [];

			/* =========================================
		   ERROR ANALYSER DIRECTORY
		   ========================================= */

			if (ERROR_API) {
				const response = await fetch(
					`${ERROR_API}/api/students?q=${encodeURIComponent(query)}`,
				);

				const data = await response.json();

				if (response.ok) {
					profiles = data?.students || data?.data || [];
				}
			}

			/* =========================================
		   PMS FALLBACK
		   ========================================= */

			if (profiles.length === 0) {
				const response = await fetch(
					`${API}/api/progress/search?studentId=${encodeURIComponent(query)}`,
				);

				const data = await response.json();

				if (!response.ok) {
					throw new Error(
						data.message || "Unable to search the student directory.",
					);
				}

				profiles = Array.isArray(data) ? data : [];
			}

			const normalised = query.toLowerCase();

			const profile =
				profiles.find((student) => {
					const fullName = [student.firstName, student.lastName]
						.filter(Boolean)
						.join(" ")
						.toLowerCase();

					return (
						student.studentId?.toLowerCase() === normalised ||
						student.name?.toLowerCase() === normalised ||
						fullName === normalised
					);
				}) || profiles[0];

			if (!profile?.studentId) {
				alert(`No student found for “${query}”.`);

				return;
			}

			setStudentSearch("");

			navigate(`/student/${encodeURIComponent(profile.studentId)}`);
		} catch (error) {
			alert(error.message);
		} finally {
			setStudentSearching(false);
		}
	};

	const loadDashboard = useCallback(() => {
		if (dashboard) {
			setView("dashboard");
			return;
		}
		setLoading(true);
		fetch(`${API}/api/progress/${id}/dashboard`)
			.then((r) => r.json())
			.then((data) => {
				if (data.message && data.status !== "assessment_pending") {
					throw new Error(data.message);
				}
				setDashboard(data);
				setView("dashboard");
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, [dashboard, id]);

	useEffect(() => {
		if (
			searchParams.get("view") !== "dashboard" ||
			!id ||
			view !== "overview"
		) {
			return;
		}
		const timer = window.setTimeout(() => {
			loadDashboard();
		}, 0);
		return () => window.clearTimeout(timer);
	}, [id, searchParams, view, loadDashboard]);

	const buildProgressChartData = () => {
		if (!dashboard?.progressOverTime) return null;
		return {
			labels: dashboard.progressOverTime.map(
				(p, i) => p.semester || `Assessment ${i + 1}`,
			),
			datasets: [
				{
					label: "Score",
					data: dashboard.progressOverTime.map((p) => p.weightedScore ?? null),
					borderColor: "#1a3c6e",
					backgroundColor: "rgba(26, 60, 110, 0.1)",
					tension: 0.3,
					pointRadius: 4,
				},
			],
		};
	};

	const buildTrendGrid = () => {
		if (!dashboard?.componentTrend?.length) return null;

		const allNames = new Set();
		dashboard.componentTrend.forEach((a) =>
			a.components.forEach((c) => allNames.add(c.name)),
		);

		const columns = dashboard.componentTrend.map((a) => a.semester);
		const rows = Array.from(allNames).map((name) => {
			const cells = dashboard.componentTrend.map((a) => {
				const comp = a.components.find((c) => c.name === name);
				if (!comp || comp.result === null) {
					return { status: "not-taken", score: null, passMark: null };
				}
				return {
					status: comp.result === 1 ? "pass" : "fail",
					score: comp.score,
					passMark: comp.passMark,
				};
			});
			return { name, label: SKILL_LABELS[name] || name, cells };
		});

		return { columns, rows };
	};

	const buildSnapshotData = () => {
		if (!dashboard?.latestAssessment?.skillScores) return null;
		const scores = dashboard.latestAssessment.skillScores;
		const entries = Object.entries(scores).filter(([, v]) => v !== null);
		return {
			labels: entries.map(([k]) => SKILL_LABELS[k] || k),
			datasets: [
				{
					label: "Score",
					data: entries.map(([, v]) => v),
					borderColor: "#7c3aed",
					backgroundColor: "rgba(124, 58, 237, 0.3)",
				},
			],
		};
	};

	const progressData = buildProgressChartData();
	const trendGrid = buildTrendGrid();
	const snapshotData = buildSnapshotData();

	const filteredSnapshotData = () => {
		if (!snapshotData) return null;
		const visibleLabels =
			selectedSkills.length > 0 ? selectedSkills : snapshotData.labels;
		const visibleIndexes = snapshotData.labels.reduce((acc, label, index) => {
			if (visibleLabels.includes(label)) acc.push(index);
			return acc;
		}, []);

		return {
			labels: snapshotData.labels.filter((label) =>
				visibleLabels.includes(label),
			),
			datasets: snapshotData.datasets.map((dataset) => ({
				...dataset,
				data: dataset.data.filter((_, index) => visibleIndexes.includes(index)),
			})),
		};
	};

	const toggleSkill = (label) => {
		setSelectedSkills((current) => {
			if (!current.length) return [label];
			if (current.includes(label)) {
				return current.filter((item) => item !== label);
			}
			return [...current, label];
		});
	};

	if (loading) {
		return (
			<div className="sp-page">
				<main className="sp-main">
					<p className="state-msg">Loading...</p>
				</main>
			</div>
		);
	}

	if (error) {
		return (
			<div className="sp-page">
				<main className="sp-main">
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);
	}

	if (view === "overview") {
		return (
			<div className="sp-page">
				<TeacherSidebar studentId={overview?.student?.studentId || id} />

				<main className="sp-main">
					<TeacherTopbar
						studentSearch={studentSearch}
						setStudentSearch={setStudentSearch}
						studentSearching={studentSearching}
						onStudentSearch={openStudentDashboard}
					/>

					<div className="eo-content">
						<section className="eo-profile-card">
							<div className="eo-student-icon">
								<UserRound size={29} />
							</div>

							<div className="eo-profile-info">
								<h1>{overview?.student?.studentId}</h1>

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
										<CalendarDays size={17} />
									</div>
									<div>
										<span className="eo-meta-label">Last Assessment</span>
										<span className="eo-meta-value">
											{overview?.lastAssessmentDate
												? new Date(
														overview.lastAssessmentDate,
													).toLocaleDateString("en-GB", {
														day: "2-digit",
														month: "short",
														year: "numeric",
													})
												: "No assessment yet"}
										</span>
									</div>
								</div>

								<div className="eo-meta-item">
									<div className="eo-meta-icon">
										<GraduationCap size={17} />
									</div>
									<div>
										<span className="eo-meta-label">Assigned Band</span>
										<span className="eo-meta-value eo-band">
											{overview?.latestNewBand ||
												overview?.currentBandLevel ||
												"—"}
										</span>
									</div>
								</div>

								<div className="eo-meta-item">
									<div className="eo-meta-icon">
										<BriefcaseBusiness size={17} />
									</div>
									<div>
										<span className="eo-meta-label">Centre</span>
										<span className="eo-meta-value">
											{overview?.student?.centreId ||
												overview?.student?.centre ||
												"—"}
										</span>
									</div>
								</div>
							</div>
						</section>

						<section className="eo-section-heading">
							<div>
								<span className="eo-eyebrow">STUDENT ASSESSMENT</span>
								<h2>Choose an analysis tool</h2>
								<p>
									View longitudinal progress or analyse writing and literacy
									error patterns.
								</p>
							</div>
						</section>

						<section className="sp-options">
							<div
								className="sp-option-card sp-option-progress"
								onClick={loadDashboard}
							>
								<div className="sp-option-top">
									<div className="sp-option-icon">
										<TrendIcon size={30} />
									</div>
									<span className="sp-option-label">PROGRESS INSIGHTS</span>
								</div>

								<div className="sp-option-copy">
									<h3>Progress Monitoring</h3>
									<p>
										Track assessment progress, skill development and band
										progression.
									</p>
								</div>

								<div className="sp-option-features">
									<span>Assessment and skill trends</span>

									<span>Band progression tracking</span>
								</div>

								<button type="button" className="sp-option-btn">
									View Progress Dashboard
									<span>→</span>
								</button>

								<TrendIcon
									className="sp-option-watermark"
									size={180}
									strokeWidth={1}
								/>
							</div>

							<div
								className="sp-option-card sp-option-errors"
								onClick={() =>
									navigate(
										`/error-options/${encodeURIComponent(
											overview?.student?.studentId || id,
										)}`,
									)
								}
							>
								<div className="sp-option-top">
									<div className="sp-option-icon">
										<FileBarChart size={30} />
									</div>
									<span className="sp-option-label">ERROR ANALYSIS</span>
								</div>

								<div className="sp-option-copy">
									<h3>Error Pattern Analysis</h3>
									<p>
										Identify recurring writing and literacy errors from student
										work.
									</p>
								</div>

								<div className="sp-option-features">
									<span>Writing error detection</span>

									<span>Educator-focused insights</span>
								</div>

								<button
									type="button"
									className="sp-option-btn"
									onClick={(event) => {
										event.stopPropagation();
										navigate(
											`/error-options/${encodeURIComponent(
												overview?.student?.studentId || id,
											)}`,
										);
									}}
								>
									Open Error Analysis
									<span>→</span>
								</button>

								<FileBarChart
									className="sp-option-watermark"
									size={180}
									strokeWidth={1}
								/>
							</div>
						</section>

						<div className="sp-back-bar">
							<Link to="/" className="sp-back-btn">
								<ArrowLeft size={16} />
								Back to Class List
							</Link>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="sp-page">
			<TeacherSidebar
				studentId={
					dashboard?.student?.studentId || overview?.student?.studentId || id
				}
			/>
			<main className="sp-main">
				<TeacherTopbar
					studentSearch={studentSearch}
					setStudentSearch={setStudentSearch}
					studentSearching={studentSearching}
					onStudentSearch={openStudentDashboard}
				/>

				<div className="sp-profile-strip">
					<div className="sp-student-icon sp-student-icon-small">
						<UserRound size={24} />
					</div>

					<div className="sp-dashboard-student">
						<span className="sp-profile-eyebrow">PROGRESS MONITORING</span>
						<h2>{dashboard?.student?.studentId}</h2>

						<div className="sp-strip-meta">
							<span>
								<CalendarDays size={14} />
								Last Assessment:{" "}
								{dashboard?.latestAssessment?.assessmentDate
									? new Date(
											dashboard.latestAssessment.assessmentDate,
										).toLocaleDateString("en-GB", {
											day: "2-digit",
											month: "short",
											year: "numeric",
										})
									: "—"}
							</span>

							<span className="sp-band-tag">
								<GraduationCap size={14} />
								{dashboard?.latestAssessment?.newBand ||
									dashboard?.currentBandLevel ||
									dashboard?.student?.summaryBand ||
									"—"}
							</span>

							<span>
								<BriefcaseBusiness size={14} />
								Centre:{" "}
								{dashboard?.student?.centreId ||
									dashboard?.student?.centre ||
									overview?.student?.centreId ||
									overview?.student?.centre ||
									"—"}
							</span>
						</div>
					</div>

					<div className="sp-quick-actions">
						<button
							className="sp-compare-btn"
							onClick={() => navigate(`/assessment-comparison?studentId=${id}`)}
							disabled={isPending}
						>
							Compare Assessments
						</button>

						<button
							className="sp-qa-primary"
							onClick={() => navigate(`/progress-report?studentId=${id}`)}
							disabled={isPending}
						>
							<FileText size={16} />
							Generate Report
						</button>

						<button
							className="sp-qa-secondary"
							onClick={() => navigate(`/student/${id}/add-assessment`)}
						>
							<Save size={16} />
							Add Assessment
						</button>

						<a
							href={SHEET_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="sp-qa-secondary"
						>
							<Sheet size={16} />
							Open Google Sheets
						</a>
					</div>
				</div>

				{isPending ? (
					<div className="sp-history-card">
						<p className="state-msg">
							No assessments have been recorded for this student yet. Once
							assessment data is added via Google Sheets, their progress
							dashboard will appear here.
						</p>
					</div>
				) : (
					<>
						<div className="sp-row">
							{dashboard.bandScore && (
								<div className="sp-band-score-card">
									<div className="sp-band-score-header">
										<h3>Component Breakdown for Latest Assessment</h3>
										<div className="sp-legend">
											<span className="sp-legend-item sp-legend-item-pass">
												Pass
											</span>
											<span className="sp-legend-item sp-legend-item-fail">
												Fail
											</span>
										</div>
									</div>

									<div className="sp-band-score-total">
										<span className="sp-score-num">
											{dashboard.bandScore.totalScore}%
										</span>
										<span className="sp-score-label">of 90% required</span>
									</div>

									<div className="sp-component-grid">
										{dashboard.bandScore.componentResults.map((comp, i) => (
											<div
												key={i}
												className={`sp-comp-item ${
													comp.skipped
														? "sp-comp-skip"
														: comp.passed
															? "sp-comp-pass"
															: "sp-comp-fail"
												}`}
											>
												<span className="sp-comp-name">
													{SKILL_LABELS[comp.name] || comp.name}
												</span>
												<span className="sp-comp-score">
													{comp.name === "writtenVocab"
														? comp.skipped
															? "Not taken"
															: comp.passed
																? "Pass"
																: "Fail"
														: comp.score !== null && comp.score !== undefined
															? comp.passMark !== null &&
																comp.passMark !== undefined
																? `${comp.score} / ${comp.passMark}`
																: comp.score
															: "—"}
												</span>
												<span className="sp-comp-status">
													{comp.skipped ? "Not taken" : comp.passed ? "✓" : "✗"}
												</span>
											</div>
										))}
									</div>

									{(() => {
										const phonicsComp =
											dashboard.bandScore.componentResults.find(
												(r) => r.name === "fluency",
											);
										return phonicsComp ? (
											<div className="sp-phonics-note">
												<span>Phonics (Tested in-class, not scored) --</span>
												<span className="sp-phonics-score">
													{phonicsComp.score !== null &&
													phonicsComp.score !== undefined
														? phonicsComp.score
														: "Not taken"}
												</span>
											</div>
										) : null;
									})()}
								</div>
							)}

							<div className="sp-ai-card">
								<h3>✦ Student Performance Summary</h3>
								<p>
									{(() => {
										const band =
											dashboard?.latestAssessment?.newBand ||
											dashboard?.currentBandLevel ||
											"—";
										const score = dashboard?.bandScore?.totalScore;
										const passed = dashboard?.bandScore?.passed;
										const strongest = dashboard?.skillBreakdown?.strongest;
										const weakest = dashboard?.skillBreakdown?.weakest;
										const history = dashboard?.assessmentHistory;

										const latest = history?.[history.length - 1];
										const previous = history?.[history.length - 2];
										const latestScore = latest?.weightedScore;
										const previousScore = previous?.weightedScore;

										let improvement = "";
										if (
											latestScore !== null &&
											latestScore !== undefined &&
											previousScore !== null &&
											previousScore !== undefined
										) {
											const diff = parseFloat(
												(latestScore - previousScore).toFixed(2),
											);
											if (diff > 0) {
												improvement = ` This is an improvement of ${diff}% from their previous assessment (${previousScore}%).`;
											} else if (diff < 0) {
												improvement = ` This is a decrease of ${Math.abs(diff)}% from their previous assessment (${previousScore}%).`;
											} else {
												improvement = ` Their score is unchanged from their previous assessment.`;
											}
										}

										let summary = `${dashboard?.student?.studentId} is currently at Band Level ${band}`;
										if (score !== null && score !== undefined) {
											summary += `, with a weighted assessment score of ${score}%`;
											summary += passed
												? " : meeting the required threshold."
												: " : below the 90% passing threshold.";
										}
										summary += improvement;
										if (strongest)
											summary += ` Their strongest skill area is ${strongest}`;
										if (weakest) {
											summary += `, with ${weakest} identified as a focus area for improvement.`;
										}

										return summary;
									})()}
								</p>

								<div className="sp-tags">
									{dashboard?.skillBreakdown?.strongest && (
										<span className="sp-tag">
											Strongest: {dashboard.skillBreakdown.strongest}
										</span>
									)}
									{dashboard?.skillBreakdown?.weakest && (
										<span className="sp-tag sp-tag-alt">
											Focus: {dashboard.skillBreakdown.weakest}
										</span>
									)}
									{dashboard?.bandScore && (
										<span
											className={`sp-tag ${dashboard.bandScore.passed ? "" : "sp-tag-warn"}`}
										>
											{dashboard.bandScore.passed
												? "✓ Band Passed"
												: "✗ Below Threshold"}
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="sp-row">
							<div className="sp-chart-card">
								<h3>Progress Over Time</h3>
								<p className="sp-chart-sub">
									Assessment score growth across semesters
								</p>
								{progressData ? (
									<Line
										data={progressData}
										options={{
											responsive: true,
											scales: { y: { min: 0, max: 100 } },
										}}
									/>
								) : (
									<p className="state-msg">No progress data available</p>
								)}
							</div>

							<div className="sp-radar-card">
								<div className="sp-radar-header">
									<h3>Skill Breakdown</h3>
									<div className="sp-chart-toggle">
										<button
											className={`sp-toggle-btn ${chartType === "radar" ? "sp-toggle-active" : ""}`}
											onClick={() => setChartType("radar")}
										>
											◎ Spider
										</button>
										<button
											className={`sp-toggle-btn ${chartType === "bar" ? "sp-toggle-active" : ""}`}
											onClick={() => setChartType("bar")}
										>
											▦ Bar
										</button>
										<button
											className={`sp-toggle-btn ${chartType === "trend" ? "sp-toggle-active" : ""}`}
											onClick={() => setChartType("trend")}
										>
											⊞ Trend
										</button>
									</div>
								</div>

								{chartType === "radar" &&
									(snapshotData ? (
										<>
											<div style={{ height: "300px", position: "relative" }}>
												<Radar
													data={filteredSnapshotData()}
													options={{
														responsive: true,
														maintainAspectRatio: false,
														scales: { r: { min: 0, max: 100 } },
														plugins: { legend: { display: false } },
													}}
												/>
											</div>
											<div className="sp-skill-checkboxes">
												{snapshotData.labels.map((label, i) => (
													<label key={i} className="sp-skill-checkbox">
														<input
															type="checkbox"
															checked={
																selectedSkills.length === 0 ||
																selectedSkills.includes(label)
															}
															onChange={() => toggleSkill(label)}
														/>
														{label}
													</label>
												))}
											</div>
										</>
									) : (
										<p className="state-msg">No skill data available</p>
									))}

								{chartType === "bar" &&
									(snapshotData ? (
										<>
											<div style={{ height: "300px", position: "relative" }}>
												<Bar
													data={filteredSnapshotData()}
													options={{
														responsive: true,
														maintainAspectRatio: false,
														scales: { y: { min: 0, max: 100 } },
														plugins: { legend: { display: false } },
													}}
												/>
											</div>
											<div className="sp-skill-checkboxes">
												{snapshotData.labels.map((label, i) => (
													<label key={i} className="sp-skill-checkbox">
														<input
															type="checkbox"
															checked={
																selectedSkills.length === 0 ||
																selectedSkills.includes(label)
															}
															onChange={() => toggleSkill(label)}
														/>
														{label}
													</label>
												))}
											</div>
										</>
									) : (
										<p className="state-msg">No skill data available</p>
									))}

								{chartType === "trend" &&
									(trendGrid ? (
										<div className="sp-trend-grid-wrapper">
											<table className="sp-trend-grid">
												<thead>
													<tr>
														<th className="sp-trend-row-label"></th>
														{trendGrid.columns.map((col, i) => (
															<th key={i}>{col}</th>
														))}
													</tr>
												</thead>
												<tbody>
													{trendGrid.rows.map((row, ri) => (
														<tr key={ri}>
															<td className="sp-trend-row-label">
																{row.label}
															</td>
															{row.cells.map((cell, ci) => (
																<td key={ci} className="sp-trend-cell">
																	<span
																		className={`sp-trend-dot sp-trend-${cell.status}`}
																		title={
																			cell.status === "not-taken"
																				? "Not taken"
																				: `${cell.score}/${cell.passMark} — ${cell.status}`
																		}
																	></span>
																</td>
															))}
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<p className="state-msg">No trend data available</p>
									))}

								{chartType !== "trend" && (
									<p className="sp-strongest">
										Strongest Skill:{" "}
										{dashboard?.skillBreakdown?.strongest || "—"}
									</p>
								)}
							</div>
						</div>

						<div className="sp-history-card">
							<div className="sp-history-header">
								<h2>Assessment History</h2>
								<div style={{ display: "flex", gap: "0.5rem" }}>
									<button
										className="sp-view-assessments-btn"
										onClick={() => navigate(`/student/${id}/assessments`)}
									>
										View Assessments →
									</button>
								</div>
							</div>

							<table className="sp-table">
								<thead>
									<tr>
										<th>DATE</th>
										<th>SEMESTER</th>
										<th>STARTING BAND</th>
										<th>NEW BAND</th>
										<th>SCORE</th>
										<th>TEACHER</th>
									</tr>
								</thead>
								<tbody>
									{dashboard?.assessmentHistory?.slice(0, 10).map((a, i) => (
										<tr key={i}>
											<td>
												{a.assessmentDate
													? new Date(a.assessmentDate).toLocaleDateString(
															"en-GB",
															{
																day: "2-digit",
																month: "short",
																year: "numeric",
															},
														)
													: "—"}
											</td>
											<td>{a.semester || "—"}</td>
											<td>
												<span className="sp-band-badge">
													{a.summaryBand || "—"}
												</span>
											</td>
											<td>
												<span
													className="sp-band-badge"
													style={{
														background:
															a.newBand !== a.summaryBand
																? "#dcfce7"
																: "#eff6ff",
														color:
															a.newBand !== a.summaryBand
																? "#166534"
																: "#1a3c6e",
													}}
												>
													{a.newBand || "—"}
												</span>
											</td>
											<td>
												{a.weightedScore !== null ? `${a.weightedScore}%` : "—"}
											</td>
											<td>{a.assessedBy || "—"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</>
				)}

				<div className="sp-bottom-bar">
					<button
						className="sp-back-btn"
						onClick={() => {
							setView("overview");
							navigate(`/student/${encodeURIComponent(id)}`);
						}}
					>
						<ArrowLeft size={16} />
						Back to Overview
					</button>
				</div>
			</main>
		</div>
	);
}
