import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../css/Landing.css";
import "../css/ErrorOptions.css";
import "../css/StudentProgress.css";
import "../css/AssessmentHistory.css";
import {
	LayoutDashboard,
	TrendingUp as TrendIcon,
	BarChart3,
	FileCheck2,
	Bell,
	Settings,
	ArrowLeft,
	ChevronDown,
	Search,
	BriefcaseBusiness,
	UserRound,
	CalendarDays,
	GraduationCap,
} from "lucide-react";

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

function HistoryTopbar({ search, setSearch, searching, onSearch }) {
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
	const [overview, setOverview] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [expanded, setExpanded] = useState({});
	const [studentSearch, setStudentSearch] = useState("");
	const [studentSearching, setStudentSearching] = useState(false);

	useEffect(() => {
		if (!id) return;
		Promise.all([
			fetch(`${API}/api/progress/${id}/dashboard`).then((r) => r.json()),
			fetch(`${API}/api/progress/${id}/overview`).then((r) => r.json()),
		])
			.then(([dashData, overviewData]) => {
				setDashboard(dashData);
				setOverview(overviewData);

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
		<HistoryTopbar
			search={studentSearch}
			setSearch={setStudentSearch}
			searching={studentSearching}
			onSearch={searchStudent}
		/>
	);

	if (loading)
		return (
			<div className="ah-page eo-page sp-page">
				<ProgressSidebar studentId={id} />
				<main className="ah-main">
					{topbar}
					<p className="state-msg">Loading assessments...</p>
				</main>
			</div>
		);

	if (error)
		return (
			<div className="ah-page eo-page sp-page">
				<ProgressSidebar studentId={id} />
				<main className="ah-main">
					{topbar}
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);

	const assessments = dashboard?.assessmentHistory || [];

	const profileStudentId =
		overview?.student?.studentId ||
		dashboard?.student?.studentId ||
		id;

	const currentBand =
		overview?.latestNewBand ||
		overview?.currentBandLevel ||
		"—";

	const centre =
		overview?.student?.centreId ||
		overview?.student?.centre ||
		"—";

	return (
		<div className="ah-page eo-page sp-page">
			<ProgressSidebar studentId={id} />
			<main className="ah-main">
				{topbar}

				<div className="ah-content">
					{/* STUDENT PROFILE */}
					<section className="eo-profile-card ah-profile-card">
						<div className="eo-student-icon">
							<UserRound size={29} />
						</div>

						<div className="eo-profile-info">
							<h1>{profileStudentId}</h1>
						</div>

						<div className="eo-profile-meta">
							<div className="eo-meta-item">
								<div className="eo-meta-icon">
									<CalendarDays size={17} />
								</div>

								<div>
									<span className="eo-meta-label">
										Last Assessment
									</span>

									<span className="eo-meta-value">
										{formatDate(overview?.lastAssessmentDate)}
									</span>
								</div>
							</div>

							<div className="eo-meta-item">
								<div className="eo-meta-icon">
									<GraduationCap size={17} />
								</div>

								<div>
									<span className="eo-meta-label">
										Assigned Band
									</span>

									<span className="eo-meta-value eo-band">
										{currentBand}
									</span>
								</div>
							</div>

							<div className="eo-meta-item">
								<div className="eo-meta-icon">
									<BriefcaseBusiness size={17} />
								</div>

								<div>
									<span className="eo-meta-label">
										Centre
									</span>

									<span className="eo-meta-value">
										{centre}
									</span>
								</div>
							</div>
						</div>
					</section>

					<div className="ah-header">
						<div>
							<p className="ah-eyebrow">
								ASSESSMENT HISTORY
							</p>

							<h1>All Assessments</h1>

							<p className="ah-header-sub">
								Review assessment results, component scores and band progression.
							</p>
						</div>

						<button
							className="ah-back-btn"
							onClick={() =>
								navigate(
									`/student/${encodeURIComponent(
										profileStudentId,
									)}?view=dashboard`,
								)
							}
						>
							<ArrowLeft size={16} />
							Back
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
