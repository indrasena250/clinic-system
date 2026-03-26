/**
 * Settlement Service
 * Manual Settlement System - calculates and records settlements
 * Uses created_at BETWEEN from_time AND to_time (no DATE() usage)
 */

const db = require("../config/db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_START = "2000-01-01 00:00:00";

/**
 * Check if settlement already exists for today
 * @param {number} clinicId
 * @returns {Promise<boolean>}
 */
async function hasSettlementToday(clinicId) {
  const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
  const [rows] = await db.query(
    `SELECT id FROM settlements WHERE clinic_id = ? AND DATE(created_at) = ?`,
    [clinicId, today]
  );
  return rows.length > 0;
}

/**
 * Get the last settlement's to_time for a clinic
 * @param {number} clinicId
 * @returns {Promise<string|null>}
 */
async function getLastSettlementToTime(clinicId) {
  const [rows] = await db.query(
    `SELECT to_time FROM settlements WHERE clinic_id = ? AND to_time IS NOT NULL ORDER BY to_time DESC LIMIT 1`,
    [clinicId]
  );
  if (!rows[0]?.to_time) return null;
  const dt = rows[0].to_time;
  const parsed = dt instanceof Date ? dayjs(dt) : dayjs(String(dt));
  return parsed.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Get last settlement info (to_time and full record)
 * @param {number} clinicId
 * @returns {Promise<{to_time: string, from_time: string}|null>}
 */
async function getLastSettlementInfo(clinicId) {
  const [rows] = await db.query(
    `SELECT from_time, to_time FROM settlements WHERE clinic_id = ? ORDER BY to_time DESC LIMIT 1`,
    [clinicId]
  );
  if (!rows[0]) return null;
  const toValue = rows[0].to_time;
  const fromValue = rows[0].from_time;
  const to = (toValue instanceof Date ? dayjs(toValue) : dayjs(String(toValue))).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const from = (fromValue instanceof Date ? dayjs(fromValue) : dayjs(String(fromValue))).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  return { to_time: to, from_time: from };
}

/**
 * Get earliest created_at from patients, extra_income, expenses for a clinic
 * @param {number} clinicId
 * @returns {Promise<string|null>}
 */
async function getEarliestDataTime(clinicId) {
  const [[p]] = await db.query("SELECT MIN(created_at) AS m FROM patients WHERE clinic_id = ?", [clinicId]);
  const [[e]] = await db.query("SELECT MIN(created_at) AS m FROM expenses WHERE clinic_id = ?", [clinicId]);
  const [[x]] = await db.query("SELECT MIN(created_at) AS m FROM extra_income WHERE clinic_id = ?", [clinicId]);

  const dates = [p?.m, e?.m, x?.m].filter(Boolean);
  if (dates.length === 0) return null;

  const earliest = dates.reduce((min, d) => {
    const dStr = d instanceof Date ? d.toISOString().slice(0, 19).replace("T", " ") : String(d);
    const minStr = min instanceof Date ? min.toISOString().slice(0, 19).replace("T", " ") : String(min);
    return !min || dStr < minStr ? d : min;
  });
  
  if (earliest instanceof Date) {
    return earliest.toISOString().slice(0, 19).replace("T", " ");
  }
  return String(earliest);
}

/**
 * Calculate income, extraIncome, expenses for a time range
 * Formula: income = (total_amount - referral_amount), then settlement = income - expenses + extraIncome
 * @param {number} clinicId
 * @param {string} fromTime
 * @param {string} toTime
 */
async function calculateTotalsForRange(clinicId, fromTime, toTime) {
  // Income = SUM(amount - referral_amount) from patients
  const [incomeRows] = await db.query(
    `SELECT COALESCE(SUM(amount - COALESCE(referral_amount, 0)), 0) AS total 
     FROM patients 
     WHERE clinic_id = ? AND (COALESCE(created_at, upload_date) BETWEEN ? AND ?)`,
    [clinicId, fromTime, toTime]
  );

  // Extra Income
  const [extraRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total 
     FROM extra_income 
     WHERE clinic_id = ? AND (COALESCE(created_at, income_date) BETWEEN ? AND ?)`,
    [clinicId, fromTime, toTime]
  );

  // Expenses
  const [expenseRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total 
     FROM expenses 
     WHERE clinic_id = ? AND (COALESCE(created_at, expense_date) BETWEEN ? AND ?)`,
    [clinicId, fromTime, toTime]
  );

  const income = Number(incomeRows[0]?.total ?? 0);
  const extraIncome = Number(extraRows[0]?.total ?? 0);
  const expenses = Number(expenseRows[0]?.total ?? 0);

  return { income, extraIncome, expenses };
}

/**
 * Execute settlement for a clinic
 * @param {number} clinicId
 */
async function executeSettlement(clinicId) {
  try {
    // Validate clinic_id
    if (!clinicId || clinicId < 1) {
      throw new Error(`Invalid clinic_id: ${clinicId}`);
    }

    const toTime = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    let fromTime = await getLastSettlementToTime(clinicId);

    if (!fromTime) {
      const earliest = await getEarliestDataTime(clinicId);
      fromTime = earliest || DEFAULT_START;
    }
    // if fromTime is old UTC, keep as-is; was saved in same timezone style as toTime in this service.

    const { income, extraIncome, expenses } = await calculateTotalsForRange(clinicId, fromTime, toTime);

    const settlementAmount = income + extraIncome - expenses;

    await db.query(
      `INSERT INTO settlements (clinic_id, amount, from_time, to_time, created_at, settled_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [clinicId, settlementAmount, fromTime, toTime, toTime, toTime]
    );

    return {
      from_time: fromTime,
      to_time: toTime,
      income,
      extraIncome,
      expenses,
      settlementAmount,
    };
  } catch (error) {
    console.error("Settlement error details:", {
      clinicId,
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
    });
    throw error;
  }
}

module.exports = {
  executeSettlement,
  getLastSettlementToTime,
  getLastSettlementInfo,
  hasSettlementToday,
  getEarliestDataTime,
  calculateTotalsForRange,
};
