-- Fix settlements table schema
-- Run this if the settlements table was created with the old schema

-- Check if the table exists and drop it if its schema is incomplete
DROP TABLE IF EXISTS settlements;

-- Create the correct settlements table
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
