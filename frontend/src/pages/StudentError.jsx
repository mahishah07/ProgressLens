import { useState } from "react";
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
	Eye,
	FileBarChart2,
} from "lucide-react";

const sampleText = [
	{ word: "Yesterday", error: null },
	{ word: " I ", error: null },
	{ word: "went", error: null },
	{ word: " to ", error: null },
	{ word: "the ", error: null },
	{ word: "p-a-r-c", error: "visual", tooltip: "Spelling: park" },
	{ word: " with ", error: null },
	{ word: "my ", error: null },
	{ word: "dog", error: "grammar", tooltip: "Missing article: my dog" },
	{ word: ". We ", error: null },
	{ word: "saw", error: null },
	{ word: " a ", error: null },
	{ word: "rabit", error: "visual", tooltip: "Spelling: rabbit" },
	{ word: " running ", error: null },
	{ word: "fast.", error: null },
	{ word: " The ", error: null },
	{ word: "son", error: "phonological", tooltip: "Phonological: sun" },
	{ word: " was ", error: null },
	{ word: "very ", error: null },
	{ word: "hot.", error: null },
	{ word: " I ", error: null },
	{ word: "eat", error: "grammar", tooltip: "Grammar: ate" },
	{ word: " my ", error: null },
	{ word: "lunch ", error: null },
	{ word: "under ", error: null },
	{ word: "a ", error: null },
	{ word: "tree.", error: null },
	{ word: " It ", error: null },
	{ word: "was ", error: null },
	{ word: "a ", error: null },
	{ word: "h-a-p-p-y", error: "visual", tooltip: "Spelling: happy" },
	{ word: " day ", error: null },
	{ word: "but ", error: null },
	{ word: "I ", error: null },
	{ word: "felt ", error: null },
	{ word: "ti-r-e-d", error: "phonological", tooltip: "Phonological: tired" },
	{ word: " after.", error: null },
];

const errorColors = {
	visual: "#ef4444",
	phonological: "#a855f7",
	grammar: "#22c55e",
};

const donutData = [
	{ label: "Letter Reversals", value: 35, color: "#1a3c6e" },
	{ label: "Spelling", value: 28, color: "#a855f7" },
	{ label: "Grammar", value: 22, color: "#22c55e" },
	{ label: "Missing Letters", value: 15, color: "#c4b5fd" },
];

function DonutChart({ data }) {
	const total = data.reduce((a, b) => a + b.value, 0);
	let offset = 0;
	const r = 60,
		cx = 80,
		cy = 80,
		stroke = 24;
	const circ = 2 * Math.PI * r;

	return (
		<svg width="160" height="160" viewBox="0 0 160 160">
			{data.map((d, i) => {
				const dash = (d.value / total) * circ;
				const gap = circ - dash;
				const el = (
					<circle
						key={i}
						cx={cx}
						cy={cy}
						r={r}
						fill="none"
						stroke={d.color}
						strokeWidth={stroke}
						strokeDasharray={`${dash} ${gap}`}
						strokeDashoffset={-offset}
						style={{
							transform: "rotate(-90deg)",
							transformOrigin: "80px 80px",
						}}
					/>
				);
				offset += dash;
				return el;
			})}
			<text
				x={cx}
				y={cy - 6}
				textAnchor="middle"
				fontSize="18"
				fontWeight="700"
				fill="#1a3c6e"
			>
				35%
			</text>
			<text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#888">
				REVERSALS
			</text>
		</svg>
	);
}

export default function StudentErrorAnalysis() {
	const [tooltip, setTooltip] = useState(null);

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
				<div className="sidebar-footer">
					<div className="avatar-small">SR</div>
					<div>
						<p className="footer-name">S. Richards</p>
						<p className="footer-role">Profile</p>
					</div>
				</div>
			</aside>

			<main className="sea-main">
				<header className="sea-topbar">
					<h2>DAS Assessment Portal</h2>
					<div className="sea-topbar-search">
						<Search size={16} />
						<input type="text" placeholder="Search students..." />
					</div>
					<div className="sea-topbar-avatar">MF</div>
				</header>

				<div className="sea-content">
					{/* Student header */}
					<div className="sea-student-header">
						<div className="sea-student-avatar">ST</div>
						<div className="sea-student-info">
							<h1>Sarah Tan</h1>
							<p>ID: DAS-2024-0892 &bull; Band 3</p>
						</div>
						<div className="sea-student-actions">
							<button className="sea-btn-secondary">
								<Eye size={16} /> Manual Writing
							</button>
							<button className="sea-btn-primary">
								<FileBarChart2 size={16} /> Generate Report
							</button>
						</div>
					</div>

					<div className="sea-grid">
						{/* Writing sample */}
						<div className="sea-card sea-writing">
							<div className="sea-card-header">
								<h3>≡ Latest Writing Sample</h3>
								<span className="sea-date">Dated: Oct 24, 2023</span>
							</div>
							<div className="sea-text-block">
								{sampleText.map((t, i) =>
									t.error ? (
										<span
											key={i}
											className={`sea-error sea-error-${t.error}`}
											onMouseEnter={() => setTooltip({ i, text: t.tooltip })}
											onMouseLeave={() => setTooltip(null)}
											style={{ position: "relative" }}
										>
											{t.word}
											{tooltip?.i === i && (
												<span className="sea-tooltip">{t.tooltip}</span>
											)}
										</span>
									) : (
										<span key={i}>{t.word}</span>
									),
								)}
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
							<h3>Most Common Error Types</h3>
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
							Sarah consistently struggles with{" "}
							<strong>visual-spatial letter forms</strong>, specifically b/d and
							p/q reversals. This pattern suggests a need for multisensory
							visual tracking exercises.
						</p>
						<div className="sea-interventions">
							<p className="sea-interventions-label">SUGGESTED INTERVENTIONS</p>
							<p>✓ Sandpaper letter tracing for b/d differentiation.</p>
							<p>✓ Phonemic awareness focus on vowel digraphs.</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
