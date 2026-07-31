const express = require("express");
const healthRoutes = require("./healthRoutes");
const analysisRoutes = require("./analysisRoutes");
const studentRoutes = require("./studentRoutes");
const reportRoutes = require("./reportRoutes");

const router = express.Router();

router.use("/api", healthRoutes);
router.use("/api", analysisRoutes);
router.use("/api", studentRoutes);
router.use("/api", reportRoutes);

module.exports = router;
