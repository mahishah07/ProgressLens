import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/WritingReview.css";
import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	FileText,
	Bell,
	Settings,
	ZoomIn,
	Download,
	Check,
	X,
	Edit2,
} from "lucide-react";

const errors = [
	{
		id: 1,
		original: "saterday",
		corrected: "Saturday",
		category: "Spelling: Orthographic",
	},
	{
		id: 2,
		original: "suny",
		corrected: "sunny",
		category: "Spelling: Phonological",
	},
	{
		id: 3,
		original: "dawg",
		corrected: "dog",
		category: "Spelling: Phonological",
	},
	{
		id: 4,
		original: "runing",
		corrected: "running",
		category: "Spelling: Orthographic",
	},
	{
		id: 5,
		original: "bushs",
		corrected: "bushes",
		category: "Spelling: Morphological",
	},
	{
		id: 6,
		original: "helpd",
		corrected: "helped",
		category: "Spelling: Orthographic",
	},
	{
		id: 7,
		original: "verry",
		corrected: "very",
		category: "Spelling: Orthographic",
	},
	{
		id: 8,
		original: "icecreem",
		corrected: "ice cream",
		category: "Spelling: Phonological",
	},
];

const annotatedTokens = [
	"Last ",
	{ w: "saterday", t: "spelling" },
	", I went to the park. It was very ",
	{ w: "suny", t: "spelling" },
	" and hot. I saw a big ",
	{ w: "dawg", t: "spelling" },
	" ",
	{ w: "runing", t: "spelling" },
	" after a ball. The ball went into the ",
	{ w: "bushs", t: "grammar" },
	". I ",
	{ w: "helpd", t: "spelling" },
	' the man find it. He said "thank you" ',
	{ w: "verry", t: "spelling" },
	" much. We had an ",
	{ w: "icecreem", t: "spelling" },
	" after.",
];

const errorColors = {
	spelling: "#ef4444",
	grammar: "#3b82f6",
	punctuation: "#f59e0b",
};

export default function WritingReview() {
	const [current, setCurrent] = useState(0);
	const [note, setNote] = useState("");
	const [category, setCategory] = useState(errors[0].category);

	const err = errors[current];

	const handleAction = () => {
		if (current < errors.length - 1) setCurrent(current + 1);
	};

	return (
		<div className="wr-page">
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

			<main className="wr-main">
				<header className="wr-topbar">
					<h2>DAS Assessment Portal</h2>
					<span className="wr-topbar-mid">≡ Writing Sample</span>
					<span className="wr-ai-badge">✦ AI Confidence: 94.2%</span>
				</header>

				<div className="wr-content">
					{/* Left: Original */}
					<div className="wr-panel">
						<div className="wr-panel-header">
							<h3>Original Writing Sample</h3>
							<div className="wr-panel-actions">
								<button>
									<ZoomIn size={16} />
								</button>
								<button>
									<Download size={16} />
								</button>
							</div>
						</div>
						<div className="wr-original-doc">
							<p className="wr-doc-title">
								<em>The Magic Forest</em>
							</p>
							<p className="wr-doc-text">
								Last saterday, I went to the park. It was very suny and hot. I
								saw a big <span className="wr-underline-red">dawg</span> runing
								after a ball. The ball went into the{" "}
								<span className="wr-underline-red">bushs</span>. I helpd the man
								find it. He said thank you verry much. We had an icecreem after.
							</p>
							<div className="wr-illustration-placeholder">
								<Edit2 size={28} color="#ccc" />
								<span>Student's illustration of the "Magic Forest"</span>
							</div>
						</div>
					</div>

					{/* Right: Annotated + Queue */}
					<div className="wr-right">
						<div className="wr-panel">
							<div className="wr-panel-header">
								<h3>✦ AI Annotated Analysis</h3>
								<div className="wr-legend">
									{Object.entries(errorColors).map(([type, color]) => (
										<span key={type} className="wr-legend-item">
											<span
												className="wr-legend-dot"
												style={{ background: color }}
											/>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</span>
									))}
								</div>
							</div>
							<div className="wr-annotated-text">
								{annotatedTokens.map((t, i) =>
									typeof t === "string" ? (
										<span key={i}>{t}</span>
									) : (
										<span
											key={i}
											className="wr-annotated-error"
											style={{
												borderBottom: `2px solid ${errorColors[t.t] || "#888"}`,
											}}
										>
											{t.w}
										</span>
									),
								)}
							</div>
						</div>

						{/* Correction queue */}
						<div className="wr-panel wr-queue">
							<div className="wr-queue-header">
								<h3>Correction Queue ({errors.length} Detected Errors)</h3>
								<span className="wr-queue-badge">
									Item {current + 1} of {errors.length}
								</span>
							</div>

							<div className="wr-queue-body">
								<div className="wr-queue-left">
									<p className="wr-queue-label">DETECTED ERROR</p>
									<div className="wr-error-display">
										<span className="wr-original-word">"{err.original}"</span>
										<span className="wr-arrow">→</span>
										<span className="wr-corrected-word">"{err.corrected}"</span>
									</div>
									<div className="wr-actions">
										<button
											className="wr-action-btn wr-accept"
											onClick={() => handleAction("accept")}
										>
											<Check size={16} /> Accept
										</button>
										<button
											className="wr-action-btn wr-reject"
											onClick={() => handleAction("reject")}
										>
											<X size={16} /> Reject
										</button>
										<button className="wr-action-btn wr-edit">
											<Edit2 size={16} /> Edit
										</button>
									</div>
									<div className="wr-category">
										<p className="wr-queue-label">CATEGORY ASSIGNMENT</p>
										<select
											value={category}
											onChange={(e) => setCategory(e.target.value)}
										>
											<option>Spelling: Orthographic</option>
											<option>Spelling: Phonological</option>
											<option>Spelling: Morphological</option>
											<option>Grammar</option>
											<option>Punctuation</option>
										</select>
									</div>
								</div>

								<div className="wr-queue-right">
									<p className="wr-queue-label">PROFESSIONAL OBSERVATIONS</p>
									<textarea
										value={note}
										onChange={(e) => setNote(e.target.value)}
										placeholder="Add specific notes about Ethan's phonetic choices..."
									/>
									<button className="wr-finalize-btn">Finalize Review</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
