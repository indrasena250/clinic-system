-- ============================================
-- ADD NOT NULL CONSTRAINT TO ADDRESS FIELD
-- ============================================

-- 1. First, handle any existing NULL addresses by setting them to empty string
UPDATE unique_patients SET address = '' WHERE address IS NULL;

-- 2. Add NOT NULL constraint to address column
ALTER TABLE unique_patients MODIFY COLUMN address TEXT NOT NULL DEFAULT '';

-- ============================================
-- VERIFICATION
-- ============================================
-- Check the updated schema
-- DESCRIBE unique_patients;

-- Verify no NULL values exist in address
-- SELECT COUNT(*) FROM unique_patients WHERE address IS NULL;
