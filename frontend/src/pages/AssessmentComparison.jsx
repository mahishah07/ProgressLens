import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./../css/AssessmentComparison.css";
import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	FileText,
	Bell,
	Settings,
	ArrowLeft,
	Download,
	Share2,
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const API = import.meta.env.VITE_PMS_API;

export default function AssessmentComparison() {
	const [searchParams] = useSearchParams();
	const studentId = searchParams.get("studentId");
	const navigate = useNavigate();

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!studentId) return;
		setLoading(true);
		fetch(`${API}/api/comparison/${studentId}`)
			.then((r) => r.json())
			.then((d) => {
				if (d.message) throw new Error(d.message);
				setData(d);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, [studentId]);

	const SKILL_LABELS = {
		pictureNaming: "Picture Naming",
		pictureDescription: "Picture Description",
		paIdentification: "PA Identification",
		phonics: "Phonics",
		wra: "Word Reading",
		fluency: "Fluency",
		wordSpelling: "Word Spelling",
		letterFormation: "Letter Formation",
		ed1: "Edit D1",
		ed2: "Edit D2",
		ed3: "Edit D3",
		narrative: "Narrative",
		exposition: "Exposition",
		persuasive: "Persuasive",
		lsComprehension: "Listening",
		rdComprehension: "Reading",
	};

	const buildBarData = (skillChanges, type) => {
		if (!skillChanges) return null;
		const entries = Object.entries(skillChanges)
			.filter(([_, v]) => v[type] !== null)
			.slice(0, 6);
		return {
			labels: entries.map(([k]) => SKILL_LABELS[k] || k),
			datasets: [
				{
					label: type === "before" ? "Earlier" : "Latest",
					data: entries.map(([_, v]) => v[type] || 0),
					backgroundColor:
						type === "before" ? "rgba(200,210,230,0.8)" : "#1a3c6e",
					borderRadius: 4,
				},
			],
		};
	};

	const buildVarianceTableData = () => {
		if (!data?.skillChanges) return [];
		return Object.entries(data.skillChanges)
			.filter(([_, v]) => v.before !== null && v.after !== null)
			.map(([key, val]) => ({
				skill: SKILL_LABELS[key] || key,
				before: val.before,
				after: val.after,
				variance: val.change,
			}));
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
			<div className="ac-page">
				<Sidebar />
				<main className="ac-main">
					<p className="state-msg">Loading comparison...</p>
				</main>
			</div>
		);

	if (error)
		return (
			<div className="ac-page">
				<Sidebar />
				<main className="ac-main">
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);

	if (!data || data.status === "insufficient_data")
		return (
			<div className="ac-page">
				<Sidebar />
				<main className="ac-main">
					<p className="state-msg">
						At least one assessment is required to generate a comparison.
					</p>
					<button className="ac-back-btn" onClick={() => navigate(-1)}>
						Go Back
					</button>
				</main>
			</div>
		);

	const earlierBarData = buildBarData(data.skillChanges, "before");
	const laterBarData = buildBarData(data.skillChanges, "after");
	const varianceRows = buildVarianceTableData();

	const bandDir = data.bandChange?.direction;
	const bandSteps = data.bandChange?.steps;
	const scoreChange = data.overallScore?.change;
	const errorReduction = data.errorReduction?.reduction;

	return (
		<div className="ac-page">
			<Sidebar />
			<main className="ac-main">
				<header className="ac-topbar">
					<h2>DAS Assessment Portal</h2>
					<span className="ac-topbar-sub">Comparative Analysis</span>
				</header>

				<div className="ac-header">
					<div>
						<p className="ac-breadcrumb">
							Students › {data.student?.studentId} ›{" "}
							<span>Comparative Analysis</span>
						</p>
						<h1>Assessment Comparison</h1>
						<p className="ac-subtitle">
							Detailed comparative analysis between{" "}
							{data.comparisonPeriod?.from} and {data.comparisonPeriod?.to}{" "}
							assessment cycles.
						</p>
					</div>
					<div className="ac-actions">
						<button className="ac-btn-secondary">
							<Download size={16} /> Export PDF
						</button>
						<button
							className="ac-btn-primary"
							onClick={() =>
								navigate(`/progress-report?studentId=${studentId}`)
							}
						>
							<Share2 size={16} /> Generate Parent Report
						</button>
					</div>
				</div>

				{/* Summary cards */}
				<div className="ac-summary">
					<div className="ac-summary-card">
						<p className="ac-summary-label">BAND IMPROVEMENT</p>
						<h2
							className={
								bandDir === "improved"
									? "ac-positive"
									: bandDir === "declined"
										? "ac-negative"
										: ""
							}
						>
							{bandDir === "improved"
								? `+${bandSteps} Level${bandSteps > 1 ? "s" : ""}`
								: bandDir === "declined"
									? `-${bandSteps} Level${bandSteps > 1 ? "s" : ""}`
									: "Same Level"}
						</h2>
						<p className="ac-summary-sub">
							{bandDir === "improved"
								? `Advanced from ${data.comparisonPeriod?.from}`
								: bandDir === "declined"
									? `Declined from ${data.comparisonPeriod?.from}`
									: "No band change"}
						</p>
					</div>

					<div className="ac-summary-card">
						<p className="ac-summary-label">SCORE DELTA</p>
						<h2
							className={
								scoreChange > 0
									? "ac-positive"
									: scoreChange < 0
										? "ac-negative"
										: ""
							}
						>
							{scoreChange != null
								? `${scoreChange > 0 ? "+" : ""}${scoreChange} Overall`
								: "—"}
						</h2>
						<p className="ac-summary-sub">
							{data.overallScore?.earliest != null
								? `From ${data.overallScore.earliest} to ${data.overallScore.latest}`
								: "No score data"}
						</p>
					</div>

					<div className="ac-summary-card">
						<p className="ac-summary-label">ERROR REDUCTION</p>
						<h2
							className={
								errorReduction > 0
									? "ac-positive"
									: errorReduction < 0
										? "ac-negative"
										: ""
							}
						>
							{errorReduction != null
								? `${errorReduction > 0 ? "-" : "+"}${Math.abs(errorReduction)}`
								: "—"}
						</h2>
						<p className="ac-summary-sub">
							{data.errorReduction?.improved
								? "Improved error accuracy"
								: "Needs more practice"}
						</p>
					</div>
				</div>

				{/* Cycle labels */}
				<div className="ac-cycle-bar">
					<span className="ac-cycle-tag">Cycle A</span>
					<span>{data.comparisonPeriod?.from} — Baseline Assessment</span>
					<span className="ac-cycle-tag ac-cycle-active">Cycle B</span>
					<span>{data.comparisonPeriod?.to}</span>
					<span className="ac-latest">Latest Results</span>
				</div>

				{/* Skill breakdown charts */}
				<div className="ac-charts">
					<div className="ac-chart-card">
						<h3>Skill Breakdown — Earlier</h3>
						{earlierBarData ? (
							<Bar
								data={earlierBarData}
								options={{
									responsive: true,
									plugins: { legend: { display: false } },
									scales: { y: { min: 0, max: 100 } },
								}}
							/>
						) : (
							<p className="state-msg">No data</p>
						)}
					</div>
					<div className="ac-chart-card">
						<h3>Skill Breakdown — Latest</h3>
						{laterBarData ? (
							<Bar
								data={laterBarData}
								options={{
									responsive: true,
									plugins: { legend: { display: false } },
									scales: { y: { min: 0, max: 100 } },
								}}
							/>
						) : (
							<p className="state-msg">No data</p>
						)}
					</div>
				</div>

				{/* Teacher observations */}
				<div className="ac-observations">
					<div className="ac-obs-card">
						<h3>
							<FileText size={16} /> Teacher Observations
						</h3>
						<blockquote>
							{data.assessmentHistory?.[0]?.teacherComments ||
								"No observations recorded for the earlier assessment."}
						</blockquote>
						<div className="ac-obs-tags">
							<span className="ac-tag ac-tag-red">
								Earliest: {data.comparisonPeriod?.from}
							</span>
						</div>
					</div>
					<div className="ac-obs-card">
						<h3>
							<FileText size={16} /> Updated Observations
						</h3>
						<blockquote>
							{data.assessmentHistory?.[data.assessmentHistory.length - 1]
								?.teacherComments ||
								"No observations recorded for the latest assessment."}
						</blockquote>
						<div className="ac-obs-tags">
							<span className="ac-tag ac-tag-green">
								Latest: {data.comparisonPeriod?.to}
							</span>
						</div>
					</div>
				</div>

				{/* Variance table */}
				<div className="ac-variance-card">
					<h3>Data Variance Analysis</h3>
					<table className="ac-table">
						<thead>
							<tr>
								<th>ASSESSMENT MODULE</th>
								<th>EARLIER</th>
								<th>LATEST</th>
								<th>VARIANCE</th>
							</tr>
						</thead>
						<tbody>
							{varianceRows.map((row, i) => (
								<tr key={i}>
									<td>
										<strong>{row.skill}</strong>
									</td>
									<td>{row.before}/100</td>
									<td className="ac-highlight">{row.after}/100</td>
									<td
										className={
											row.variance > 0
												? "ac-positive"
												: row.variance < 0
													? "ac-negative"
													: ""
										}
									>
										{row.variance > 0
											? `+${row.variance}%`
											: `${row.variance}%`}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Bottom bar */}
				<div className="ac-bottom-bar">
					<button className="ac-back-btn" onClick={() => navigate(-1)}>
						<ArrowLeft size={16} /> Back
					</button>
					<button
						className="ac-primary-btn"
						onClick={() => navigate(`/progress-report?studentId=${studentId}`)}
					>
						<Share2 size={16} /> Generate Parent Report
					</button>
				</div>
			</main>
		</div>
	);
}
