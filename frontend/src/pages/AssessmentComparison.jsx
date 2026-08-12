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
	Download,
	Share2,
	Search,
	BriefcaseBusiness,
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

function ProgressSidebar({ studentId }) {
	const encodedId = encodeURIComponent(studentId || "");

	return (
		<aside className="sidebar">
			<div className="logo-section">
				<div className="logo-circle">DAS</div>
				<div><h2>DAS Teacher</h2><p>Educational Professional</p></div>
			</div>
			<nav>
				<Link to="/"><LayoutDashboard size={20} /><span>Dashboard</span></Link>
				<Link to={`/student/${encodedId}?view=dashboard`} className="sp-nav-progress active" aria-current="page">
					<TrendIcon size={20} /><span>Progress Monitoring</span>
				</Link>
				<div className="eo-nav-section">
					<span className="eo-nav-heading">ERROR ANALYSIS</span>
					<Link to={`/error-answer/${encodedId}`} className="eo-nav-subitem">
						<FileCheck2 size={18} /><span>Reference-Based Analysis</span>
					</Link>
					<Link to={`/error-dashboard/${encodedId}`} className="eo-nav-subitem">
						<BarChart3 size={19} /><span>Free-Form Analysis</span>
					</Link>
				</div>
				<a href="#"><Bell size={20} /><span>Notifications</span></a>
				<a href="#"><Settings size={20} /><span>Settings</span></a>
			</nav>
		</aside>
	);
}

function ComparisonTopbar({ search, setSearch, searching, onSearch }) {
	return (
		<header className="topbar eo-main-topbar">
			<div className="topbar-brand">
				<div>
					<h2>DAS Assessment Portal</h2>
					<span className="topbar-context">Progress Monitoring</span>
				</div>
			</div>
			<div className="eo-topbar-right">
				<form className="eo-navbar-search" onSubmit={onSearch}>
					<button type="submit" aria-label="Search student" disabled={searching}>
						<Search size={18} />
					</button>
					<input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={searching ? "Searching..." : "Search student by name or ID..."}
						disabled={searching}
					/>
				</form>
				<div className="eo-teacher-profile">
					<div className="eo-teacher-icon"><BriefcaseBusiness size={20} /></div>
					<div className="eo-teacher-copy">
						<strong>Educational Professional</strong>
						<span>DAS Teacher Portal</span>
					</div>
				</div>
			</div>
		</header>
	);
}

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

