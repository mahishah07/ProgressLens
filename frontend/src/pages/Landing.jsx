import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./../css/Landing.css";
import {
	LayoutDashboard,
	Bell,
	Settings,
	Search,
	ExternalLink,
	UserPlus,
} from "lucide-react";

const API = import.meta.env.VITE_PMS_API;
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

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

	useEffect(() => {
    const timer = setTimeout(() => {
        if (
            searchInput.length >= 4 ||
            searchInput.length === 0
        ) {
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
				  selectedCentre
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
					setError("Failed to load students. Make sure the backend is running.");
					setLoading(false);
				});
		};

		loadStudents();
	}, [search, selectedCentre, page]);

	const getInitials = (studentId) => {
		if (!studentId) return "ST";
		const parts = studentId.split(" ");
		return parts.length > 1
			? parts[0][0] + parts[1][0]
			: studentId.slice(0, 2).toUpperCase();
	};

	return (
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
					<h2>DAS Assessment Portal</h2>
					<div className="top-right">
						<div className="teacher">
							<span className="teacher-avatar">T1</span>
							<span>Teacher 1</span>
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
									if (value !=="") {
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
						<a
							href={SHEET_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="sheet-button"
						>
							<ExternalLink size={18} /> Open Google Sheets
						</a>
					</div>

					{/* States */}
					{loading && <p className="state-msg">Loading students...</p>}
					{error && <p className="state-msg error">{error}</p>}

					{/* Cards */}
					{!loading && !error && (
    					<>
        					<div className="student-grid">

            					{/* Register card */}
								{! search &&
            					<div className="student-card add-card">
									<UserPlus size={32} />
									<p>Register New Student</p>
								</div> }

								{/* Existing students */}
								{students.map((student) => (
									<div className="student-card" key={student._id}>
										<div className="avatar">
											{getInitials(student.studentId)}
										</div>

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
										<p>
											You can register this student below.
										</p>
										<button>
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
											onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
	);
}
