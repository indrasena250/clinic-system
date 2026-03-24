# Database Setup Guide for Settlement Feature

## 500 Error Resolution

The 500 error when settling is likely due to missing database schema. Follow these steps:

### Step 1: Run the Main Settlement Migration

Execute this SQL in your MySQL database:

```sql
-- Run SETTLEMENTS_MIGRATION.sql to set up the settlements table
-- and add created_at columns to support settlement windows

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
ALTER TABLE patients ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE expenses ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE extra_income ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3) Backfill created_at for existing rows
UPDATE patients SET created_at = CONCAT(upload_date, ' 00:00:00') 
WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00';

UPDATE expenses SET created_at = CONCAT(expense_date, ' 00:00:00') 
WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00';

UPDATE extra_income SET created_at = CONCAT(income_date, ' 00:00:00') 
WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00';
```

### Step 2: Fix Existing Schema (if needed)

If the settlements table already exists with the old schema, run FIX_SETTLEMENTS_TABLE.sql:

```sql
DROP TABLE IF EXISTS settlements;

CREATE TABLE settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  from_time DATETIME NOT NULL,
  to_time DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_clinic_settlement (clinic_id, created_at)
);
```

### Step 3: Verify Schema

Run these queries to verify the setup:

```sql
-- Check settlements table structure
DESCRIBE settlements;

-- Check if created_at columns exist
DESCRIBE patients;
DESCRIBE expenses;
DESCRIBE extra_income;

-- Check for data in tables
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM expenses;
SELECT COUNT(*) FROM extra_income;
```

## Troubleshooting

If settlement still fails after running migrations, check:

1. **Server logs** - Look for detailed error messages in the backend console
2. **clinic_id** - Ensure the user token includes clinic_id:
   ```sql
   SELECT * FROM users WHERE id = [your_user_id];
   ```
3. **Foreign key constraints** - Verify clinics table exists:
   ```sql
   SELECT * FROM clinics;
   ```

## What Each Table Tracks

- **settlements**: Records of each settlement period with totals
- **patients**: Patient visits/scans with amounts (income)
- **expenses**: Clinic expenses with dates
- **extra_income**: Additional income sources with dates
