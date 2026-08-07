import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import "../css/StudentError.css";
import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	FileText,
	Bell,
	Settings,
	Search,
	FileBarChart2,
} 
from "lucide-react";

console.log(import.meta.env);

const errorColors = {
	visual: "#ef4444",
	phonological: "#a855f7",
	grammar: "#22c55e",
};

/*const donutData = [
	{ label: "Letter Reversals", value: 35, color: "#1a3c6e" },
	{ label: "Spelling", value: 28, color: "#a855f7" },
	{ label: "Grammar", value: 22, color: "#22c55e" },
	{ label: "Missing Letters", value: 15, color: "#c4b5fd" },
];*/

function DonutChart({ data }) {
	const total = data.reduce((a, b) => a + b.count, 0);

	const r = 60;
	const cx = 80;
	const cy = 80;
	const stroke = 24;
	const circ = 2 * Math.PI * r;

	const circles = data.reduce(
		(acc, d, i) => {
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
					style={{
						transform: "rotate(-90deg)",
						transformOrigin: "80px 80px",
					}}
				/>
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
				{total}
			</text>
		</svg>
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
    const [loading, setLoading] = useState(true);
    const [studentSearch, setStudentSearch] = useState("");
    const [studentSearching, setStudentSearching] = useState(false);

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

	if (loading) {
    return <h2>Loading...</h2>;
	}
	if (!report) {
		return <h2>Report not found.</h2>;
	}
	const donutData = report.chartData ?? [];

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
					<a href="#">
						<TrendingUp size={20} />
						<span>Progress Monitoring</span>
					</a>
					<a className="active">
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
			</aside>

			<main className="sea-main">
				<header className="sea-topbar">
					<h2>DAS Assessment Portal</h2>
					<form className="sea-topbar-search" onSubmit={openStudentDashboard}>
						<button type="submit" aria-label="Open student error dashboard" disabled={studentSearching}>
							<Search size={16} />
						</button>
						<input
							type="text"
							placeholder={studentSearching ? "Searching..." : "Search student by name or ID..."}
							value={studentSearch}
							onChange={(event) => setStudentSearch(event.target.value)}
							disabled={studentSearching}
						/>
					</form>
					<div className="sea-topbar-avatar">MF</div>
				</header>

				<div className="sea-content">
					{/* Student header */}
					<div className="sea-student-header">
						<div className="sea-student-avatar">ST</div>
						<div className="sea-student-info">
							<h1>{report.student.firstName} {report.student.lastName}</h1>
							<p>{report.student.studentId}</p>
						</div>
						<div className="sea-student-actions">
							<button className="sea-btn-primary">
								<FileBarChart2 size={16} /> Generate Report
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
          <h3>Error Type Classification</h3>
							<div className="sea-donut-chart">
								<DonutChart data={donutData} />
							</div>
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
					<div className="sea-ai-card">
						<h3>✦ AI Pattern Analysis</h3>
						<p>
							{report.interventionRecommendation.overview}
						</p>
						<div className="sea-interventions">
							<p className="sea-interventions-label">SUGGESTED INTERVENTIONS</p>
							{report.interventionRecommendation.interventions.map((item, i) => (
								<div key={i}>
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
