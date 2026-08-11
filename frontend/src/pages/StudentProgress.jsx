import { useState, useEffect, useCallback } from "react";
import {
	Link,
	useParams,
	useNavigate,
	useSearchParams,
} from "react-router-dom";
import "./../css/Landing.css";
import "./../css/StudentProgress.css";
import {
	FileText,
	ArrowLeft,
	TrendingUp as TrendIcon,
	FileBarChart,
	Sheet,
	LayoutDashboard,
	Bell,
	Settings,
	UserRound,
	CalendarDays,
	GraduationCap,
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

function TeacherSidebar() {
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

function TeacherTopbar() {
	return (
		<header className="topbar">
			<div className="topbar-brand">
				<div>
					<h2>DAS Assessment Portal</h2>
					<span className="topbar-context">Teacher Dashboard</span>
				</div>
			</div>

			<div className="top-right">
				<div className="topbar-role">
					<span className="role-dot" />
					<div>
						<strong>Educational Professional</strong>
						<span>DAS Teacher Portal</span>
					</div>
				</div>

				<button
					className="topbar-icon-button"
					type="button"
					aria-label="Settings"
				>
					<Settings size={19} />
				</button>
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
	const [selectedSkills, setSelectedSkills] = useState([]);
	const [chartType, setChartType] = useState("radar");

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
				<TeacherSidebar />
				<main className="sp-main">
					<TeacherTopbar />

					<div className="sp-overview-content">
						<div className="sp-profile-card sp-profile-card-new">
							<div className="sp-student-icon">
								<UserRound size={30} />
							</div>

							<div className="sp-profile-info">
								<span className="sp-profile-eyebrow">STUDENT PROFILE</span>
								<h1>{overview?.student?.studentId}</h1>
								<a
									href={SHEET_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="sp-sheets-btn"
								>
									<Sheet size={16} />
									Open Google Sheets
								</a>
							</div>

							<div className="sp-profile-meta">
								<div className="sp-meta-item">
									<div className="sp-meta-icon">
										<CalendarDays size={17} />
									</div>
									<div>
										<span className="sp-meta-label">Last Assessment</span>
										<span className="sp-meta-value">
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

								<div className="sp-meta-item">
									<div className="sp-meta-icon">
										<GraduationCap size={17} />
									</div>
									<div>
										<span className="sp-meta-label">Assigned Band</span>
										<span className="sp-meta-value sp-band">
											{overview?.latestNewBand ||
												overview?.currentBandLevel ||
												"—"}
										</span>
									</div>
								</div>

								<div className="sp-meta-item">
									<div className="sp-meta-icon">
										<UserRound size={17} />
									</div>
									<div>
										<span className="sp-meta-label">Assigned Teacher</span>
										<span className="sp-meta-value">
											{overview?.student?.teacherId || "—"}
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className="sp-section-heading">
							<div>
								<span className="sp-section-eyebrow">STUDENT ASSESSMENT</span>
								<h2>Choose an analysis tool</h2>
								<p>
									View longitudinal progress or analyse writing and literacy
									error patterns.
								</p>
							</div>
						</div>

						<div className="sp-options">
							<div
								className="sp-option-card sp-option-progress"
								onClick={loadDashboard}
							>
								<div className="sp-option-top">
									<div className="sp-option-icon">
										<TrendIcon size={28} />
									</div>
									<span className="sp-option-label">PROGRESS INSIGHTS</span>
								</div>

								<div className="sp-option-copy">
									<h3>Progress Monitoring System</h3>
									<p>
										Monitor student learning progress over time. Track phonics
										mastery, reading fluency and comprehension metrics through
										longitudinal data.
									</p>
								</div>

								<div className="sp-option-features">
									<span>Longitudinal assessment trends</span>
									<span>Skill and component breakdown</span>
									<span>Band progression monitoring</span>
								</div>

								<button className="sp-option-btn">
									View Student Profile
									<span>→</span>
								</button>

								<TrendIcon
									className="sp-option-watermark"
									size={180}
									strokeWidth={1}
								/>
							</div>

							<div className="sp-option-card sp-option-errors">
								<div className="sp-option-top">
									<div className="sp-option-icon">
										<FileBarChart size={28} />
									</div>
									<span className="sp-option-label">ERROR ANALYSIS</span>
								</div>

								<div className="sp-option-copy">
									<h3>Error Pattern Analyser</h3>
									<p>
										Analyse writing samples, identify recurring literacy errors
										and generate clinical insights to tailor individual
										educational plans.
									</p>
								</div>

								<div className="sp-option-features">
									<span>Writing sample analysis</span>
									<span>Recurring error identification</span>
									<span>Educator-focused insights</span>
								</div>

								<button
									className="sp-option-btn"
									onClick={() =>
										navigate(
											`/error-options/${encodeURIComponent(overview.student.studentId)}`,
										)
									}
								>
									Open Error Pattern Analysis
									<span>→</span>
								</button>

								<FileBarChart
									className="sp-option-watermark"
									size={180}
									strokeWidth={1}
								/>
							</div>
						</div>

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

	const progressData = buildProgressChartData();
	const trendGrid = buildTrendGrid();
	const snapshotData = buildSnapshotData();

	const toggleSkill = (label) => {
		setSelectedSkills((prev) =>
			prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
		);
	};

	const filteredSnapshotData = () => {
		if (!snapshotData) return null;
		const activeSkills =
			selectedSkills.length > 0 ? selectedSkills : snapshotData.labels;
		const indices = snapshotData.labels
			.map((label, i) => (activeSkills.includes(label) ? i : null))
			.filter((i) => i !== null);
		return {
			labels: indices.map((i) => snapshotData.labels[i]),
			datasets: [
				{
					...snapshotData.datasets[0],
					data: indices.map((i) => snapshotData.datasets[0].data[i]),
				},
			],
		};
	};

	const isPending = dashboard?.status === "assessment_pending";

	return (
		<div className="sp-page">
			<TeacherSidebar />
			<main className="sp-main">
				<TeacherTopbar />

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
								<UserRound size={14} />
								Teacher: {dashboard?.student?.teacherId || "—"}
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
