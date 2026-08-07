import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./../css/StudentProgress.css";
import {
	FileText,
	ArrowLeft,
	TrendingUp as TrendIcon,
	FileBarChart,
	Sheet,
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

export default function StudentProgress() {
	const { id } = useParams();
	const navigate = useNavigate();

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

	const loadDashboard = () => {
		if (dashboard) {
			setView("dashboard");
			return;
		}
		setLoading(true);
		fetch(`${API}/api/progress/${id}/dashboard`)
			.then((r) => r.json())
			.then((data) => {
				if (data.message) throw new Error(data.message);
				setDashboard(data);
				setView("dashboard");
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	};

	const getInitials = (studentId) => {
		if (!studentId) return "ST";
		const parts = studentId.split(" ");
		return parts.length > 1
			? parts[0][0] + parts[1][0]
			: studentId.slice(0, 2).toUpperCase();
	};

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
		narrative: "Narrative Writing",
		exposition: "Exposition Writing",
		persuasive: "Persuasive Writing",
		lsComprehension: "Listening Comprehension",
		rdComprehension: "Reading Comprehension",
	};

	const buildRadarData = () => {
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

	if (loading)
		return (
			<div className="sp-page">
				<main className="sp-main">
					<p className="state-msg">Loading...</p>
				</main>
			</div>
		);

	if (error)
		return (
			<div className="sp-page">
				<main className="sp-main">
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);

	if (view === "overview")
		return (
			<div className="sp-page">
				<main className="sp-main">
					<header className="sp-topbar">
						<h2>DAS Assessment Portal</h2>
						<span className="sp-topbar-sub">Student Progress</span>
					</header>

					<div className="sp-profile-card">
						<div className="sp-avatar-lg">
							{getInitials(overview?.student?.studentId)}
						</div>
						<div className="sp-profile-info">
							<h1>{overview?.student?.studentId}</h1>
							<a
								href={SHEET_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="sp-sheets-btn"
							>
								<Sheet size={16} /> Open Google Sheets
							</a>
						</div>
						<div className="sp-profile-meta">
							<div className="sp-meta-item">
								<span className="sp-meta-label">Last Assessment</span>
								<span className="sp-meta-value">
									{overview?.lastAssessmentDate
										? new Date(overview.lastAssessmentDate).toLocaleDateString(
												"en-GB",
												{ day: "2-digit", month: "short", year: "numeric" },
											)
										: "No assessment yet"}
								</span>
							</div>
							<div className="sp-meta-item">
								<span className="sp-meta-label">Assigned Band</span>
								<span className="sp-meta-value sp-band">
									✦
									{overview?.latestNewBand || overview?.currentBandLevel || "—"}
								</span>
							</div>
							<div className="sp-meta-item">
								<span className="sp-meta-label">Teacher</span>
								<span className="sp-meta-value">
									{overview?.student?.teacherId || "—"}
								</span>
							</div>
						</div>
					</div>

					<div className="sp-options">
						<div
							className="sp-option-card sp-option-blue"
							onClick={loadDashboard}
						>
							<div className="sp-option-icon">
								<TrendIcon size={32} />
							</div>
							<h3>Progress Monitoring System</h3>
							<p>
								Monitor student learning progress over time. Track phonics
								mastery, reading fluency, and comprehension metrics through
								longitudinal data.
							</p>
							<button className="sp-option-btn">View Student Profile</button>
						</div>

						<div className="sp-option-card sp-option-purple">
							<div className="sp-option-icon">
								<FileBarChart size={32} />
							</div>
							<h3>Error Pattern Analyser</h3>
							<p>
								Analyse writing samples, identify recurring literacy errors, and
								generate clinical insights to tailor individual educational
								plans.
							</p>
							<button
								className="sp-option-btn-outline"
								onClick={() =>
									navigate(
										`/error-dashboard/${encodeURIComponent(overview.student.studentId)}`,
									)
								}
							>
								Open Error Pattern Analysis
							</button>
						</div>
					</div>

					<div className="sp-back-bar">
						<Link to="/" className="sp-back-btn">
							<ArrowLeft size={16} /> Back to Class List
						</Link>
					</div>
				</main>
			</div>
		);

	const progressData = buildProgressChartData();
	const radarData = buildRadarData();

	const toggleSkill = (label) => {
		setSelectedSkills((prev) =>
			prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
		);
	};

	const filteredRadarData = () => {
		if (!radarData) return null;
		const activeSkills =
			selectedSkills.length > 0 ? selectedSkills : radarData.labels;
		const indices = radarData.labels
			.map((label, i) => (activeSkills.includes(label) ? i : null))
			.filter((i) => i !== null);
		return {
			labels: indices.map((i) => radarData.labels[i]),
			datasets: [
				{
					label: "Score",
					data: indices.map((i) => radarData.datasets[0].data[i]),
					borderColor: "#7c3aed",
					backgroundColor: "rgba(124, 58, 237, 0.3)",
				},
			],
		};
	};

	return (
		<div className="sp-page">
			<main className="sp-main">
				<header className="sp-topbar">
					<h2>DAS Assessment Portal</h2>
					<span className="sp-topbar-sub">Student Progress</span>
				</header>

				<div className="sp-profile-strip">
					<div className="sp-avatar-md">
						{getInitials(dashboard?.student?.studentId)}
					</div>
					<div>
						<h2>{dashboard?.student?.studentId}</h2>
						<div className="sp-strip-meta">
							<span>
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
								✦{" "}
								{dashboard?.latestAssessment?.newBand ||
									dashboard?.currentBandLevel ||
									"—"}
							</span>
							<span>Teacher: {dashboard?.student?.teacherId || "—"}</span>
						</div>
					</div>
					<div className="sp-quick-actions">
						<button
							className="sp-compare-btn"
							onClick={() => navigate(`/assessment-comparison?studentId=${id}`)}
						>
							Compare Assessments
						</button>
						<button
							className="sp-qa-primary"
							onClick={() => navigate(`/progress-report?studentId=${id}`)}
						>
							<FileText size={16} /> Generate Report
						</button>
						<a
							href={SHEET_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="sp-qa-secondary"
						>
							<Sheet size={16} /> Open Google Sheets
						</a>
					</div>
				</div>

				<div className="sp-row">
					{dashboard.bandScore && (
						<div className="sp-band-score-card">
							<div className="sp-band-score-header">
								<h3>Band Assessment Score</h3>
								<span
									className={`sp-band-result ${dashboard.bandScore.passed ? "sp-passed" : "sp-failed"}`}
								>
									{dashboard.bandScore.passed ? "✓ PASSED" : "✗ NOT YET"}
								</span>
							</div>
							<div className="sp-band-score-total">
								<span className="sp-score-num">
									{dashboard.bandScore.totalScore}%
								</span>
								<span className="sp-score-label">/ 90% required</span>
							</div>
							{dashboard.bandScore.forgivenessApplied && (
								<p className="sp-forgiveness-note">Forgiveness rule applied</p>
							)}
							<div className="sp-component-grid">
								{dashboard.bandScore.componentResults
									.filter((r) => !r.skipped)
									.map((comp, i) => (
										<div
											key={i}
											className={`sp-comp-item ${comp.passed ? "sp-comp-pass" : "sp-comp-fail"}`}
										>
											<span className="sp-comp-name">{comp.name}</span>
											<span className="sp-comp-score">{comp.score ?? "—"}</span>
											<span className="sp-comp-status">
												{comp.passed ? "✓" : "✗"}
											</span>
										</div>
									))}
							</div>
							{dashboard.bandScore.failedComponents.length > 0 && (
								<p className="sp-failed-note">
									Failed: {dashboard.bandScore.failedComponents.join(", ")}
								</p>
							)}
						</div>
					)}
					{/* AI Insight Summary */}
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

								// Get latest and previous scores
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
									if (diff > 0)
										improvement = ` This is an improvement of ${diff}% from their previous assessment (${previousScore}%).`;
									else if (diff < 0)
										improvement = ` This is a decrease of ${Math.abs(diff)}% from their previous assessment (${previousScore}%).`;
									else
										improvement = ` Their score is unchanged from their previous assessment.`;
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
								if (weakest)
									summary += `, with ${weakest} identified as a focus area for improvement.`;

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

					<div className="sp-goals-card">
						<h3>
							Goals & Interventions{" "}
							<span className="sp-view-all">View All</span>
						</h3>
						{radarData?.datasets?.[0]?.data?.slice(0, 3).map((score, i) => (
							<div className="sp-goal-item" key={i}>
								<div className="sp-goal-label">
									<span>{radarData.labels[i]}</span>
									<span>{score}/100</span>
								</div>
								<div className="sp-goal-bar-bg">
									<div
										className="sp-goal-bar"
										style={{
											width: `${score}%`,
											background:
												i === 0 ? "#1a3c6e" : i === 1 ? "#7c3aed" : "#059669",
										}}
									/>
								</div>
							</div>
						))}
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
							</div>
						</div>

						{radarData ? (
							<>
								<div style={{ height: "300px", position: "relative" }}>
									{chartType === "radar" ? (
										<Radar
											data={filteredRadarData()}
											options={{
												responsive: true,
												maintainAspectRatio: false,
												scales: {
													r: {
														min: 0,
														max: (() => {
															const data =
																filteredRadarData()?.datasets?.[0]?.data || [];
															const highest = Math.max(
																...data.filter((v) => v !== null),
															);
															return isFinite(highest) ? highest + 5 : 100;
														})(),
														ticks: { stepSize: 5 },
													},
												},
												plugins: { legend: { display: false } },
											}}
										/>
									) : (
										<Bar
											data={filteredRadarData()}
											options={{
												responsive: true,
												maintainAspectRatio: false,
												scales: {
													y: { min: 0, max: 100, ticks: { stepSize: 20 } },
												},
												plugins: { legend: { display: false } },
											}}
										/>
									)}
								</div>
								<p className="sp-strongest">
									Strongest Skill: {dashboard?.skillBreakdown?.strongest || "—"}
								</p>
								<div className="sp-skill-checkboxes">
									{radarData.labels.map((label, i) => (
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
						)}
					</div>
				</div>

				<div className="sp-history-card">
					<div className="sp-history-header">
						<h2>Assessment History</h2>
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								background: "#1b3c6e",
								color: "white",
							}}
						>
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
											? new Date(a.assessmentDate).toLocaleDateString("en-GB", {
													day: "2-digit",
													month: "short",
													year: "numeric",
												})
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
													a.newBand !== a.summaryBand ? "#dcfce7" : "#eff6ff",
												color:
													a.newBand !== a.summaryBand ? "#166534" : "#1a3c6e",
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

				<div className="sp-bottom-bar">
					<button className="sp-back-btn" onClick={() => setView("overview")}>
						<ArrowLeft size={16} /> Back to Overview
					</button>
				</div>
			</main>
		</div>
	);
}
