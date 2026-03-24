/**
 * Counter Routes
 * GET /api/counter/:date - Daily counter balance
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getDailyCounter,
  getMonthlyCounter,
  getYearlyCounter,
} = require("../controllers/counterController");

router.use(protect);

router.get("/year/:year", getYearlyCounter);

/**
 * @route   GET /api/counter/month/:year/:month
 * @desc    Get monthly counter balance
 */
router.get("/month/:year/:month", getMonthlyCounter);

/**
 * @route   GET /api/counter/:date
 * @desc    Get daily counter balance (YYYY-MM-DD)
 */
router.get("/:date", getDailyCounter);

module.exports = router;
