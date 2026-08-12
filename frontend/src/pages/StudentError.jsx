import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import "../css/Landing.css";
import "../css/StudentError.css";
import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	Bell,
	Settings,
	Search,
	FileBarChart2,
	BriefcaseBusiness,
	FileCheck2,
	UserRound,
	CalendarDays,
	GraduationCap,
	ArrowLeft,
} from "lucide-react";

console.log(import.meta.env);

const errorColors = {
	visual: "#ef4444",
	phonological: "#a855f7",
	grammar: "#22c55e",
	tense: "#d94f70",
	capitalisation: "#b32b42",
};

/*const donutData = [
	{ label: "Letter Reversals", value: 35, color: "#1a3c6e" },
	{ label: "Spelling", value: 28, color: "#a855f7" },
	{ label: "Grammar", value: 22, color: "#22c55e" },
	{ label: "Missing Letters", value: 15, color: "#c4b5fd" },
];*/

function DonutChart({ data }) {
	const total = data.reduce((a, b) => a + b.count, 0);
	const [hoveredItem, setHoveredItem] = useState(null);

	const r = 60;
	const cx = 80;
	const cy = 80;
	const stroke = 24;
	const circ = 2 * Math.PI * r;

	const circles = data.reduce(
		(acc, d, i) => {
			if (!d.count || total === 0) return acc;
			const dash = (d.count / total) * circ;
			const gap = circ - dash;

			const circle = (
				<circle
					key={i}
					cx={cx}
					cy={cy}
					r={r}
					fill="none"
					stroke={d.color}
					strokeWidth={stroke}
					strokeDasharray={`${dash} ${gap}`}
					strokeDashoffset={-acc.offset}
					onMouseEnter={() => setHoveredItem(d)}
					onMouseLeave={() => setHoveredItem(null)}
					style={{
						transform: "rotate(-90deg)",
						transformOrigin: "80px 80px",
						cursor: "pointer",
						opacity: hoveredItem && hoveredItem.key !== d.key ? 0.4 : 1,
						transition: "opacity 160ms ease",
					}}
				>
					<title>{`${d.label}: ${d.count}`}</title>
				</circle>
			);

			return {
				offset: acc.offset + dash,
				elements: [...acc.elements, circle],
			};
		},
		{ offset: 0, elements: [] }
	).elements;

	return (
		<svg width="160" height="160" viewBox="0 0 160 160">
			{circles}

			<text
				x={cx}
				y={cy}
				textAnchor="middle"
				fontSize="18"
				fontWeight="700"
			>
				{hoveredItem?.count ?? total}
			</text>
			<text x={cx} y={cy + 17} textAnchor="middle" fontSize="8" fill="#667085">
				{hoveredItem?.label || "Total errors"}
			</text>
		</svg>
	);
}

