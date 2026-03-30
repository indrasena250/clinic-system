-- Add age_unit column to patients table to support months/years input
ALTER TABLE patients ADD COLUMN age_unit VARCHAR(10) DEFAULT 'years' AFTER age;

-- Verify the column was added
DESCRIBE patients;

-- Show sample data to confirm
SELECT id, patient_name, age, age_unit, gender, mobile FROM patients LIMIT 5;
