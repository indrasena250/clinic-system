const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addIncome,
  getIncome,
  deleteIncome,
  getIncomeTotal,
  getIncomeByType,
  getTodayIncomeSummary
} = require("../controllers/incomeController");

router.use(protect);
router.post("/income", addIncome);

router.get("/income", getIncome);

router.delete("/income/:id", deleteIncome);

router.get("/income-total", getIncomeTotal);
router.get("/income-summary", getIncomeByType);    
router.get("/income-summary-today", getTodayIncomeSummary); 

module.exports = router;