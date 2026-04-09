-- Add address and phone columns to clinics table if they don't exist
-- Run this in MySQL to fix the clinic settings issue

ALTER TABLE clinics ADD COLUMN address VARCHAR(255) NULL;
ALTER TABLE clinics ADD COLUMN phone VARCHAR(100) NULL;

-- Set phone numbers for clinic 2
UPDATE clinics SET phone = '8977419348, 8977449348' WHERE id = 2;