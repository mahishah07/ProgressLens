import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./../css/Landing.css";
import "./../css/StudentProgress.css";
import "./../css/AddAssessment.css";
import { LayoutDashboard, Bell, Settings, ArrowLeft, Save } from "lucide-react";

const API = import.meta.env.VITE_PMS_API;

// Which score fields are tested per band level
const BAND_FIELDS = {
	A1: [
		{ key: "pictureNamingScore", label: "Picture Naming" },
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "paIdentificationScore", label: "PA Identification" },
		{ key: "letterFormationScore", label: "Letter Formation" },
		{ key: "ed1Score", label: "Edit and Diagram 1" },
		{ key: "lsComprehensionScore", label: "Listening Comprehension" },
	],
	A2: [
		{ key: "pictureDescriptionScore", label: "Picture Description" },
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "wordSpellingScore", label: "Word Spelling" },
		{ key: "ed2Score", label: "Edit and Diagram 2" },
		{ key: "lsComprehensionScore", label: "Listening Comprehension" },
	],
	A3: [
		{ key: "pictureDescriptionScore", label: "Picture Description" },
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "wordSpellingScore", label: "Word Spelling" },
		{ key: "ed3Score", label: "Edit and Diagram 3" },
		{ key: "rdComprehensionScore", label: "Reading Comprehension" },
	],
	B4: [
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "wordSpellingScore", label: "Word Spelling" },
		{ key: "narrativeScore", label: "Narrative Writing" },
		{ key: "expositionScore", label: "Exposition Writing" },
		{ key: "persuasiveScore", label: "Persuasive Writing" },
		{ key: "rdComprehensionScore", label: "Reading Comprehension" },
	],
	B5: [
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "wordSpellingScore", label: "Word Spelling" },
		{ key: "narrativeScore", label: "Narrative Writing" },
		{ key: "expositionScore", label: "Exposition Writing" },
		{ key: "persuasiveScore", label: "Persuasive Writing" },
		{ key: "rdComprehensionScore", label: "Reading Comprehension" },
	],
	B6: [
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "wordSpellingScore", label: "Word Spelling" },
		{ key: "narrativeScore", label: "Narrative Writing" },
		{ key: "expositionScore", label: "Exposition Writing" },
		{ key: "persuasiveScore", label: "Persuasive Writing" },
		{ key: "rdComprehensionScore", label: "Reading Comprehension" },
	],
	C7: [
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "wordSpellingScore", label: "Word Spelling" },
		{ key: "narrativeScore", label: "Narrative Writing" },
		{ key: "expositionScore", label: "Exposition Writing" },
		{ key: "persuasiveScore", label: "Persuasive Writing" },
		{ key: "rdComprehensionScore", label: "Reading Comprehension" },
	],
	C8: [
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "wordSpellingScore", label: "Word Spelling" },
		{ key: "narrativeScore", label: "Narrative Writing" },
		{ key: "expositionScore", label: "Exposition Writing" },
		{ key: "persuasiveScore", label: "Persuasive Writing" },
		{ key: "rdComprehensionScore", label: "Reading Comprehension" },
	],
	C9: [
		{ key: "wraScore", label: "Word Reading Accuracy" },
		{ key: "fluencyMark", label: "Fluency" },
		{ key: "wordSpellingScore", label: "Word Spelling" },
		{ key: "narrativeScore", label: "Narrative Writing" },
		{ key: "expositionScore", label: "Exposition Writing" },
		{ key: "persuasiveScore", label: "Persuasive Writing" },
		{ key: "rdComprehensionScore", label: "Reading Comprehension" },
	],
};

const BAND_OPTIONS = ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"];

