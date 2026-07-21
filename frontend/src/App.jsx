import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import StudentProgress from "./pages/StudentProgress";
import AssessmentComparison from "./pages/AssessmentComparison";
import ProgressReport from "./pages/ProgressReport";
import StudentErrorAnalysis from "./pages/StudentErrorAnalysis";
import WritingReview from "./pages/WritingReview";
import DiagnosticReport from "./pages/DiagnosticReport";

function App() {
	return (
		<Routes>
			<Route path="/" element={<Landing />} />

			<Route path="/student-progress" element={<StudentProgress />} />

			<Route path="/assessment-comparison" element={<AssessmentComparison />} />

			<Route path="/progress-report" element={<ProgressReport />} />

			<Route path="/student-errors" element={<StudentErrorAnalysis />} />

			<Route path="/writing-review" element={<WritingReview />} />

			<Route path="/diagnostic-report" element={<DiagnosticReport />} />

			<Route path="/" element={<Landing />} />

			<Route path="/student/:id" element={<StudentProgress />} />
		</Routes>
	);
}

export default App;
