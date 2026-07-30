import "./../css/ErrorDashboard.css";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
	LayoutDashboard,
	BarChart3,
	FileText,
	Bell,
	Settings,
	Search,
	HelpCircle,
	Grid3X3,
	Upload,
	Image,
	Eye,
} from "lucide-react";

export default function ErrorDashboard() {
	const { id } = useParams();

	const [student, setStudent] = useState(null);
	const [history, setHistory] = useState([]);
	const [search, setSearch] = useState("");

	const navigate = useNavigate();

	const fileInputRef = useRef(null);

	const [selectedFile, setSelectedFile] = useState(null);
	const [previewURL, setPreviewURL] = useState(null);
	const [dragging, setDragging] = useState(false);
	const [uploading, setUploading] = useState(false);

	const handleBrowse = () => {
		fileInputRef.current.click();
	};

	const processFile = (file) => {
		if (!file) return;

		const allowedTypes = [
			"application/pdf",
			"image/png",
			"image/jpeg",
			"image/jpg",
			"image/tiff",
			"image/bmp",
		];

		if (!allowedTypes.includes(file.type)) {
			alert("Please upload a PDF, PNG, JPG, JPEG, TIFF or BMP.");
			return;
		}

		const MAX_SIZE = 10 * 1024 * 1024;

		if (file.size > MAX_SIZE) {
			alert("Maximum file size is 10 MB.");
			return;
		}

		setSelectedFile(file);
		setPreviewURL(URL.createObjectURL(file));
	};

	const handleFileChange = (e) => {
		processFile(e.target.files[0]);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setDragging(false);
		processFile(e.dataTransfer.files[0]);
	};

	const removeFile = () => {
		setSelectedFile(null);

		if (previewURL) {
			URL.revokeObjectURL(previewURL);
		}

		setPreviewURL(null);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const previewFile = () => {
		if (!selectedFile) return;

		window.open(previewURL, "_blank");
	};

	const analyzeAssessment = async () => {
		if (!selectedFile) {
			alert("Please upload a file first.");
			return;
		}

		setUploading(true);

		const formData = new FormData();
		formData.append("file", selectedFile);

		try {
			// Replace with your backend endpoint
			// const res = await fetch("/api/analyze", {
			//   method: "POST",
			//   body: formData,
			// });
			//
			// const data = await res.json();
			// navigate(`/error-report/${data.id}`);

			// Temporary demo navigation
			setTimeout(() => {
				setUploading(false);
				navigate("/error-report/demo");
			}, 1500);
		} catch (err) {
			console.error(err);
			setUploading(false);
		}
	};

	const loadDashboard = async () => {
		/*
    Example:

    const res = await fetch(`/api/error/${id}/dashboard`);
    const data = await res.json();

    setStudent(data.student);
    setHistory(data.history);
    */
	};

	// end analyzeAssessment

	useEffect(() => {
		loadDashboard();
	}, []);

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
					<Link to="/">
						<LayoutDashboard size={20} />
						<span>Dashboard</span>
					</Link>

					<Link className="active">
						<BarChart3 size={20} />
						<span>Error Pattern Analysis</span>
					</Link>

					<Link>
						<FileText size={20} />
						<span>Reports</span>
					</Link>

					<Link>
						<Bell size={20} />
						<span>Notifications</span>
					</Link>

					<Link>
						<Settings size={20} />
						<span>Settings</span>
					</Link>
				</nav>
			</aside>

			{/* ================= Main ================= */}
			<main className="main-content">
				<header className="topbar">
					<h2>DAS Assessment Portal</h2>

					<div className="top-right">
						<div className="search-box-top">
							<Search size={18} />
							<input placeholder="Search student by name or ID..." />
						</div>

						<HelpCircle size={22} />
						<Grid3X3 size={22} />
						<div className="teacher-avatar"></div>
					</div>
				</header>

				{/* ================= Page ================= */}
				<section className="page-content">
					<h1 className="page-title">Class Error Patterns</h1>

					<p className="page-subtitle">
						Overview of linguistic and visual-spatial errors across student
						submissions.
					</p>

					{/* ================= Search ================= */}
					<div className="toolbar">
						<div className="assessment-search">
							<Search size={18} />
							<input
								placeholder="Assessment Name"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>

						<select>
							<option>Sort by: Latest Date</option>
							<option>Oldest</option>
							<option>Highest Risk</option>
						</select>
					</div>

					{/* ================= Upload ================= */}
					<div className="upload-card">
						<div
							className={`upload-area ${
								dragging ? "dragging" : ""
							} ${selectedFile ? "uploaded" : ""}`}
							onClick={handleBrowse}
							onDragOver={(e) => {
								e.preventDefault();
								setDragging(true);
							}}
							onDragLeave={() => setDragging(false)}
							onDrop={handleDrop}
						>
							{selectedFile ? (
								<>
									{selectedFile.type.startsWith("image/") ? (
										<img
											src={previewURL}
											className="upload-preview"
											alt="preview"
										/>
									) : (
										<div className="pdf-preview-card">
											<FileText size={80} />
											<h4>{selectedFile.name}</h4>
											<p>PDF Document</p>
										</div>
									)}

									<h3>Upload Complete</h3>

									<h4>{selectedFile.name}</h4>

									<p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>

									<div className="upload-actions">
										<button
											className="preview-file"
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												previewFile();
											}}
										>
											Preview
										</button>

										<button
											className="remove-file"
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												removeFile();
											}}
										>
											Remove
										</button>
									</div>
								</>
							) : (
								<>
									<Upload size={50} />

									<h3>Import Student Submission</h3>

									<p>Drag & Drop or click to browse</p>

									<small>
										PDF, PNG, JPG, JPEG, TIFF, BMP
										<br />
										Maximum size: 10 MB
									</small>
								</>
							)}

							<input
								ref={fileInputRef}
								type="file"
								hidden
								accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.bmp"
								onChange={handleFileChange}
							/>
						</div>

						<button
							className="analyse-button"
							disabled={!selectedFile || uploading}
							onClick={analyzeAssessment}
						>
							{uploading ? (
								<>
									<Image size={18} />
									Processing...
								</>
							) : (
								<>
									<Image size={18} />
									Analyze Assessment
								</>
							)}
						</button>
					</div>
					{/* ================= History ================= */}
					{history.length > 0 && (
						<>
							<div className="history-header">
								<h2>Assessment History</h2>
								<button>See Full History</button>
							</div>

							<div className="history-grid">
								{history.map((assessment) => (
									<div className="history-card" key={assessment._id}>
										<div className="history-top">
											<div>
												<h3>{student?.name}</h3>
												<p>ID: {student?.studentId}</p>
											</div>

											<div
												className={`risk-dot ${
													assessment.diagnosisRequired ? "high" : "low"
												}`}
											></div>
										</div>

										<div className="submission-preview">
											<img src={assessment.previewImage} alt="submission" />
										</div>

										<div className="assessment-tag">{assessment.errorType}</div>

										<p className="assessment-summary">{assessment.aiSummary}</p>

										<Link
											to={`/error-report/${assessment._id}`}
											className={`report-button ${
												assessment.diagnosisRequired ? "danger" : ""
											}`}
										>
											<Eye size={18} />
											{assessment.diagnosisRequired
												? "Diagnostic Required"
												: "View Report"}
										</Link>
									</div>
								))}
							</div>
						</>
					)}
				</section>
			</main>
		</div>
	);
}
