/**
 * Counter Service
 * Reusable business logic for Daily Counter System
 * Formula: counter_balance = (patients income + extra income) - expenses - settlements
 * Important: Always filters data AFTER last settlement to_time
 */

const db = require("../config/db");

/**
 * Get last settlement's to_time for filtering
 * @param {number} clinicId
 */
async function getLastSettlementToTime(clinicId) {
  const [rows] = await db.query(
    `SELECT to_time FROM settlements WHERE clinic_id = ? ORDER BY to_time DESC LIMIT 1`,
    [clinicId]
  );
  if (!rows[0]?.to_time) return null;
  const dt = rows[0].to_time;
  if (dt instanceof Date) {
    return dt.toISOString().slice(0, 19).replace("T", " ");
  }
  return String(dt);
}

/**
 * Get aggregated totals for a specific date - NEW DATA ONLY (after last settlement)
 * @param {number} clinicId
 * @param {string} date - YYYY-MM-DD format
 */
async function getDailyTotals(clinicId, date) {
  const lastSettlement = await getLastSettlementToTime(clinicId);
  const filterClause = lastSettlement ? `AND created_at > ?` : ``;
  const params = lastSettlement ? [clinicId, date, lastSettlement] : [clinicId, date];

  const [incomeRows] = await db.query(
    `SELECT COALESCE(SUM(amount - COALESCE(referral_amount, 0)), 0) AS total 
     FROM patients WHERE clinic_id = ? AND DATE(COALESCE(created_at, upload_date)) = ? ${filterClause}`,
    params
  );

  const [extraIncomeRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total 
     FROM extra_income WHERE clinic_id = ? AND DATE(COALESCE(created_at, income_date)) = ? ${filterClause}`,
    params
  );

  const [expenseRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total 
     FROM expenses WHERE clinic_id = ? AND DATE(COALESCE(created_at, expense_date)) = ? ${filterClause}`,
    params
  );

  const income = Number(incomeRows[0]?.total ?? 0);
  const extraIncome = Number(extraIncomeRows[0]?.total ?? 0);
  const expenses = Number(expenseRows[0]?.total ?? 0);

  const counter = income + extraIncome - expenses;

  return {
    date,
    income,
    extraIncome,
    expenses,
    counter: Math.max(0, counter),
  };
}

/**
 * Get counter balance for a date range - NEW DATA ONLY (after last settlement)
 * @param {number} clinicId
 * @param {string} startDate
 * @param {string} endDate
 */
async function getCounterByDateRange(clinicId, startDate, endDate) {
  const lastSettlement = await getLastSettlementToTime(clinicId);
  const filterClause = lastSettlement ? `AND created_at > ?` : ``;
  const params = lastSettlement ? [clinicId, startDate, endDate, lastSettlement] : [clinicId, startDate, endDate];

  const [incomeRows] = await db.query(
    `SELECT COALESCE(SUM(amount - COALESCE(referral_amount, 0)), 0) AS total 
     FROM patients WHERE clinic_id = ? AND DATE(COALESCE(created_at, upload_date)) BETWEEN ? AND ? ${filterClause}`,
    params
  );

  const [extraIncomeRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total 
     FROM extra_income WHERE clinic_id = ? AND DATE(COALESCE(created_at, income_date)) BETWEEN ? AND ? ${filterClause}`,
    params
  );

  const [expenseRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total 
     FROM expenses WHERE clinic_id = ? AND DATE(COALESCE(created_at, expense_date)) BETWEEN ? AND ? ${filterClause}`,
    params
  );

  const income = Number(incomeRows[0]?.total ?? 0);
  const extraIncome = Number(extraIncomeRows[0]?.total ?? 0);
  const expenses = Number(expenseRows[0]?.total ?? 0);
  const counter = income + extraIncome - expenses;

  return {
    startDate,
    endDate,
    income,
    extraIncome,
    expenses,
    counter: Math.max(0, counter),
  };
}

async function getMonthlyTotals(clinicId, year, month) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return getCounterByDateRange(clinicId, startDate, endDate);
}

async function getYearlyTotals(clinicId, year) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  return getCounterByDateRange(clinicId, startDate, endDate);
}

module.exports = {
  getDailyTotals,
  getCounterByDateRange,
  getMonthlyTotals,
  getYearlyTotals,
};
