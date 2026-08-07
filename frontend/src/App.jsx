import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import StudentProgress from "./pages/StudentProgress";
import AssessmentComparison from "./pages/AssessmentComparison";
import ProgressReport from "./pages/ProgressReport";
import StudentError from "./pages/StudentError";
import DiagnosticReport from "./pages/DiagnosticReport";
import ErrorDashboard from "./pages/ErrorDashboard";
import AssessmentHistory from "./pages/AssessmentHistory";

function App() {
	return (
		<Routes>
			<Route path="/" element={<Landing />} />

			<Route path="/student-progress" element={<StudentProgress />} />

			<Route path="/assessment-comparison" element={<AssessmentComparison />} />

			<Route path="/progress-report" element={<ProgressReport />} />

			<Route path="/student-errors/:reportId" element={<StudentError />} />

			<Route path="/diagnostic-report" element={<DiagnosticReport />} />
			<Route path="/error-report/:reportId" element={<DiagnosticReport />} />

			<Route path="/error-dashboard" element={<ErrorDashboard />} />

			<Route path="/student/:id" element={<StudentProgress />} />

			<Route path="/error-dashboard/:id" element={<ErrorDashboard />} />
			<Route path="/student/:id/assessments" element={<AssessmentHistory />} />
		</Routes>
	);
}

export default App;
