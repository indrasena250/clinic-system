-- Settlement-based reporting migration
-- Run this in your MySQL database (once).

-- 1) Settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  from_time DATETIME NOT NULL,
  to_time DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_clinic_settlement (clinic_id, created_at)
);

-- 2) Add created_at timestamps to support settlement windows
-- Patients
ALTER TABLE patients
  ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Expenses
ALTER TABLE expenses
  ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Extra income
ALTER TABLE extra_income
  ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3) Backfill (best-effort) for existing rows that were date-only
-- If you already have valid created_at values, these updates are harmless.
UPDATE patients
SET created_at = CONCAT(upload_date, ' 00:00:00')
WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00';

UPDATE expenses
SET created_at = CONCAT(expense_date, ' 00:00:00')
WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00';

UPDATE extra_income
SET created_at = CONCAT(income_date, ' 00:00:00')
WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00';

