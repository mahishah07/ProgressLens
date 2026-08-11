import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
	User,
	Sparkles,
	FileCheck2,
} from "lucide-react";

const ERROR_API = import.meta.env.VITE_ERROR_API;
const PMS_API = import.meta.env.VITE_PMS_API;

function formatDate(date) {
	if (!date) return "—";

	const parsed = new Date(date);

	if (Number.isNaN(parsed.getTime())) return "—";

	return parsed.toLocaleDateString("en-SG", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

/* function getRiskLevel(errorCount) {
	if (errorCount >= 10) {
		return {
			label: "High Focus Required",
			className: "dr-risk-high",
		};
	}

	if (errorCount >= 5) {
		return {
			label: "Moderate Focus",
			className: "dr-risk-medium",
		};
	}

	return {
		label: "Monitor Progress",
		className: "dr-risk-low",
	};
} */

export default function DiagnosticReport() {
	const { reportId } = useParams();

	const [report, setReport] = useState(null);
	const [student, setStudent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadReport() {
			try {
				setLoading(true);
				setError("");

				if (!ERROR_API) {
					throw new Error("Error Analyser API is not configured.");
				}

				const reportResponse = await fetch(
					`${ERROR_API}/api/reports/${reportId}`
				);

				const reportJson = await reportResponse.json();

				if (!reportResponse.ok || !reportJson.success) {
					throw new Error(
						reportJson.error || "Unable to load diagnostic report."
					);
				}

				const reportData = reportJson.data;
				setReport(reportData);

				/*
				 * The AnalysisReport is populated with the student's
				 * Error Analyser profile. We then use the student's
				 * studentId to retrieve the richer PMS profile,
				 * including summaryBand.
				 */
				const studentId = reportData?.student?.studentId;

				if (!studentId) {
					throw new Error(
						"Student ID is missing from this diagnostic report."
					);
				}

				if (!PMS_API) {
					throw new Error("PMS API is not configured.");
				}

				const studentResponse = await fetch(
					`${PMS_API}/api/students/${encodeURIComponent(studentId)}`
				);

				if (!studentResponse.ok) {
					const studentJson = await studentResponse.json().catch(() => ({}));

					throw new Error(
						studentJson.message || "Unable to load student profile."
					);
				}

				const studentData = await studentResponse.json();
				setStudent(studentData);
			} catch (err) {
				console.error("Failed to load diagnostic report:", err);
				setError(err.message || "Unable to load diagnostic report.");
			} finally {
				setLoading(false);
			}
		}

		if (reportId) {
			loadReport();
		}
	}, [reportId]);

	if (loading) {
		return (
			<div className="dr-loading">
				<div className="dr-loading-card">
					<div className="dr-loading-spinner" />
					<h2>Loading Diagnostic Report</h2>
					<p>Retrieving the student's assessment and analysis...</p>
				</div>
			</div>
		);
	}

	if (error || !report || !student) {
		return (
			<div className="dr-loading">
				<div className="dr-loading-card">
					<h2>Unable to Load Report</h2>
					<p>{error || "Diagnostic report could not be found."}</p>
					<Link to="/" className="dr-back-link">
						Return to Dashboard
					</Link>
				</div>
			</div>
		);
	}

	const writingSample = report.writingSample || {};
	const recommendation = report.interventionRecommendation || {};
	const chartData = report.chartData || [];
	const errors = report.errors || [];

	const totalErrors =
		report.errorCounts?.total ??
		report.summary?.errorCount ??
		errors.length;

	// const risk = getRiskLevel(totalErrors);

	const assessmentDate =
		report.analysedAt || report.createdAt || writingSample.createdAt;

	const lastReview = report.updatedAt || assessmentDate;

	return (
		<div className="dr-page">
			{/* Sidebar */}
			<aside className="dr-sidebar">
				<div className="dr-logo-section">
					<div className="dr-logo-circle">DAS</div>

					<div>
						<h2>DAS Teacher</h2>
						<p>Educational Professional</p>
					</div>
				</div>

				<nav className="dr-nav">
					<Link to="/">
						<LayoutDashboard size={20} />
						<span>Dashboard</span>
					</Link>

					<Link to={`/student/${encodeURIComponent(report.student.studentId)}?view=dashboard`}>
						<TrendingUp size={20} />
						<span>Progress Monitoring</span>
					</Link>

					<div className="dr-nav-section">
						<span className="dr-nav-heading">ERROR ANALYSIS</span>
						<Link to={`/error-answer/${encodeURIComponent(report.student.studentId)}`} className="dr-nav-subitem">
							<FileCheck2 size={18} />
							<span>Reference-Based Analysis</span>
						</Link>
						<Link to={`/error-dashboard/${encodeURIComponent(report.student.studentId)}`} className="dr-nav-subitem active">
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

			<main className="dr-main">
				{/* Top bar */}
				<header className="dr-topbar">
					<h2>DAS Assessment Portal</h2>

					<div className="dr-topbar-actions">
						<button
							className="dr-btn-primary"
							onClick={() => window.print()}
						>
							<Printer size={15} />
							Print Report
						</button>

						<button
							className="dr-btn-secondary"
							onClick={() => window.print()}
						>
							<Download size={15} />
							Download PDF
						</button>

						<span className="dr-updated">
							Last updated: {formatDate(lastReview)}
						</span>

						<button className="dr-icon-btn" title="Share report">
							<Share2 size={16} />
						</button>
					</div>
				</header>

				<div className="dr-doc-wrapper">
					<div className="dr-doc">
						{/* Report Header */}
						<div className="dr-doc-header">
							<div>
								<h1>Diagnostic Assessment Report</h1>
								<p className="dr-org">
									Dyslexia Association of Singapore (DAS)
								</p>
							</div>

							<div className="dr-report-meta">
								<p className="dr-meta-label">
									REPORT ID:{" "}
									<strong>#{String(report._id).slice(-8).toUpperCase()}</strong>
								</p>

								<p className="dr-meta-label">
									Assessment Date:{" "}
									<strong>{formatDate(assessmentDate)}</strong>
								</p>
							</div>
						</div>

						<hr className="dr-divider" />

						{/* Student Profile */}
						<div className="dr-section-heading">
							<User size={18} />
							<h2 className="dr-section-title">Student Profile</h2>
						</div>

						<div className="dr-profile-grid">
							<div className="dr-profile-field">
								<p className="dr-field-label">STUDENT ID</p>
								<p className="dr-field-value">
									{student.studentId || report.student.studentId || "—"}
								</p>
							</div>

							<div className="dr-profile-field">
								<p className="dr-field-label">CENTRE</p>
								<p className="dr-field-value">
									{student.centreId || "—"}
								</p>
							</div>

							<div className="dr-profile-field">
								<p className="dr-field-label">LEVEL</p>
								<p className="dr-field-value">
									{student.schLevel || "—"}
								</p>
							</div>

							<div className="dr-profile-field">
								<p className="dr-field-label">BAND LEVEL</p>
								<p className="dr-field-value dr-band-value">
									{student.summaryBand || "—"}
								</p>
							</div>

							<div className="dr-profile-field">
								<p className="dr-field-label">ASSESSMENT DATE</p>
								<p className="dr-field-value">
									{formatDate(assessmentDate)}
								</p>
							</div>
						</div>

						<hr className="dr-divider" />

						{/* Assessment Overview */}
						<div className="dr-section-heading">
							<BarChart3 size={18} />
							<h2 className="dr-section-title">
								Error Frequency Analysis
							</h2>
						</div>

						<div className="dr-error-grid">
							<div className="dr-error-bars">
								<div className="dr-bars-header">
									<div>
										<p className="dr-bars-title">
											Error Type Distribution
										</p>
										<p className="dr-bars-subtitle">
											Based on the student's analysed writing sample
										</p>
									</div>

									<div className="dr-total-errors">
										<strong>{totalErrors}</strong>
										<span>Total Errors</span>
									</div>
								</div>

								{chartData.length > 0 ? (
									chartData.map((item) => (
										<div key={item.key} className="dr-bar-item">
											<div className="dr-bar-label-row">
												<span>{item.label}</span>
												<span>
													{item.count}{" "}
													<small>
														({Number(item.percentage || 0).toFixed(1)}%)
													</small>
												</span>
											</div>

											<div className="dr-bar-bg">
												<div
													className="dr-bar-fill"
													style={{
														width: `${Math.min(
															100,
															Number(item.percentage || 0)
														)}%`,
														background: item.color,
													}}
												/>
											</div>
										</div>
									))
								) : (
									<p className="dr-empty">
										No error frequency data is available for this report.
									</p>
								)}
							</div>

							<div className="dr-ai-recognition">
								<div className="dr-ai-icon">
									<Sparkles size={22} />
								</div>

								<h3>AI Pattern Analysis</h3>

								{recommendation.dominantPattern && (
									<div className="dr-dominant-pattern">
										<span>Dominant Pattern</span>
										<strong>
											{recommendation.dominantPattern}
										</strong>
									</div>
								)}

								<p>
									{recommendation.overview ||
										"No AI analysis is available for this report yet."}
								</p>
							</div>
						</div>

						<hr className="dr-divider" />

						{/* Writing Sample */}
						<div className="dr-section-heading">
							<FileText size={18} />
							<h2 className="dr-section-title">
								Evidence: Writing Sample
							</h2>
						</div>

						<div className="dr-samples-grid">
							<div className="dr-sample-card">
								<div className="dr-sample-header">
									<strong>Original Writing Sample</strong>
									<span>
										{formatDate(writingSample.createdAt || assessmentDate)}
									</span>
								</div>

								<div className="dr-sample-text">
									{writingSample.cleanedText ||
										writingSample.ocrText ||
										"No writing sample text available."}
								</div>
							</div>

							<div className="dr-sample-card">
								<div className="dr-sample-header">
									<strong>AI-Corrected Transcription</strong>
									<span>Analysis Output</span>
								</div>

								<div className="dr-sample-text dr-corrected-text">
									{report.expectedText ||
										writingSample.expectedText ||
										"No corrected transcription available."}
								</div>
							</div>
						</div>

						<hr className="dr-divider" />

						{/* Targeted Interventions */}
						<div className="dr-interventions-card">
							<div className="dr-interventions-header">
								<div>
									<h2 className="dr-interventions-title">
										Targeted Interventions
									</h2>

									<p>
										Recommendations generated from this student's
										error pattern analysis.
									</p>
								</div>

								<Sparkles size={22} />
							</div>

							{recommendation.interventions?.length > 0 ? (
								recommendation.interventions.map((item, index) => (
									<div
										key={`${item.title}-${index}`}
										className="dr-intervention-item"
									>
										<div className="dr-intervention-num">
											{index + 1}
										</div>

										<div className="dr-intervention-content">
											<p className="dr-intervention-title">
												{item.title}
											</p>

											<p className="dr-intervention-desc">
												{item.rationale}
											</p>

											{item.activities?.length > 0 && (
												<div className="dr-activities">
													<strong>Activities:</strong>
													<ul>
														{item.activities.map((activity, activityIndex) => (
															<li key={activityIndex}>{activity}</li>
														))}
													</ul>
												</div>
											)}

											{item.frequency && (
												<p className="dr-frequency">
													<strong>Frequency:</strong>{" "}
													{item.frequency}
												</p>
											)}
										</div>
									</div>
								))
							) : (
								<p className="dr-empty">
									No intervention recommendations are available yet.
								</p>
							)}
						</div>

						<hr className="dr-divider" />

						{/* Educator Summary */}
						<div className="dr-section-heading">
							<Sparkles size={18} />
							<h2 className="dr-section-title">
								AI Analysis Summary
							</h2>
						</div>

						<blockquote className="dr-summary">
							{recommendation.overview ||
								"No AI-generated summary is available for this report."}
						</blockquote>

						{recommendation.educatorCaution && (
							<div className="dr-educator-note">
								<strong>Educator Note</strong>
								<p>{recommendation.educatorCaution}</p>
							</div>
						)}

						<hr className="dr-divider" />

						{/* Report Footer */}
						<div className="dr-report-footer">
							<div>
								<p className="dr-footer-title">Diagnostic Report</p>
								<p className="dr-sig-sub">
									Generated from the DAS Assessment Engine
								</p>

								{recommendation.model && (
									<p className="dr-sig-sub">
										Analysis model: {recommendation.model}
									</p>
								)}
							</div>

							<div className="dr-footer-right">
								<p className="dr-sig-sub">
									Report generated: {formatDate(report.createdAt)}
								</p>

								<p className="dr-sig-sub">
									Last analysis:{" "}
									{formatDate(report.openAiAnalysedAt || report.analysedAt)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
