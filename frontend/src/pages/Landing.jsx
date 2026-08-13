import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./../css/Landing.css";
import {
	LayoutDashboard,
	Bell,
	Settings,
	Search,
	UserPlus,
	UserRound,
	BriefcaseBusiness,
} from "lucide-react";

const API = import.meta.env.VITE_PMS_API;

export default function Landing() {
	const [students, setStudents] = useState([]);
	const [centres, setCentres] = useState([]);
	const [selectedCentre, setSelectedCentre] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState({
		semester: "",
		centreId: "",
		teacherId: "",
		studentId: "",
		schoolId: "",
		age: "",
		schLevel: "",
		enrollmentDate: "",
		summaryBand: "",
	});
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchInput.length >= 4 || searchInput.length === 0) {
				setSearch(searchInput.trim());
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [searchInput]);

	// fetch centres for filter dropdown
	useEffect(() => {
		fetch(`${API}/api/students/centres`)
			.then((r) => r.json())
			.then((data) => setCentres(data))
			.catch(() => setCentres([]));
	}, []);

	// fetch students whenever filter/search/page changes
	useEffect(() => {
		const url = search
			? `${API}/api/progress/search?studentId=${encodeURIComponent(search)}`
			: selectedCentre
				? `${API}/api/progress/search?centreId=${encodeURIComponent(
						selectedCentre,
					)}`
				: `${API}/api/students?page=${page}&limit=20`;

		const loadStudents = () => {
			setLoading(true);

			fetch(url)
				.then((r) => r.json())
				.then((data) => {
					setError(null);
					if (Array.isArray(data)) {
						setStudents(data);
						setTotalPages(1);
					} else {
						setStudents(data.students || []);
						setTotalPages(data.pages || 1);
					}
					setLoading(false);
				})
				.catch(() => {
					setError(
						"Failed to load students. Make sure the backend is running.",
					);
					setLoading(false);
				});
		};

		loadStudents();
	}, [search, selectedCentre, page]);

	const handleFormChange = (e) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSaveStudent = async () => {
		setSaving(true);
		setSaveError(null);
		try {
			const res = await fetch(`${API}/api/students`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...form,
					age: form.age ? parseInt(form.age) : undefined,
					enrollmentDate: form.enrollmentDate || undefined,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to save");
			setShowModal(false);
			setForm({
				semester: "",
				centreId: "",
				teacherId: "",
				studentId: "",
				schoolId: "",
				age: "",
				schLevel: "",
				enrollmentDate: "",
				summaryBand: "",
			});
			setPage(1);
		} catch (err) {
			setSaveError(err.message);
		}
		setSaving(false);
	};

	return (
		<>
			<div className="landing-page">
				{/* Sidebar */}
				<aside className="sidebar">
					<div className="logo-section">
						<div className="logo-circle">DAS</div>
						<div>
							<h2>DAS Teacher</h2>
							<p>Educational Professional</p>
						</div>
					</div>

					<nav>
						<a href="#" className="active">
							<LayoutDashboard size={20} />
							<span>Dashboard</span>
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

				{/* Main */}
				<main className="main-content">
					<header className="topbar">
						<div className="topbar-brand">
							<div>
								<h2>DAS Assessment Portal</h2>
								<span className="topbar-context">Teacher Dashboard</span>
							</div>
						</div>

						<div className="top-right">
							<div className="topbar-role">
								<div className="topbar-role-icon">
									<BriefcaseBusiness size={20} />
								</div>
								<div className="topbar-role-copy">
									<strong>Educational Professional</strong>
									<span>DAS Teacher Portal</span>
								</div>
							</div>
						</div>
					</header>

					<section className="page-content">
						<h1>Class Overview</h1>
						<p className="subtitle">
							Monitoring student progress and intervention risk levels.
						</p>

						{/* Toolbar */}
						<div className="toolbar">
							<div className="search-box">
								<Search size={18} />
								<input
									type="text"
									placeholder="Search by Student ID..."
									value={searchInput}
									onChange={(e) => {
										const value = e.target.value.replace(/\D/g, "");
										setSearchInput(value);
										if (value !== "") {
											setSelectedCentre("");
										}
										setPage(1);
									}}
								/>
							</div>
							<select
								value={selectedCentre}
								disabled={!!search}
								onChange={(e) => {
									setSelectedCentre(e.target.value);
									setPage(1);
								}}
							>
								<option value="">Filter by: All Centres</option>
								{centres.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</div>

						{/* States */}
						{loading && <p className="state-msg">Loading students...</p>}
						{error && <p className="state-msg error">{error}</p>}

						{/* Cards */}
						{!loading && !error && (
							<>
								<div className="student-grid">
									{/* Register card */}
									{!search && (
										<div
											className="student-card add-card"
											onClick={() => setShowModal(true)}
										>
											<UserPlus size={32} />
											<p>Register New Student</p>
										</div>
									)}

									{/* Existing students */}
									{students.map((student) => (
										<div className="student-card" key={student._id}>
											<UserRound size={24} />

											<h3>{student.studentId}</h3>

											<p>
												{student.summaryBand
													? `Band ${student.summaryBand}`
													: "No band assigned"}
											</p>

											<small>
												Centre: {student.centreId || "—"}
												<br />
												Level: {student.schLevel || "—"}
											</small>

											<Link
												to={`/student/${encodeURIComponent(student._id)}`}
												className="dashboard-button"
											>
												View Dashboard →
											</Link>
										</div>
									))}
									{search && students.length === 0 && (
										<div className="student-card add-card">
											<h3>No student found</h3>
											<p>
												No student with ID <strong>{search}</strong> exists.
											</p>
											<p>You can register this student below.</p>
											<button className="register-search-btn" onClick={() => setShowModal(true)}>
												<UserPlus size={17} />
												Register New Student
											</button>
										</div>
									)}
								</div>

								{/* Pagination */}
								{!search && !selectedCentre && totalPages > 1 && (
									<div className="pagination">
										<button
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1}
										>
											← Prev
										</button>

										<span>
											Page {page} of {totalPages}
										</span>

										<button
											onClick={() =>
												setPage((p) => Math.min(totalPages, p + 1))
											}
											disabled={page === totalPages}
										>
											Next →
										</button>
									</div>
								)}
							</>
						)}
					</section>
				</main>
			</div>

			{showModal && (
				<div className="modal-overlay" onClick={() => setShowModal(false)}>
					<div className="modal-box" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h2>Register New Student</h2>
							<button
								className="modal-close"
								onClick={() => setShowModal(false)}
							>
								✕
							</button>
						</div>
						<div className="modal-body">
							<div className="modal-row">
								<div className="modal-field">
									<label>Semester</label>
									<input
										name="semester"
										value={form.semester}
										onChange={handleFormChange}
										placeholder="e.g. 2026 Sem 1"
									/>
								</div>
								<div className="modal-field">
									<label>Student ID</label>
									<input
										name="studentId"
										value={form.studentId}
										onChange={handleFormChange}
										placeholder="e.g. Student 0001"
									/>
								</div>
							</div>
							<div className="modal-row">
								<div className="modal-field">
									<label>Centre</label>
									<select
										name="centreId"
										value={form.centreId}
										onChange={handleFormChange}
									>
										<option value="">Select centre</option>
										{centres.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
								</div>
								<div className="modal-field">
									<label>Teacher ID</label>
									<input
										name="teacherId"
										value={form.teacherId}
										onChange={handleFormChange}
										placeholder="e.g. Teacher 001"
									/>
								</div>
							</div>
							<div className="modal-row">
								<div className="modal-field">
									<label>School ID</label>
									<input
										name="schoolId"
										value={form.schoolId}
										onChange={handleFormChange}
										placeholder="e.g. School 001"
									/>
								</div>
								<div className="modal-field">
									<label>Age</label>
									<input
										name="age"
										type="number"
										value={form.age}
										onChange={handleFormChange}
										placeholder="e.g. 12"
									/>
								</div>
							</div>
							<div className="modal-row">
								<div className="modal-field">
									<label>School Level</label>
									<select
										name="schLevel"
										value={form.schLevel}
										onChange={handleFormChange}
									>
										<option value="">Select level</option>
										<option value="Primary">Primary</option>
										<option value="Secondary">Secondary</option>
									</select>
								</div>
								<div className="modal-field">
									<label>Summary Band</label>
									<select
										name="summaryBand"
										value={form.summaryBand}
										onChange={handleFormChange}
									>
										<option value="">Select band</option>
										{["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"].map(
											(b) => (
												<option key={b} value={b}>
													{b}
												</option>
											),
										)}
									</select>
								</div>
							</div>
							<div className="modal-row">
								<div className="modal-field">
									<label>Enrollment Date</label>
									<input
										name="enrollmentDate"
										type="date"
										value={form.enrollmentDate}
										onChange={handleFormChange}
										max={new Date().toISOString().split("T")[0]}
									/>
								</div>
							</div>
							{saveError && <p className="modal-error">{saveError}</p>}
						</div>
						<div className="modal-footer">
							<button
								className="modal-cancel"
								onClick={() => setShowModal(false)}
							>
								Cancel
							</button>
							<button
								className="modal-save"
								onClick={handleSaveStudent}
								disabled={saving}
							>
								{saving ? "Saving..." : "Register Student"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