export default function AssessmentComparison() {
	const [searchParams] = useSearchParams();
	const studentId = searchParams.get("studentId");
	const navigate = useNavigate();

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [assessmentIdA, setAssessmentIdA] = useState("");
	const [assessmentIdB, setAssessmentIdB] = useState("");
	const [studentSearch, setStudentSearch] = useState("");
	const [studentSearching, setStudentSearching] = useState(false);

	const searchStudent = async (event) => {
		event.preventDefault();
		const query = studentSearch.trim();
		if (!query) return;

		setStudentSearching(true);
		try {
			const response = await fetch(`${API}/api/progress/search?studentId=${encodeURIComponent(query)}`);
			const results = await response.json();
			if (!response.ok) throw new Error(results.message || "Unable to search students.");
			const profile = Array.isArray(results) ? results[0] : null;
			if (!profile?.studentId) throw new Error("Student not found.");
			setStudentSearch("");
			navigate(`/student/${encodeURIComponent(profile.studentId)}?view=dashboard`);
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

	// initial load — gets full history + default (first vs latest) comparison
	useEffect(() => {
		if (!studentId) return;
		setLoading(true);
		fetch(`${API}/api/comparison/${studentId}`)
			.then((r) => r.json())
			.then((d) => {
				if (d.message && d.status !== "insufficient_data")
					throw new Error(d.message);
				setData(d);
				if (d.selectedA?._id) setAssessmentIdA(d.selectedA._id);
				if (d.selectedB?._id) setAssessmentIdB(d.selectedB._id);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, [studentId]);

	// re-fetch whenever the user picks different assessments
	const fetchComparison = (idA, idB) => {
		if (!idA || !idB || idA === idB) return;
		setLoading(true);
		fetch(
			`${API}/api/comparison/${studentId}?assessmentIdA=${idA}&assessmentIdB=${idB}`,
		)
			.then((r) => r.json())
			.then((d) => {
				if (d.message && d.status !== "insufficient_data")
					throw new Error(d.message);
				setData(d);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	};

	const handleSelectA = (id) => {
		setAssessmentIdA(id);
		fetchComparison(id, assessmentIdB);
	};

	const handleSelectB = (id) => {
		setAssessmentIdB(id);
		fetchComparison(assessmentIdA, id);
	};

	const buildBarData = () => {
		if (!data?.componentComparison) return { before: null, after: null };
		const entries = Object.entries(data.componentComparison).slice(0, 8);

		const before = {
			labels: entries.map(([k]) => SKILL_LABELS[k] || k),
			datasets: [
				{
					label: "Earlier",
					data: entries.map(([, v]) => v.before ?? 0),
					backgroundColor: "rgba(200,210,230,0.8)",
					borderRadius: 4,
				},
			],
		};
		const after = {
			labels: entries.map(([k]) => SKILL_LABELS[k] || k),
			datasets: [
				{
					label: "Latest",
					data: entries.map(([, v]) => v.after ?? 0),
					backgroundColor: "#1a3c6e",
					borderRadius: 4,
				},
			],
		};
		return { before, after };
	};

	const buildVarianceRows = () => {
		if (!data?.componentComparison) return [];
		return Object.entries(data.componentComparison).map(([key, val]) => ({
			skill: SKILL_LABELS[key] || key,
			before: val.before,
			after: val.after,
			beforePassed: val.beforePassed,
			afterPassed: val.afterPassed,
			change: val.change,
			bothTaken: val.bothTaken,
		}));
	};

	if (loading && !data)
		return (
			<div className="ac-page eo-page sp-page">
				<ProgressSidebar studentId={studentId} />
				<main className="ac-main">
					{topbar}
					<p className="state-msg">Loading comparison...</p>
				</main>
			</div>
		);

	if (error)
		return (
			<div className="ac-page eo-page sp-page">
				<ProgressSidebar studentId={studentId} />
				<main className="ac-main">
					{topbar}
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);

	if (!data || data.status === "insufficient_data")
		return (
			<div className="ac-page eo-page sp-page">
				<ProgressSidebar studentId={studentId} />
				<main className="ac-main">
					{topbar}
					<p className="state-msg">
						{data?.message ||
							"At least one assessment is required to generate a comparison."}
					</p>
					<button className="ac-back-btn" onClick={() => navigate(-1)}>
						Go Back
					</button>
				</main>
			</div>
		);

	const { before: earlierBarData, after: laterBarData } = buildBarData();
	const varianceRows = buildVarianceRows();
	const bandDir = data.bandChange?.direction;
	const bandSteps = data.bandChange?.steps;
	const transitions = data.transitions;

	return (
		<div className="ac-page eo-page sp-page">
			<ProgressSidebar studentId={studentId} />
			<main className="ac-main">
				{topbar}

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

				{/* Assessment selectors */}
				<div className="ac-selector-bar">
					<div className="ac-selector-group">
						<label>Assessment A</label>
						<select
							value={assessmentIdA}
							onChange={(e) => handleSelectA(e.target.value)}
						>
							{data.assessmentHistory?.map((a) => (
								<option key={a._id} value={a._id}>
									{a.semester} (
									{new Date(a.assessmentDate).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "short",
										year: "numeric",
									})}
									)
								</option>
							))}
						</select>
					</div>
					<div className="ac-selector-group">
						<label>Assessment B</label>
						<select
							value={assessmentIdB}
							onChange={(e) => handleSelectB(e.target.value)}
						>
							{data.assessmentHistory?.map((a) => (
								<option key={a._id} value={a._id}>
									{a.semester} (
									{new Date(a.assessmentDate).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "short",
										year: "numeric",
									})}
									)
								</option>
							))}
						</select>
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
						<p className="ac-summary-label">PASS / FAIL TRANSITIONS</p>
						<h2 className={transitions?.newlyPassing > 0 ? "ac-positive" : ""}>
							+{transitions?.newlyPassing || 0} / -
							{transitions?.newlyFailing || 0}
						</h2>
						<p className="ac-summary-sub">
							Components newly passing / newly failing
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
							{data.selectedA?.teacherComments ||
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
							{data.selectedB?.teacherComments ||
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
									<td
										className={
											row.bothTaken
												? row.beforePassed
													? "ac-cell-pass"
													: "ac-cell-fail"
												: ""
										}
									>
										{row.before !== null && row.before !== undefined
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
										{row.after !== null && row.after !== undefined
											? row.after
											: "—"}
									</td>
									<td
										className={
											row.change > 0
												? "ac-positive"
												: row.change < 0
													? "ac-negative"
													: ""
										}
									>
										{row.bothTaken && row.change !== null
											? `${row.change > 0 ? "+" : ""}${row.change}%`
											: "—"}
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
