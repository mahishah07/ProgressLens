const express = require("express");
const router = express.Router();
const { manualSync } = require("../controllers/sheetsController");

router.post("/sync", manualSync);

module.exports = router;
