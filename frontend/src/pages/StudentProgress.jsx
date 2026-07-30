import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./../css/StudentProgress.css";
import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	FileText,
	Bell,
	Settings,
	ArrowLeft,
	TrendingUp as TrendIcon,
	FileBarChart,
	Sheet,
	Filter,
} from "lucide-react";
import { Line, Radar } from "react-chartjs-2";
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

const API = import.meta.env.VITE_API_URL;
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

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		setError(null);
		fetch(`${API}/api/progress/${id}/overview`)
			.then((r) => r.json())
			.then((data) => {
				if (data.message) throw new Error(data.message);
				setOverview(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
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
					data: dashboard.progressOverTime.map((p) => p.averageScore || 0),
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
		ed1: "Edit D1",
		ed2: "Edit D2",
		ed3: "Edit D3",
		narrative: "Narrative Writing",
		exposition: "Exposition Writing",
		persuasive: "Persuasive Writing",
		lsComprehension: "Listening Comprehension",
		rdComprehension: "Reading Comprehension",
	};

	const buildRadarData = () => {
		if (!dashboard?.latestAssessment?.skillScores) return null;
		const scores = dashboard.latestAssessment.skillScores;
		const entries = Object.entries(scores).filter(([_, v]) => v !== null);
		return {
			labels: entries.map(([k]) => SKILL_LABELS[k] || k),
			datasets: [
				{
					label: "Score",
					data: entries.map(([_, v]) => v),
					borderColor: "#7c3aed",
					backgroundColor: "rgba(124, 58, 237, 0.3)",
				},
			],
		};
	};

	const Sidebar = () => (
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
				<a className="active">
					<TrendingUp size={20} />
					<span>Progress Monitoring</span>
				</a>
				<a href="#">
					<BarChart3 size={20} />
					<span>Error Pattern Analysis</span>
				</a>
				<a href="#">
					<FileText size={20} />
					<span>Reports</span>
				</a>
				<a href="#">
					<Bell size={20} />
					<span>Notifications</span>
				</a>
				<a href="#">
					<Settings size={20} />
					<span>Settings</span>
				</a>
			</nav>
			<div className="sidebar-footer">
				<div className="avatar-small">SR</div>
				<div>
					<p className="footer-name">S. Richards</p>
					<p className="footer-role">Profile</p>
				</div>
			</div>
		</aside>
	);

	if (loading)
		return (
			<div className="sp-page">
				<Sidebar />
				<main className="sp-main">
					<p className="state-msg">Loading...</p>
				</main>
			</div>
		);

	if (error)
		return (
			<div className="sp-page">
				<Sidebar />
				<main className="sp-main">
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);

	if (view === "overview")
		return (
			<div className="sp-page">
				<Sidebar />
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
									✦ {overview?.currentBandLevel || "—"}
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
							<button className="sp-option-btn-outline">
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
			<Sidebar />
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
								✦ {dashboard?.currentBandLevel || "—"}
							</span>
							<span>Teacher: {dashboard?.student?.teacherId || "—"}</span>
						</div>
					</div>
					<div className="sp-quick-actions">
						<button
							className="sp-qa-primary"
							onClick={() => navigate(`/progress-report?studentId=${id}`)}
						>
							<FileText size={16} /> Generate Report
						</button>
						<button className="sp-qa-secondary">
							<Filter size={16} /> View Assessments
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
					<div className="sp-ai-card">
						<h3>✦ AI Insight Summary</h3>
						<p>
							{dashboard?.latestAssessment?.aiInsights ||
								"No AI insights generated yet. Click Generate Report to produce insights."}
						</p>
						<div className="sp-tags">
							<span className="sp-tag">
								{dashboard?.skillBreakdown?.strongest
									? `Strongest: ${dashboard.skillBreakdown.strongest}`
									: "—"}
							</span>
							<span className="sp-tag sp-tag-alt">
								{dashboard?.skillBreakdown?.weakest
									? `Focus: ${dashboard.skillBreakdown.weakest}`
									: "—"}
							</span>
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
						<h3>Skill Breakdown</h3>
						{radarData ? (
							<>
								<Radar
									data={filteredRadarData()}
									options={{
										responsive: true,
										scales: {
											r: { min: 0, max: 100, ticks: { stepSize: 20 } },
										},
										plugins: { legend: { display: false } },
									}}
								/>
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
						<h3>Assessment History</h3>
						<button className="sp-filter-btn">
							<Filter size={14} /> Filter
						</button>
					</div>
					<table className="sp-table">
						<thead>
							<tr>
								<th>DATE</th>
								<th>SEMESTER</th>
								<th>BAND</th>
								<th>SCORE</th>
								<th>TEACHER</th>
								<th>ACTION</th>
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
											{a.summaryBand || a.newBand || "—"}
										</span>
									</td>
									<td>
										{a.averageScore != null
											? `${Math.round(a.averageScore)}/100`
											: "—"}
									</td>
									<td>{a.assessedBy || "—"}</td>
									<td>
										<button className="sp-view-details">View details</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="sp-bottom-bar">
					<button className="sp-back-btn" onClick={() => setView("overview")}>
						<ArrowLeft size={16} /> Back to Overview
					</button>
					<button
						className="sp-generate-btn"
						onClick={() => navigate(`/progress-report?studentId=${id}`)}
					>
						<FileText size={16} /> Generate PDF Report
					</button>
					<button
						className="sp-compare-btn"
						onClick={() => navigate(`/assessment-comparison?studentId=${id}`)}
					>
						✦ Compare Assessments
					</button>
				</div>
			</main>
		</div>
	);
}
