require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/pms/config/db");
const { notFound, errorHandler } = require("./src/pms/error/errorHandling");

const studentRoutes = require("./src/pms/routes/studentRoutes");
const assessmentRoutes = require("./src/pms/routes/assessmentRoutes");
const progressRoutes = require("./src/pms/routes/progressRoutes");
const comparisonRoutes = require("./src/pms/routes/comparisonRoutes");
const reportRoutes = require("./src/pms/routes/reportRoutes");
const aiRoutes = require("./src/pms/routes/aiRoutes");
const sheetsRoutes = require("./src/pms/routes/sheetsRoutes");
const sheetsSync = require("./src/pms/services/sheetsSync");

connectDB().then(() => {
	if (process.env.NODE_ENV === "production") {
		sheetsSync.startPolling(30);
	}
});

const app = express();

app.use(cors());
//app.use(express.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
	res.json({ message: "DAS Progress Monitoring System API is running" });
});

app.use("/api/students", studentRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/comparison", comparisonRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/sheets", sheetsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
