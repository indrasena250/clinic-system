const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validateDemoSession, trackDemoData } = require("../controllers/demoController");
const { trackDemoDataMiddleware } = require("../middleware/demoMiddleware");
const {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  getTotalExpenses,
  getTodayExpenses
} = require("../controllers/financeController");
const {
  addIncome,
  getIncome,
  deleteIncome,
  updateIncome,
  getIncomeByType,
  getTodayIncome,
  getTodayIncomeSummary,
  getIncomeTotal
} = require("../controllers/incomeController");

router.use(protect);

// Expense routes
router.post("/expense", validateDemoSession, trackDemoDataMiddleware("daily_expenses"), addExpense);
router.get("/expenses", getExpenses);
router.get("/today-expense", getTodayExpenses);
router.put("/expense/:id", updateExpense);
router.delete("/expense/:id", deleteExpense);
router.get("/expenses-total", getTotalExpenses);

// Income routes
router.post("/income", validateDemoSession, trackDemoDataMiddleware("extra_income"), addIncome);
router.get("/income", getIncome);
router.get("/income-summary", getIncomeByType);
router.get("/income-summary-today", getTodayIncomeSummary);
router.get("/income-total", getIncomeTotal);
router.put("/income/:id", updateIncome);
router.delete("/income/:id", deleteIncome);

module.exports = router;