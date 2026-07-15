require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/pms/config/db");
const { notFound, errorHandler } = require("./src/pms/error/errorHandling");

const studentRoutes = require("./src/pms/routes/studentRoutes");
const assessmentRoutes = require("./src/pms/routes/assessmentRoutes");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
	res.json({ message: "DAS Progress Monitoring System API is running" });
});

app.use("/api/students", studentRoutes);
app.use("/api/assessments", assessmentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
