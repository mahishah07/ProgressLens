const express = require("express");
const router = express.Router();

// GET /api/health
router.get("/health", (req,res)=> {
    res.status(200).json({
        status:"ok",
        message: "Backend is running",
    });
});

// GET /api/test
router.get("/test", (req, res) => {
    res.status(200).json({
        message: "Test route is running",
    });
});

// Export router for app.js to use
module.exports = router;
