import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import StudentProgress from "./pages/StudentProgress";
import AssessmentComparison from "./pages/AssessmentComparison";
import ProgressReport from "./pages/ProgressReport";
import StudentError from "./pages/StudentError";
import WritingReview from "./pages/WritingReview";
import DiagnosticReport from "./pages/DiagnosticReport";
import ErrorDashboard from "./pages/ErrorDashboard";

function App() {
	return (
		<Routes>
			<Route path="/" element={<Landing />} />

			<Route path="/student-progress" element={<StudentProgress />} />

			<Route path="/assessment-comparison" element={<AssessmentComparison />} />

			<Route path="/progress-report" element={<ProgressReport />} />

			<Route path="/student-errors" element={<StudentError />} />

			<Route path="/writing-review" element={<WritingReview />} />

			<Route path="/diagnostic-report" element={<DiagnosticReport />} />

			<Route path="/" element={<Landing />} />

			<Route path="/error-dashboard" element={<ErrorDashboard />} />

			<Route path="/student/:id" element={<StudentProgress />} />

			<Route path="/error-dashboard/:id" element={<ErrorDashboard />} />
		</Routes>
	);
}

export default App;
