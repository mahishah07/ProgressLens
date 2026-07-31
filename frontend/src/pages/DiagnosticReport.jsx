import { Link } from "react-router-dom";
import "../css/DiagnosticReport.css";
import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	FileText,
	Bell,
	Settings,
	Printer,
	Download,
	Share2,
} from "lucide-react";

const errorData = [
	{ label: "Vowel Digraphs", value: 78, color: "#1a3c6e" },
	{ label: "Consonant Blends", value: 45, color: "#7c3aed" },
	{ label: "Silent 'E' Patterns", value: 62, color: "#22c55e" },
];

const interventions = [
	{
		num: 1,
		title: "Multi-Sensory Vowel Training",
		desc: "Focus on 'ai' and 'ay' digraphs using sand tracing and phoneme-grapheme mapping exercises.",
		freq: "(3 sessions/week)",
	},
	{
		num: 2,
		title: "Morphological Awareness Drills",
		desc: "Structured practice in identifying prefixes and suffixes to reduce whole-word visual guessing.",
		freq: "(2 sessions/week)",
	},
	{
		num: 3,
		title: "Assistive Technology Adaptation",
		desc: "Introduce speech-to-text tools for initial draft generation to reduce cognitive load during creative writing tasks.",
		freq: "",
	},
];

export default function DiagnosticReport() {
	return (
		<div className="dr-page">
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

			<main className="dr-main">
				<header className="dr-topbar">
					<h2>DAS Assessment Portal</h2>
					<div className="dr-topbar-actions">
						<button className="dr-btn-primary">
							<Printer size={15} /> Print Report
						</button>
						<button className="dr-btn-secondary">
							<Download size={15} /> Download PDF
						</button>
						<span className="dr-updated">Last updated: Oct 24, 2023</span>
						<button className="dr-icon-btn">
							<Share2 size={16} />
						</button>
					</div>
				</header>

				<div className="dr-doc-wrapper">
					<div className="dr-doc">
						{/* Header */}
						<div className="dr-doc-header">
							<div>
								<h1>Diagnostic Assessment Report</h1>
								<p className="dr-org">
									Dyslexia Association of Singapore (DAS)
								</p>
							</div>
							<div className="dr-report-meta">
								<p className="dr-meta-label">
									REPORT ID: <strong>#AR-2023-9042</strong>
								</p>
								<p className="dr-meta-label">
									Assessment Date: <strong>20 Oct 2023</strong>
								</p>
							</div>
						</div>

						<hr className="dr-divider" />

						{/* Student profile */}
						<h2 className="dr-section-title">👤 Student Profile</h2>
						<div className="dr-profile-grid">
							<div>
								<p className="dr-field-label">FULL NAME</p>
								<p className="dr-field-value">Ethan Tan Wei Lun</p>
							</div>
							<div>
								<p className="dr-field-label">AGE / LEVEL</p>
								<p className="dr-field-value">9 Years / Primary 3</p>
							</div>
							<div>
								<p className="dr-field-label">ASSESSOR</p>
								<p className="dr-field-value">Mrs. Sarah Richards</p>
							</div>
							<div>
								<p className="dr-field-label">RISK INDICATOR</p>
								<span className="dr-risk-badge">High Focus Required</span>
							</div>
							<div>
								<p className="dr-field-label">LANGUAGE</p>
								<p className="dr-field-value">English (L1)</p>
							</div>
							<div>
								<p className="dr-field-label">LAST REVIEW</p>
								<p className="dr-field-value">15 Aug 2023</p>
							</div>
						</div>

						<hr className="dr-divider" />

						{/* Error frequency */}
						<h2 className="dr-section-title">📊 Error Frequency Analysis</h2>
						<div className="dr-error-grid">
							<div className="dr-error-bars">
								<p className="dr-bars-title">Phonological Awareness Deficits</p>
								{errorData.map((d, i) => (
									<div key={i} className="dr-bar-item">
										<div className="dr-bar-label-row">
											<span>{d.label}</span>
											<span>{d.value}%</span>
										</div>
										<div className="dr-bar-bg">
											<div
												className="dr-bar-fill"
												style={{ width: `${d.value}%`, background: d.color }}
											/>
										</div>
									</div>
								))}
							</div>
							<div className="dr-ai-recognition">
								<div className="dr-ai-icon">🎯</div>
								<h3>AI Pattern Recognition</h3>
								<p>
									Ethan consistently exhibits "Visual Morphological Errors." He
									tends to guess words based on their initial letter and overall
									shape, frequently substituting "there" for "three" or "quiet"
									for "quite."
								</p>
							</div>
						</div>

						<hr className="dr-divider" />

						{/* Evidence */}
						<h2 className="dr-section-title">
							≡ Evidence: Writing Samples Preview
						</h2>
						<div className="dr-samples-grid">
							<div className="dr-sample-img">
								<div className="dr-handwriting-mock">
									<p
										style={{
											fontFamily: "cursive",
											fontSize: "0.85rem",
											color: "#555",
											lineHeight: 1.9,
										}}
									>
										omain dail-
										<br />
										<span className="dr-circle-error">p-a-r-c</span> running
										fast.
										<br />
										10 dichiver er-
										<br />
										<span className="dr-circle-error">rabit</span> after me.
									</p>
								</div>
							</div>
							<div className="dr-sample-typed">
								<p>Please your bag woo tate ron gootall im settheps.</p>
							</div>
						</div>

						<hr className="dr-divider" />

						{/* Interventions */}
						<div className="dr-interventions-card">
							<h2 className="dr-interventions-title">Targeted Interventions</h2>
							{interventions.map((item) => (
								<div key={item.num} className="dr-intervention-item">
									<div className="dr-intervention-num">{item.num}</div>
									<div>
										<p className="dr-intervention-title">{item.title}</p>
										<p className="dr-intervention-desc">
											{item.desc} {item.freq && <em>{item.freq}</em>}
										</p>
									</div>
								</div>
							))}
						</div>

						<hr className="dr-divider" />

						{/* Summary */}
						<h2 className="dr-section-title">
							Assessor's Professional Summary
						</h2>
						<blockquote className="dr-summary">
							"Ethan has shown remarkable resilience in his learning journey.
							While the diagnostic data indicates significant phonological
							hurdles, his oral vocabulary and comprehension are well above
							grade level. Our primary objective for the next quarter is to
							bridge the gap between his cognitive potential and his written
							output through the specified interventions. Parent engagement in
							nightly reading reinforcement is strongly advised."
						</blockquote>

						<hr className="dr-divider" />

						{/* Signature */}
						<div className="dr-signatures">
							<div className="dr-sig">
								<p className="dr-sig-name">S. Richards</p>
								<div className="dr-sig-line" />
								<p className="dr-sig-label">
									LEAD EDUCATIONAL THERAPIST SIGNATURE
								</p>
								<p className="dr-sig-sub">License #DAS-304-99</p>
							</div>
							<div className="dr-sig dr-sig-right">
								<p className="dr-sig-sub">
									Generated by DAS Assessment Engine v4.2
								</p>
								<p className="dr-sig-sub">October 24, 2023</p>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
