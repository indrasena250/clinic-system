-- ============================================
-- DAILY COUNTER SYSTEM - MySQL CLI Test Query
-- ============================================
-- Formula: counter = (patients income + extra income) - expenses - settlements
-- Replace '2026-03-19' with your desired date

-- Single combined query (optimized)
SELECT
  '2026-03-19' AS date,
  COALESCE((SELECT SUM(amount) FROM patients WHERE DATE(created_at) = '2026-03-19'), 0) AS income,
  COALESCE((SELECT SUM(amount) FROM extra_income WHERE DATE(created_at) = '2026-03-19'), 0) AS extraIncome,
  COALESCE((SELECT SUM(amount) FROM expenses WHERE DATE(created_at) = '2026-03-19'), 0) AS expenses,
  COALESCE((SELECT SUM(amount) FROM settlements WHERE DATE(created_at) = '2026-03-19'), 0) AS settlement,
  (
    COALESCE((SELECT SUM(amount) FROM patients WHERE DATE(created_at) = '2026-03-19'), 0) +
    COALESCE((SELECT SUM(amount) FROM extra_income WHERE DATE(created_at) = '2026-03-19'), 0) -
    COALESCE((SELECT SUM(amount) FROM expenses WHERE DATE(created_at) = '2026-03-19'), 0) -
    COALESCE((SELECT SUM(amount) FROM settlements WHERE DATE(created_at) = '2026-03-19'), 0)
  ) AS counter;

-- ============================================
-- INDEX SUGGESTIONS FOR PERFORMANCE
-- ============================================
-- Run these if indexes don't exist:

-- CREATE INDEX idx_patients_created_at ON patients(created_at);
-- CREATE INDEX idx_extra_income_created_at ON extra_income(created_at);
-- CREATE INDEX idx_expenses_created_at ON expenses(created_at);
-- CREATE INDEX idx_settlements_created_at ON settlements(created_at);

-- For DATE(created_at) = '...' queries, a functional index (MySQL 8.0+) or 
-- regular index on created_at helps. MySQL can use range scan on (date) index.

-- ============================================
-- CREATE SETTLEMENTS TABLE (if not exists)
-- ============================================
-- CREATE TABLE IF NOT EXISTS settlements (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   amount DECIMAL(12,2) NOT NULL DEFAULT 0,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================
-- MONTHLY REPORT EXTENSION
-- ============================================
-- GET /api/counter/month/:year/:month
-- Use: WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?

/*
SELECT
  ? AS year,
  ? AS month,
  COALESCE((SELECT SUM(amount) FROM patients 
    WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?), 0) AS income,
  COALESCE((SELECT SUM(amount) FROM extra_income 
    WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?), 0) AS extraIncome,
  COALESCE((SELECT SUM(amount) FROM expenses 
    WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?), 0) AS expenses,
  COALESCE((SELECT SUM(amount) FROM settlements 
    WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?), 0) AS settlement;
*/

-- ============================================
-- YEARLY REPORT EXTENSION
-- ============================================
-- GET /api/counter/year/:year
-- Use: WHERE YEAR(created_at) = ?

/*
SELECT
  ? AS year,
  COALESCE((SELECT SUM(amount) FROM patients WHERE YEAR(created_at) = ?), 0) AS income,
  COALESCE((SELECT SUM(amount) FROM extra_income WHERE YEAR(created_at) = ?), 0) AS extraIncome,
  COALESCE((SELECT SUM(amount) FROM expenses WHERE YEAR(created_at) = ?), 0) AS expenses,
  COALESCE((SELECT SUM(amount) FROM settlements WHERE YEAR(created_at) = ?), 0) AS settlement;
*/
