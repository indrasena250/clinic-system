-- Update clinic 2 with phone numbers
-- Run this SQL manually in your MySQL database

-- First ensure phone column exists
ALTER TABLE clinics ADD COLUMN phone VARCHAR(100) NULL;

-- Set phone numbers for clinic 2
UPDATE clinics SET phone = '8977419348, 8977449348' WHERE id = 2;

-- Verify the update
SELECT id, name, phone FROM clinics;