export default function AddAssessment() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [student, setStudent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState(null);
	const [showSuccess, setShowSuccess] = useState(false);

	const [semester, setSemester] = useState("");
	const [summaryBand, setSummaryBand] = useState("");
	const [newBand, setNewBand] = useState("");
	const [assessmentDate, setAssessmentDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [scores, setScores] = useState({});

	useEffect(() => {
		if (!id) return;
		fetch(`${API}/api/progress/${id}/overview`)
			.then((r) => r.json())
			.then((data) => {
				if (data.message) throw new Error(data.message);
				setStudent(data.student);
				const band = data.latestNewBand || data.currentBandLevel || "";
				setSummaryBand(band);
				setNewBand(band);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, [id]);

	const fields = BAND_FIELDS[summaryBand] || [];

	const handleScoreChange = (key, value) => {
		setScores((prev) => ({ ...prev, [key]: value }));
	};

	const handleSave = async () => {
		if (!semester.trim()) {
			setSaveError("Semester is required.");
			return;
		}
		setSaving(true);
		setSaveError(null);

		const payload = {
			student: student._id,
			semester: semester.trim(),
			summaryBand,
			newBand: newBand || summaryBand,
			assessmentDate,
			assessedBy: student.teacherId,
		};

		fields.forEach((f) => {
			const val = scores[f.key];
			payload[f.key] = val !== undefined && val !== "" ? Number(val) : null;
		});

		try {
			const res = await fetch(`${API}/api/assessments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to save assessment");
			setShowSuccess(true);
		} catch (err) {
			setSaveError(err.message);
		}
		setSaving(false);
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
	);

	if (loading) {
		return (
			<div className="sp-page">
				<main className="sp-main">
					<p className="state-msg">Loading...</p>
				</main>
			</div>
		);
	}

	if (error) {
		return (
			<div className="sp-page">
				<main className="sp-main">
					<p className="state-msg error">{error}</p>
				</main>
			</div>
		);
	}

	return (
		<div className="sp-page">
			<Sidebar />
			<main className="sp-main">
				<header className="topbar">
					<h2>DAS Assessment Portal</h2>
				</header>

				<div className="aa-content">
					<div className="aa-header">
						<h1>Add Assessment</h1>
						<p className="aa-subtitle">
							{student?.studentId} — recording a new assessment
						</p>
					</div>

					<div className="aa-card">
						<div className="aa-row">
							<div className="aa-field">
								<label>Semester</label>
								<input
									type="text"
									placeholder="e.g. 2026 Sem 1"
									value={semester}
									onChange={(e) => setSemester(e.target.value)}
								/>
							</div>
							<div className="aa-field">
								<label>Assessment Date</label>
								<input
									type="date"
									value={assessmentDate}
									max={new Date().toISOString().split("T")[0]}
									onChange={(e) => setAssessmentDate(e.target.value)}
								/>
							</div>
						</div>

						<div className="aa-row">
							<div className="aa-field">
								<label>Band Level Assessed</label>
								<select
									value={summaryBand}
									onChange={(e) => {
										setSummaryBand(e.target.value);
										setScores({});
									}}
								>
									<option value="">Select band</option>
									{BAND_OPTIONS.map((b) => (
										<option key={b} value={b}>
											{b}
										</option>
									))}
								</select>
							</div>
							<div className="aa-field">
								<label>New Band (after this assessment)</label>
								<select
									value={newBand}
									onChange={(e) => setNewBand(e.target.value)}
								>
									<option value="">Select band</option>
									{BAND_OPTIONS.map((b) => (
										<option key={b} value={b}>
											{b}
										</option>
									))}
								</select>
							</div>
						</div>

						{summaryBand && (
							<>
								<div className="aa-divider" />
								<h3 className="aa-section-title">
									Components for Band {summaryBand}
								</h3>
								<div className="aa-scores-grid">
									{fields.map((f) => (
										<div className="aa-field" key={f.key}>
											<label>{f.label}</label>
											<input
												type="number"
												placeholder="Score"
												value={scores[f.key] ?? ""}
												onChange={(e) =>
													handleScoreChange(f.key, e.target.value)
												}
											/>
										</div>
									))}
								</div>
							</>
						)}

						{saveError && <p className="aa-error">{saveError}</p>}
					</div>

					<div className="aa-actions">
						<button
							className="sp-back-btn"
							onClick={() => navigate(`/student/${id}`)}
						>
							<ArrowLeft size={16} />
							Cancel
						</button>
						<button
							className="sp-qa-primary"
							onClick={handleSave}
							disabled={saving || !summaryBand}
						>
							<Save size={16} />
							{saving ? "Saving..." : "Save Assessment"}
						</button>
					</div>
				</div>
			</main>

			{showSuccess && (
				<div className="modal-overlay">
					<div className="modal-box aa-success-box">
						<div className="modal-body aa-success-body">
							<h2>Assessment Saved</h2>
							<p>The new assessment has been recorded successfully.</p>
							<button
								className="modal-save"
								onClick={() => navigate(`/student/${id}?view=dashboard`)}
							>
								Back to Dashboard
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
