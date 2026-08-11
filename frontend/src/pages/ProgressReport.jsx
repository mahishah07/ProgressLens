import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./../css/ProgressReport.css";
import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	FileText,
	Bell,
	Settings,
	Download,
	Mail,
	Share2,
	Edit,
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

const API = import.meta.env.VITE_PMS_API;
const COMPONENT_LABELS = {
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

function Sidebar() {
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
					<TrendingUp size={20} />
					<span>Progress Monitoring</span>
				</a>
				<a href="#">
					<BarChart3 size={20} />
					<span>Error Pattern Analysis</span>
				</a>
				<a className="active">
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
}

export default function ProgressReport() {
	const [searchParams] = useSearchParams();
	const studentId = searchParams.get("studentId");

	const [report, setReport] = useState(null);
	const [student, setStudent] = useState(null);
	const [dashboard, setDashboard] = useState(null);
	const [aiRecs, setAiRecs] = useState(null);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState(null);
	const [editing, setEditing] = useState(false);
	const [editedComments, setEditedComments] = useState("");
	const [reportId] = useState(
		() =>
			`DAS-${new Date().getFullYear()}-PR-${Math.floor(Math.random() * 9000) + 1000}`,
	);

	useEffect(() => {
		if (!studentId) return;
		const loadingTimer = setTimeout(() => setLoading(true), 0);

		Promise.all([
			fetch(`${API}/api/students/${studentId}`).then((r) => r.json()),
			fetch(`${API}/api/progress/${studentId}/dashboard`).then((r) => r.json()),
			fetch(`${API}/api/reports/${studentId}/latest`)
				.then((r) => r.json())
				.catch(() => null),
		])
			.then(([studentData, dashboardData, reportData]) => {
				setStudent(studentData);
				setDashboard(dashboardData);
				if (reportData && !reportData.message) {
					setReport(reportData);
					setEditedComments(reportData.teacherObservations || "");
					setLoading(false);
				} else {
					// no existing report — auto generate
					setLoading(false);
					// trigger generation automatically
					setGenerating(true);
					fetch(`${API}/api/reports/${studentId}/generate`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ generatedBy: "Teacher" }),
					})
						.then((r) => r.json())
						.then(async (data) => {
							if (data.report) {
								setReport(data.report);
								setEditedComments(data.report.teacherObservations || "");
							}
							const aiRes = await fetch(
								`${API}/api/ai/${studentId}/recommendations`,
								{ method: "POST" },
							);
							const aiData = await aiRes.json();
							if (aiData.recommendations) setAiRecs(aiData.recommendations);
							setGenerating(false);
						})
						.catch(() => setGenerating(false));
				}
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			})
			.finally(() => clearTimeout(loadingTimer));
	}, [studentId]);

	const generateReport = async () => {
		setGenerating(true);
		try {
			const res = await fetch(`${API}/api/reports/${studentId}/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ generatedBy: "Teacher" }),
			});
			const data = await res.json();
			if (data.report) {
				setReport(data.report);
				setEditedComments(data.report.teacherObservations || "");
			}

			// also get AI recommendations
			const aiRes = await fetch(`${API}/api/ai/${studentId}/recommendations`, {
				method: "POST",
			});
			const aiData = await aiRes.json();
			if (aiData.recommendations) setAiRecs(aiData.recommendations);
		} catch (err) {
			setError(err.message);
		}
		setGenerating(false);
	};

	const saveEdits = async () => {
		if (!report?._id) return;
		try {
			const res = await fetch(`${API}/api/reports/${report._id}/edit`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ teacherObservations: editedComments }),
			});
			const data = await res.json();
			setReport(data);
			setEditing(false);
		} catch (err) {
			setError(err.message);
		}
	};

	const buildLineData = () => {
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
					backgroundColor: "rgba(26,60,110,0.08)",
					tension: 0.4,
					pointRadius: 5,
					fill: true,
				},
			],
		};
	};

	const buildRadarData = () => {
		if (!dashboard?.bandScore?.componentResults) return null;
		const entries = dashboard.bandScore.componentResults.filter(
			(c) => !c.skipped && c.score !== null && c.score !== undefined,
		);
		if (entries.length === 0) return null;
		return {
			labels: entries.map((c) => c.name.replace(/([A-Z])/g, " $1").trim()),
			datasets: [
				{
					label: "Score",
					data: entries.map((c) => c.score),
					borderColor: "#7c3aed",
					backgroundColor: "rgba(124,58,237,0.2)",
				},
			],
		};
	};

	if (loading || generating)
		return (
			<div className="pr-page">
				<Sidebar />
				<main className="pr-main">
					<p className="state-msg">
						{generating ? "Generating AI report..." : "Loading..."}
					</p>
				</main>
			</div>
		);

	if (error)
		return (
			<div className="pr-page">
				<Sidebar />
				<main className="pr-main">
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);

	const lineData = buildLineData();
	// const radarData = buildRadarData();

	return (
		<div className="pr-page">
			<Sidebar />
			<main className="pr-main">
				<header className="pr-topbar">
					<h2>DAS Assessment Portal</h2>
					<span className="pr-topbar-sub">Progress Report Preview</span>
				</header>

				{/* Generate button if no report */}
				{!report && (
					<div className="pr-generate-banner">
						<p>No report generated yet for this student.</p>
						<button
							className="pr-gen-btn"
							onClick={generateReport}
							disabled={generating}
						>
							{generating ? "Generating..." : "Generate AI Report"}
						</button>
					</div>
				)}

				{/* Report document */}
				{report && (
					<div className="pr-doc-wrapper">
						<div className="pr-doc">
							{/* Header */}
							<div className="pr-doc-header">
								<div className="pr-doc-title">
									<div className="pr-das-logo">
										🎓 Dyslexia Association of Singapore
									</div>
									<h1>Student Progress Report</h1>
									<p>
										Academic Year {new Date().getFullYear()} •{" "}
										{dashboard?.latestAssessment?.semester || "Latest Semester"}
									</p>
								</div>
								<div className="pr-report-id">
									<span className="pr-report-id-label">REPORT ID</span>
									<span className="pr-report-id-value">{reportId}</span>
								</div>
							</div>

							<hr className="pr-divider" />

							{/* Student info */}
							<div className="pr-student-section">
								<div className="pr-student-info">
									<div className="pr-student-avatar">
										{student?.studentId?.slice(0, 2).toUpperCase() || "ST"}
									</div>
									<div>
										<h2>{student?.studentId}</h2>
										<div className="pr-student-meta">
											<div>
												<span>Age / Level:</span> {student?.age || "—"} Years /{" "}
												{student?.schLevel || "—"}
											</div>
											<div>
												<span>Assessment Period:</span>{" "}
												{dashboard?.latestAssessment?.assessmentDate
													? new Date(
															dashboard.latestAssessment.assessmentDate,
														).toLocaleDateString("en-GB", {
															month: "short",
															year: "numeric",
														})
													: "—"}
											</div>
											<div>
												<span>Lead Educational Therapist:</span>{" "}
												{student?.teacherId || "—"}
											</div>
										</div>
									</div>
								</div>
								<div className="pr-overall-progress">
									<span className="pr-op-label">OVERALL PROGRESS</span>
									<span className="pr-op-score">
										{dashboard?.bandScore?.totalScore != null
											? `${dashboard.bandScore.totalScore}%`
											: "—"}
									</span>
									<span className="pr-op-tag">
										{dashboard?.bandScore?.passed ? "✓ Passed" : "In Progress"}
									</span>
								</div>
							</div>

							{/* Charts */}
							<div className="pr-charts">
								<div className="pr-chart-block">
									<h3>↗ Literacy Milestone Growth</h3>
									{lineData ? (
										<Line
											data={lineData}
											options={{
												responsive: true,
												plugins: { legend: { display: false } },
												scales: { y: { min: 0, max: 100 } },
											}}
										/>
									) : (
										<p className="state-msg">No data available</p>
									)}
								</div>
								<div className="pr-chart-block">
									<h3>◎ Component Breakdown</h3>
									{dashboard?.bandScore?.componentResults ? (
										<table className="pr-comp-table">
											<thead>
												<tr>
													<th>Component</th>
													<th>Score</th>
													<th>Pass Mark</th>
													<th>Weight</th>
													<th>Result</th>
												</tr>
											</thead>
											<tbody>
												{dashboard.bandScore.componentResults
													.filter((c) => !c.skipped)
													.map((c, i) => (
														<tr key={i}>
															<td className="pr-comp-name">
																{COMPONENT_LABELS[c.name] || c.name}
															</td>
															<td>
																{c.score !== null && c.score !== undefined
																	? c.score
																	: "—"}
															</td>
															<td>
																{c.passMark !== null && c.passMark !== undefined
																	? c.passMark
																	: "—"}
															</td>
															<td>{parseFloat(c.weight).toFixed(2)}%</td>
															<td
																className={
																	c.passed ? "pr-comp-pass" : "pr-comp-fail"
																}
															>
																{c.passed ? "Pass" : "Fail"}
															</td>
														</tr>
													))}
											</tbody>
										</table>
									) : (
										<p className="state-msg">No data available</p>
									)}
								</div>
							</div>

							{/* Therapist observations */}
							<div className="pr-section">
								<h3>≡ Therapist Observations</h3>
								{editing ? (
									<div className="pr-edit-block">
										<textarea
											value={editedComments}
											onChange={(e) => setEditedComments(e.target.value)}
											rows={5}
											className="pr-textarea"
										/>
										<div className="pr-edit-actions">
											<button className="pr-save-btn" onClick={saveEdits}>
												Save
											</button>
											<button
												className="pr-cancel-btn"
												onClick={() => setEditing(false)}
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<blockquote className="pr-quote">
										{report.teacherObservations ||
											"No observations recorded yet."}
									</blockquote>
								)}
							</div>

							{/* AI recommendations */}
							<div className="pr-ai-section">
								<h3>✦ AI-Driven Adaptive Recommendations</h3>
								{aiRecs ? (
									<div className="pr-ai-grid">
										<div className="pr-ai-item">
											<h4>{aiRecs.strengths ? "Strengths" : "Summary"}</h4>
											<p>{aiRecs.strengths || aiRecs.summary}</p>
										</div>
										<div className="pr-ai-item">
											<h4>Intervention Areas</h4>
											<p>{aiRecs.interventionAreas}</p>
										</div>
										<div className="pr-ai-item">
											<h4>Teaching Strategies</h4>
											<p>{aiRecs.teachingStrategies}</p>
										</div>
										<div className="pr-ai-item">
											<h4>Suggested Activities</h4>
											<p>{aiRecs.suggestedActivities}</p>
										</div>
									</div>
								) : (
									<div className="pr-ai-placeholder">
										<p>
											{report.interventionAreas ||
												"Generate the report to see AI recommendations."}
										</p>
										{!aiRecs && (
											<button
												className="pr-gen-btn"
												onClick={generateReport}
												disabled={generating}
											>
												{generating
													? "Generating..."
													: "Generate AI Recommendations"}
											</button>
										)}
									</div>
								)}
							</div>

							<hr className="pr-divider" />

							{/* Signatures */}
							<div className="pr-signatures">
								<div className="pr-sig">
									<div className="pr-sig-line" />
									<p>{student?.teacherId || "Lead Educational Therapist"}</p>
									<span>Lead Educational Therapist</span>
								</div>
								<div className="pr-sig">
									<div className="pr-sig-line" />
									<p>DAS Authorized</p>
									<span>Official Institutional Seal</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Bottom bar */}
				<div className="pr-bottom-bar">
					<button className="pr-edit-btn" onClick={() => setEditing(!editing)}>
						<Edit size={16} /> Edit Report
					</button>
					<button className="pr-download-btn">
						<Download size={16} /> Download PDF
					</button>
					<button className="pr-mail-btn">
						<Mail size={16} />
					</button>
					<button className="pr-share-btn">
						<Share2 size={16} />
					</button>
				</div>
			</main>
		</div>
	);
}
