import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../css/AssessmentHistory.css";
import {
	LayoutDashboard,
	TrendingUp,
	BarChart3,
	FileText,
	Bell,
	Settings,
	ArrowLeft,
	ChevronDown,
} from "lucide-react";

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
	listeningComp: "Listening Comprehension",
	readingComp: "Reading Comprehension",
	narrative: "Narrative Writing",
	exposition: "Exposition Writing",
	persuasive: "Persuasive Writing",
	writtenVocab: "Written Vocab",
};

const CATEGORY_LABELS = {
	pictureNaming: "Vocab",
	pictureDescription: "Vocab",
	paIdentification: "PA / Phonics",
	phonics: "PA / Phonics",
	wra: "PA / Phonics",
	fluency: "PA / Phonics",
	wordSpelling: "PA / Phonics",
	letterFormation: "Writing",
	editDiagram1: "Writing",
	editDiagram2: "Writing",
	editDiagram3: "Writing",
	listeningComp: "Comprehension",
	readingComp: "Comprehension",
	narrative: "Writing",
	exposition: "Writing",
	persuasive: "Writing",
	writtenVocab: "Vocab",
};

export default function AssessmentHistory() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [dashboard, setDashboard] = useState(null);
	const [student, setStudent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [expanded, setExpanded] = useState({});

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		Promise.all([
			fetch(`${API}/api/progress/${id}/dashboard`).then((r) => r.json()),
			fetch(`${API}/api/progress/${id}/overview`).then((r) => r.json()),
		])
			.then(([dashData, overviewData]) => {
				setDashboard(dashData);
				setStudent(overviewData?.student);
				setLoading(false);
				if (dashData?.assessmentHistory?.length > 0) {
					setExpanded({ 0: true });
				}
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, [id]);

	const toggleExpanded = (index) => {
		setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
	};

	const formatDate = (date) => {
		if (!date) return "—";
		return new Date(date).toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
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
			<div className="ah-page">
				<Sidebar />
				<main className="ah-main">
					<p className="state-msg">Loading assessments...</p>
				</main>
			</div>
		);

	if (error)
		return (
			<div className="ah-page">
				<Sidebar />
				<main className="ah-main">
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);

	const assessments = dashboard?.assessmentHistory || [];

	return (
		<div className="ah-page">
			<Sidebar />
			<main className="ah-main">
				<header className="ah-topbar">
					<h2>DAS Assessment Portal</h2>
					<span className="ah-sep">|</span>
					<span className="ah-sub">
						Assessment History — {student?.studentId || id}
					</span>
				</header>

				<div className="ah-content">
					<div className="ah-header">
						<h1>All Assessments</h1>
						<button
							className="ah-back-btn"
							onClick={() => navigate(`/student/${id}`)}
						>
							<ArrowLeft size={15} /> Back to dashboard
						</button>
					</div>

					{assessments.length === 0 ? (
						<p className="state-msg">No assessments found for this student.</p>
					) : (
						assessments.map((a, index) => {
							const isOpen = !!expanded[index];
							const movedUp =
								a.newBand && a.summaryBand && a.newBand !== a.summaryBand;
							const components = a.bandScore?.componentResults || [];
							const scored = a.weightedScore;
							const passed = a.passed;

							return (
								<div key={a._id || index} className="ah-card">
									<div
										className="ah-card-header"
										onClick={() => toggleExpanded(index)}
									>
										<div className="ah-meta">
											<span className="ah-date">
												{formatDate(a.assessmentDate)}
											</span>
											<span className="ah-sem">{a.semester}</span>
											<span className="ah-band-pill">
												{a.summaryBand || "—"}
											</span>
											<span className="ah-arrow">→</span>
											<span
												className={`ah-band-pill ${movedUp ? "ah-band-moved" : ""}`}
											>
												{a.newBand || "—"} {movedUp ? "↑" : ""}
											</span>
										</div>
										<div className="ah-right">
											{scored !== null && scored !== undefined ? (
												<span
													className={`ah-score ${passed ? "ah-pass" : "ah-fail"}`}
												>
													{scored}%
												</span>
											) : (
												<span className="ah-score">—</span>
											)}
											<ChevronDown
												size={16}
												className={`ah-chevron ${isOpen ? "ah-chevron-open" : ""}`}
											/>
										</div>
									</div>

									{isOpen && (
										<div className="ah-card-body">
											<div className="ah-band-row">
												<span className="ah-band-tag">
													{a.summaryBand || "—"}
												</span>
												<span className="ah-band-arrow">→</span>
												<span
													className={`ah-band-tag ${movedUp ? "ah-band-tag-new" : ""}`}
												>
													{a.newBand || "—"}
												</span>
												{movedUp ? (
													<span className="ah-moved-label">↑ Moved up</span>
												) : (
													<span className="ah-same-label">Same level</span>
												)}
											</div>

											{components.length > 0 ? (
												<>
													<table className="ah-table">
														<thead>
															<tr>
																<th>Component</th>
																<th>Category</th>
																<th>Score</th>
																<th>Pass mark</th>
																<th>Weight</th>
																<th>Result</th>
															</tr>
														</thead>
														<tbody>
															{components.map((comp, ci) => (
																<tr
																	key={ci}
																	className={
																		comp.skipped ? "ah-row-skipped" : ""
																	}
																>
																	<td className="ah-comp-name">
																		{COMPONENT_LABELS[comp.name] || comp.name}
																		{comp.note && (
																			<span className="ah-comp-note">
																				{" "}
																				({comp.note})
																			</span>
																		)}
																	</td>
																	<td className="ah-comp-cat">
																		{CATEGORY_LABELS[comp.name] || "—"}
																	</td>
																	<td className="ah-comp-score">
																		{comp.score !== null &&
																		comp.score !== undefined
																			? comp.score
																			: "—"}
																	</td>
																	<td className="ah-comp-score">
																		{comp.passMark}
																	</td>
																	<td>
																		<div className="ah-weight-row">
																			<span className="ah-weight-pct">
																				{comp.skipped
																					? "—"
																					: `${parseFloat(comp.weight).toFixed(2)}%`}
																			</span>
																			{!comp.skipped && (
																				<div className="ah-weight-bar-bg">
																					<div
																						className={`ah-weight-bar ${comp.passed ? "ah-weight-pass" : comp.passed === false ? "ah-weight-fail" : ""}`}
																						style={{
																							width: `${Math.min(100, comp.weight)}%`,
																						}}
																					/>
																				</div>
																			)}
																		</div>
																	</td>
																	<td>
																		{comp.skipped ? (
																			<span className="ah-badge ah-badge-skip">
																				Not taken
																			</span>
																		) : comp.passed === true ? (
																			<span className="ah-badge ah-badge-pass">
																				Pass
																			</span>
																		) : comp.passed === false ? (
																			<span className="ah-badge ah-badge-fail">
																				Fail
																			</span>
																		) : (
																			<span className="ah-badge ah-badge-skip">
																				—
																			</span>
																		)}
																	</td>
																</tr>
															))}
														</tbody>
													</table>

													<div className="ah-overall-row">
														<div>
															<p className="ah-overall-label">
																Overall weighted score
															</p>
															{a.bandScore?.forgivenessApplied && (
																<p className="ah-forgiveness">
																	Forgiveness rule applied — 1 fail allowed
																</p>
															)}
															{a.bandScore?.failedComponents?.length > 0 &&
																!a.bandScore?.forgivenessApplied && (
																	<p className="ah-failed-list">
																		Failed:{" "}
																		{a.bandScore.failedComponents
																			.map((c) => COMPONENT_LABELS[c] || c)
																			.join(", ")}
																	</p>
																)}
														</div>
														<div
															className={`ah-overall-pct ${passed ? "ah-pass" : "ah-fail"}`}
														>
															{scored !== null && scored !== undefined
																? `${scored}%`
																: "—"}
														</div>
													</div>
												</>
											) : (
												<p className="state-msg">
													No component breakdown available.
												</p>
											)}

											{a.teacherComments && (
												<div className="ah-comments">
													<p className="ah-comments-label">Teacher comments</p>
													<p className="ah-comments-text">
														{a.teacherComments}
													</p>
												</div>
											)}
										</div>
									)}
								</div>
							);
						})
					)}
				</div>
			</main>
		</div>
	);
}
