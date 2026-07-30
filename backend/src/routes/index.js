const express = require("express");
const healthRoutes = require("./healthRoutes");
const analysisRoutes = require("./analysisRoutes");

const router = express.Router();

router.use("/api", healthRoutes);
router.use("/api", analysisRoutes);

module.exports = router;