function ErrorBarChart({ data }) {
	const maximum = Math.max(1, ...data.map((item) => item.count));
	return (
		<div className="sea-bar-chart">
			{data.map((item) => (
				<div className="sea-bar-row" key={item.key}>
					<div className="sea-bar-label"><span>{item.label}</span><strong>{item.count}</strong></div>
					<div className="sea-bar-track">
						<div
							className="sea-bar-fill"
							style={{ width: `${(item.count / maximum) * 100}%`, background: item.color }}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

export default function StudentErrorAnalysis() {
    console.log("Component rendered");

    const { reportId } = useParams();
    const navigate = useNavigate();

    const API = import.meta.env.VITE_ERROR_API;
    const PMS_API = import.meta.env.VITE_PMS_API;

    console.log("reportId =", reportId);
    console.log("API =", API);

    const [report, setReport] = useState(null);
	const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [studentSearch, setStudentSearch] = useState("");
    const [studentSearching, setStudentSearching] = useState(false);
    const [chartView, setChartView] = useState("donut");

	const openStudentDashboard = async (event) => {
		event.preventDefault();
		const query = studentSearch.trim();
		if (!query) return;

		setStudentSearching(true);
		try {
			const response = await fetch(`${API}/api/students?q=${encodeURIComponent(query)}`);
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Unable to search for students.");

			let profiles = data?.students || data?.data || [];
			if (profiles.length === 0 && PMS_API) {
				const pmsResponse = await fetch(
					`${PMS_API}/api/progress/search?studentId=${encodeURIComponent(query)}`
				);
				const pmsData = await pmsResponse.json();
				if (!pmsResponse.ok) throw new Error(pmsData.message || "Unable to search the student directory.");
				profiles = Array.isArray(pmsData) ? pmsData : [];
			}

			const normalisedQuery = query.toLowerCase();
			const profile = profiles.find((item) => {
				const fullName = [item.firstName, item.lastName].filter(Boolean).join(" ").toLowerCase();
				return item.studentId?.toLowerCase() === normalisedQuery
					|| item.name?.toLowerCase() === normalisedQuery
					|| fullName === normalisedQuery;
			}) || profiles[0];

			if (!profile?.studentId) {
				alert(`No student found for “${query}”.`);
				return;
			}

			setStudentSearch("");
			navigate(`/error-dashboard/${encodeURIComponent(profile.studentId)}`);
		} catch (error) {
			alert(error.message);
		} finally {
			setStudentSearching(false);
		}
	};

	useEffect(() => {
    console.log("inside useEffect");

    async function loadReport() {
        console.log("inside loadReport");

        try {
            const response = await fetch(`${API}/api/reports/${reportId}`);

            console.log("response =", response);

            const text = await response.text();

            console.log("body =", text);

            const json = JSON.parse(text);

            if (json.success) {
                setReport(json.data);
            } else {
                setReport(null);
            }
        } catch (err) {
            console.error(err);
            setReport(null);
        } finally {
            setLoading(false);
        }
    }

    loadReport();
}, [API, reportId]);

	useEffect(() => {
	const studentId =
		report?.student?.studentId;

	if (!studentId || !PMS_API) {
		return;
	}

	const controller =
		new AbortController();

	const loadOverview = async () => {
		try {
			const response =
				await fetch(
					`${PMS_API}/api/progress/${encodeURIComponent(
						studentId,
					)}/overview`,
					{
						signal:
							controller.signal,
					},
				);

			const data =
				await response.json();

			if (
				response.ok &&
				!data.message
			) {
				setOverview(data);
			}

		} catch (error) {

			if (
				error.name !==
				"AbortError"
			) {
				console.warn(
					"Unable to load student overview:",
					error,
				);
			}

		}
	};

	loadOverview();

	return () =>
		controller.abort();

}, [report, PMS_API]);

	if (loading) {
    return <h2>Loading...</h2>;
	}
	if (!report) {
		return <h2>Report not found.</h2>;
	}
	const donutData = report.chartData ?? [];

	const studentId =
	report?.student?.studentId ||
	"Student";


const currentBand =
	overview?.latestNewBand ||
	overview?.currentBandLevel ||
	"—";


const studentCentre =
	overview?.student?.centreId ||
	overview?.student?.centre ||
	overview?.centre ||
	"—";


const lastAssessmentDate =
	overview?.lastAssessmentDate
		? new Date(
				overview.lastAssessmentDate,
			).toLocaleDateString(
				"en-SG",
				{
					day: "numeric",
					month: "short",
					year: "numeric",
				},
			)
		: "No assessment yet";

	return (
		<div className="sea-page">
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
					<Link to={`/student/${encodeURIComponent(report.student.studentId)}?view=dashboard`}>
						<TrendingUp size={20} />
						<span>Progress Monitoring</span>
					</Link>
					<div className="sea-nav-section">
						<span className="sea-nav-heading">ERROR ANALYSIS</span>
						<Link to={`/error-answer/${encodeURIComponent(report.student.studentId)}`} className="sea-nav-subitem">
							<FileCheck2 size={18} />
							<span>Reference-Based Analysis</span>
						</Link>
						<Link to={`/error-dashboard/${encodeURIComponent(report.student.studentId)}`} className="sea-nav-subitem active">
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

			<main className="sea-main">
				<header className="sea-topbar">
					<div className="sea-topbar-brand">
						<div>
							<h2>DAS Assessment Portal</h2>
							<span>Free-Form Analysis</span>
						</div>
					</div>
					<div className="sea-topbar-right">
					<form className="sea-topbar-search" onSubmit={openStudentDashboard}>
						<button type="submit" aria-label="Open student error dashboard" disabled={studentSearching}>
							<Search size={18} />
						</button>
						<input
							type="text"
							placeholder={studentSearching ? "Searching..." : "Search student by name or ID..."}
							value={studentSearch}
							onChange={(event) => setStudentSearch(event.target.value)}
							disabled={studentSearching}
						/>
					</form>
					<div className="sea-teacher-profile">
						<div className="sea-teacher-icon">
							<BriefcaseBusiness size={20} />
						</div>
						<div className="sea-teacher-copy">
							<strong>Educational Professional</strong>
							<span>DAS Teacher Portal</span>
						</div>
					</div>
					</div>
				</header>

				<div className="sea-content">
					{/* =================================================
    STUDENT PROFILE
    ================================================= */}

<section className="sea-student-profile-v2">

	{/* STUDENT */}

	<div className="sea-profile-v2-identity">

		<div className="sea-profile-v2-avatar">
			<UserRound size={30} />
		</div>


		<div className="sea-profile-v2-name">

			<h1>
				{studentId}
			</h1>

		</div>

	</div>


	{/* METADATA */}

	<div className="sea-profile-v2-meta">

		{/* LAST ASSESSMENT */}

		<div className="sea-profile-v2-meta-card">

			<div className="sea-profile-v2-meta-icon">
				<CalendarDays size={18} />
			</div>


			<div className="sea-profile-v2-meta-copy">

				<span className="sea-profile-v2-label">
					Last Assessment
				</span>


				<span className="sea-profile-v2-value">
					{lastAssessmentDate}
				</span>

			</div>

		</div>


		{/* BAND */}

		<div className="sea-profile-v2-meta-card">

			<div className="sea-profile-v2-meta-icon">
				<GraduationCap size={18} />
			</div>


			<div className="sea-profile-v2-meta-copy">

				<span className="sea-profile-v2-label">
					Assigned Band
				</span>


				<span className="sea-profile-v2-value sea-profile-v2-band">
					{currentBand}
				</span>

			</div>

		</div>


		{/* CENTRE */}

		<div className="sea-profile-v2-meta-card">

			<div className="sea-profile-v2-meta-icon">
				<BriefcaseBusiness size={18} />
			</div>


			<div className="sea-profile-v2-meta-copy">

				<span className="sea-profile-v2-label">
					Centre
				</span>


				<span className="sea-profile-v2-value">
					{studentCentre}
				</span>

			</div>

		</div>

	</div>

</section>


{/* =================================================
    ANALYSIS HEADING
    ================================================= */}

<div className="sea-analysis-header-v2">

	<div className="sea-analysis-header-v2-copy">

		<span className="sea-analysis-header-v2-eyebrow">
			FREE-FORM ANALYSIS
		</span>


		<h1>
			Assessment Analysis
		</h1>


		<p>
			Review the analysed writing sample,
			detected error patterns and recommended
			interventions.
		</p>

	</div>


	<div className="sea-analysis-header-v2-actions">

		<button
			type="button"
			className="sea-analysis-back-v2"
			onClick={() =>
				navigate(
					`/error-dashboard/${encodeURIComponent(
						studentId,
					)}`,
				)
			}
		>
			<ArrowLeft size={16} />

			Back
		</button>


		<button
			type="button"
			className="sea-analysis-report-v2"
			onClick={() =>
				navigate(
					`/error-report/${reportId}`,
				)
			}
		>
			<FileBarChart2 size={17} />

			Generate Report
		</button>

	</div>

</div>

					<div className="sea-grid">
						{/* Writing sample */}
						<div className="sea-card sea-writing">
    						<div className="sea-card-header">
        						<h3>≡ Writing Sample</h3>
        						<span className="sea-date">
            						Dated: {new Date(report.createdAt).toLocaleDateString()}
        						</span>
    						</div>

    						<div className="sea-text-block">
        						<p>
            						{report.writingSample.cleanedText ||
                					report.writingSample.ocrText}
        						</p>
    						</div>

    						<div className="sea-legend">
        						{Object.entries(errorColors).map(([type, color]) => (
            						<span key={type} className="sea-legend-item">
                						<span
											className="sea-legend-dot"
											style={{ background: color }}
                						/>
                						{type.charAt(0).toUpperCase() + type.slice(1)} Errors
            						</span>
        						))}
    						</div>
						</div>

						{/* Donut chart */}
						<div className="sea-card sea-donut">
							<div className="sea-chart-header">
								<h3>Error Type Classification</h3>
								<div className="sea-chart-toggle" aria-label="Chart view">
									<button className={chartView === "donut" ? "active" : ""} onClick={() => setChartView("donut")} type="button">◉ Donut</button>
									<button className={chartView === "bar" ? "active" : ""} onClick={() => setChartView("bar")} type="button">▥ Bar</button>
								</div>
							</div>
							{chartView === "donut" ? (
								<div className="sea-donut-chart"><DonutChart data={donutData} /></div>
							) : <ErrorBarChart data={donutData} />}
							<div className="sea-donut-legend">
								{donutData.map((d, i) => (
									<div key={i} className="sea-donut-item">
										<span
											className="sea-donut-dot"
											style={{ background: d.color }}
										/>
										<span>{d.label}</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* AI Pattern Analysis */}
					<div className="sea-ai-card sea-ai-recommendation">
						<div className="sea-ai-heading">
							<span>ANALYSIS SUMMARY</span>
							<h3>AI Pattern Analysis</h3>
						</div>
						<p className="sea-ai-overview">
							{report.interventionRecommendation.overview}
						</p>
						<div className="sea-interventions">
							<p className="sea-interventions-label">SUGGESTED INTERVENTIONS</p>
							{report.interventionRecommendation.interventions.map((item, i) => (
								<div className="sea-intervention-card" key={i}>
									<p>
										<strong>{item.title}</strong>
									</p>
									<p>{item.rationale}</p>
									<p>
										Activities: {item.activities.join(", ")}
									</p>
									<p>
										Frequency: {item.frequency}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
