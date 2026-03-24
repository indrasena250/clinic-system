/**
 * Counter Controller
 * Handles HTTP requests for Daily Counter System
 */

const counterService = require("../services/counterService");

/**
 * GET /api/counter/month/:year/:month
 * Get monthly counter balance
 */
async function getMonthlyCounter(req, res) {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: "Invalid year or month" });
    }
    const result = await counterService.getMonthlyTotals(clinicId, year, month);
    res.json({
      year,
      month,
      ...result,
    });
  } catch (error) {
    console.error("Monthly counter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly counter",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * GET /api/counter/year/:year
 * Get yearly counter balance
 */
async function getYearlyCounter(req, res) {
  try {
    const clinicId = req.user?.clinic_id ?? 1;
    const year = parseInt(req.params.year, 10);
    if (isNaN(year)) {
      return res.status(400).json({ success: false, message: "Invalid year" });
    }
    const result = await counterService.getYearlyTotals(clinicId, year);
    res.json({
      year,
      ...result,
    });
  } catch (error) {
    console.error("Yearly counter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch yearly counter",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * GET /api/counter/:date
 * Get daily counter balance for a specific date
 */
async function getDailyCounter(req, res) {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Validate date is valid
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date value",
      });
    }

    const clinicId = req.user?.clinic_id ?? 1;
    const result = await counterService.getDailyTotals(clinicId, date);

    res.json({
      date: result.date,
      income: result.income,
      extraIncome: result.extraIncome,
      expenses: result.expenses,
      settlement: result.settlement,
      counter: result.counter,
    });
  } catch (error) {
    console.error("Counter controller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch counter balance",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

module.exports = {
  getDailyCounter,
  getMonthlyCounter,
  getYearlyCounter,
};
