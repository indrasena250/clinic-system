/**
 * Settlement Routes
 * POST /api/settle - Execute manual settlement
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { settle } = require("../controllers/settlementController");

router.post("/", protect, settle);

module.exports = router;
