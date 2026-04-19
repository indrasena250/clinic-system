const express = require("express");
const { createDemoSession, getDemoInfo, validateDemoSession, getDemoEmails } = require("../controllers/demoController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create demo session (guest or logged-in user)
router.post("/create", createDemoSession);

// Get demo info (requires auth, for demo users)
router.get("/info", protect, validateDemoSession, getDemoInfo);

// Get demo emails (for admin use)
router.get("/emails", getDemoEmails);

module.exports = router;