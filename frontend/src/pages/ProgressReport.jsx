import { useState, useEffect, useMemo } from "react";
import {
	Link,
	useNavigate,
	useSearchParams,
} from "react-router-dom";

import "./../css/Landing.css";
import "./../css/ErrorOptions.css";
import "./../css/StudentProgress.css";
import "./../css/ProgressReport.css";
import {
	LayoutDashboard,
	TrendingUp as TrendIcon,
	BarChart3,
	FileCheck2,
	Bell,
	Settings,
	Printer,
	Share2,
	Search,
	BriefcaseBusiness,
	ArrowLeft,
} from "lucide-react";
import { Line} from "react-chartjs-2";
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

function Sidebar({ studentId }) {
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
				<Link
					to={`/student/${encodedId}?view=dashboard`}
					className="sp-nav-progress active"
					aria-current="page"
				>
					<TrendIcon size={20} />
					<span>Progress Monitoring</span>
				</Link>

				<div className="eo-nav-section">
					<span className="eo-nav-heading">ERROR ANALYSIS</span>

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

function ReportTopbar({
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
						type="text"
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

						<span>
							DAS Teacher Portal
						</span>
					</div>
				</div>
			</div>
		</header>
	);
}

export default function ProgressReport() {
	const [searchParams] = useSearchParams();
	const studentId = searchParams.get("studentId");

	const navigate = useNavigate();

	const [studentSearch, setStudentSearch] = useState("");
	const [studentSearching, setStudentSearching] = useState(false);

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
			`DAS-${new Date().getFullYear()}-PR-${
				Math.floor(Math.random() * 9000) + 1000
			}`,
	);



	const openStudentDashboard = async (event) => {
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

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.message ||
					"Unable to search the student directory.",
			);
		}

		const profiles = Array.isArray(data)
			? data
			: [];

		const normalised = query.toLowerCase();

		const profile =
			profiles.find((student) => {
				const fullName = [
					student.firstName,
					student.lastName,
				]
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

		navigate(
			`/student/${encodeURIComponent(
				profile.studentId,
			)}?view=dashboard`,
		);
	} catch (err) {
		alert(err.message);
	} finally {
		setStudentSearching(false);
	}
};
	const backToStudentProgress = () => {
	if (!studentId) {
		navigate("/");
		return;
	}

	navigate(
		`/student/${encodeURIComponent(
			studentId,
		)}?view=dashboard`,
	);
};


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
				body: JSON.stringify({
					teacherObservations: editedComments,
					expectedVersion: report.__v,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Unable to save report changes");
			setReport(data);
			setEditing(false);
		} catch (err) {
			setError(err.message);
		}
	};

	const handleExportPDF = () => {
		if (!studentId) return;
		const printUrl = `${window.location.origin}/progress-report?studentId=${studentId}&print=true`;
		window.open(printUrl, "_blank");
	};

	const handleShare = async () => {
		const shareData = {
			title: "DAS Progress Report",
			text: `Progress report for student ${studentId}`,
			url: window.location.href,
		};

		if (navigator.share) {
			await navigator.share(shareData);
			return;
		}

		await navigator.clipboard.writeText(window.location.href);
	};

	const lastUpdated = useMemo(() => {
		const timestamp = report?.updatedAt || report?.createdAt;
		if (!timestamp) return null;
		return new Date(timestamp).toLocaleDateString("en-SG", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	}, [report?.updatedAt, report?.createdAt]);

	useEffect(() => {
		const shouldPrint = searchParams.get("print") === "true";
		if (shouldPrint && report && !loading) {
			const timer = setTimeout(() => window.print(), 500);
			return () => clearTimeout(timer);
		}
	}, [report, loading, searchParams]);

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
					borderColor: "#8f1f30",
					backgroundColor: "rgba(143, 31, 48, 0.08)",
					tension: 0.4,
					pointRadius: 5,
					fill: true,
				},
			],
		};
	};

	if (loading || generating) {
		return (
			<div className="pr-page eo-page sp-page">
				<Sidebar studentId={studentId} />

				<main className="pr-main">
					<ReportTopbar
						search={studentSearch}
						setSearch={setStudentSearch}
						searching={studentSearching}
						onSearch={openStudentDashboard}
					/>

					<p className="state-msg">
						{generating
							? "Generating AI report..."
							: "Loading..."}
					</p>
				</main>
			</div>
		);
	}

	if (error) {
		return (
			<div className="pr-page eo-page sp-page">
				<Sidebar studentId={studentId} />

				<main className="pr-main">
					<ReportTopbar
						search={studentSearch}
						setSearch={setStudentSearch}
						searching={studentSearching}
						onSearch={openStudentDashboard}
					/>

					<p className="state-msg error">
						{error}
					</p>

					<div className="pr-error-back">
						<button
							className="pr-back-progress"
							onClick={backToStudentProgress}
						>
							<ArrowLeft size={17} />
							Back to Student Progress
						</button>
					</div>
				</main>
			</div>
		);
	}

	const lineData = buildLineData();
	// const radarData = buildRadarData();

	return (
		<div className="pr-page eo-page sp-page">
			<Sidebar studentId={studentId} />
			<main className="pr-main">
				<ReportTopbar
					search={studentSearch}
					setSearch={setStudentSearch}
					searching={studentSearching}
					onSearch={openStudentDashboard}
				/>

				<div className="pr-report-toolbar">
					<button
						type="button"
						className="pr-back-progress"
						onClick={backToStudentProgress}
					>
						<ArrowLeft size={17} />
						Back to Student Progress
					</button>

					<div className="pr-report-toolbar-actions">
						<span className="pr-last-updated">
							{lastUpdated
								? `Last updated: ${lastUpdated}`
								: ""}
						</span>

						<button
							type="button"
							className="pr-print-btn"
							onClick={handleExportPDF}
						>
							<Printer size={17} />
							Print Report
						</button>
					</div>
				</div>

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
										Dyslexia Association of Singapore
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

			</main>
		</div>
	);
}
