const express = require("express");
const healthRoutes = require("./healthRoutes");
const analysisRoutes = require("./analysisRoutes");
const studentRoutes = require("./studentRoutes");
const reportRoutes = require("./reportRoutes");
const uploadRoutes = require("./uploadRoutes");

const router = express.Router();

router.use(healthRoutes);
router.use(analysisRoutes);
router.use(studentRoutes);
router.use(reportRoutes);
router.use("/uploads", uploadRoutes);

module.exports = router;
