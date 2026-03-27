-- ============================================
-- MULTIPLE SCANS PER PATIENT - Database Migration
-- ============================================

-- 1. Create patients table for unique patient information
CREATE TABLE IF NOT EXISTS unique_patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  age INT,
  gender ENUM('Male', 'Female', 'Other'),
  mobile VARCHAR(15) NOT NULL,
  address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY unique_patient_mobile (clinic_id, mobile),
  INDEX idx_clinic_patient (clinic_id, patient_name)
);

-- 2. Create patient_scans table for individual scans
CREATE TABLE IF NOT EXISTS patient_scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  clinic_id INT NOT NULL,
  scan_category ENUM('CT', 'Ultrasound') NOT NULL,
  scan_name VARCHAR(255) NOT NULL,
  referred_doctor VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  upload_date DATETIME NOT NULL,
  referral_amount DECIMAL(10, 2) DEFAULT 0,
  referral_status ENUM('Pending', 'Paid', 'Cancelled') DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES unique_patients(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_patient_scan (patient_id, upload_date),
  INDEX idx_clinic_scan (clinic_id, upload_date)
);

-- 3. Migrate existing data from patients table to new structure
-- This will create unique patients and move scans to patient_scans table
INSERT IGNORE INTO unique_patients (clinic_id, patient_name, age, gender, mobile, address, created_at)
SELECT DISTINCT clinic_id, patient_name, age, gender, mobile, address, MIN(created_at)
FROM patients
GROUP BY clinic_id, patient_name, mobile;

-- Insert scans for existing patients
INSERT INTO patient_scans (patient_id, clinic_id, scan_category, scan_name, referred_doctor, amount, upload_date, referral_amount, created_at)
SELECT up.id, p.clinic_id, p.scan_category, p.scan_name, p.referred_doctor, p.amount, p.upload_date, COALESCE(p.referral_amount, 0), p.created_at
FROM patients p
JOIN unique_patients up ON up.clinic_id = p.clinic_id AND up.mobile = p.mobile AND up.patient_name = p.patient_name;

-- 4. Update doctor_referrals table to reference patient_scans instead of patients
-- (This assumes doctor_referrals.patient_id currently references patients.id)
-- We'll need to update this relationship

-- 5. Create view for backward compatibility (optional)
CREATE OR REPLACE VIEW patients_view AS
SELECT
  ps.id,
  up.patient_name,
  up.age,
  up.gender,
  up.mobile,
  up.address,
  ps.scan_category,
  ps.scan_name,
  ps.referred_doctor,
  ps.amount,
  ps.upload_date,
  ps.referral_amount,
  ps.referral_status,
  ps.created_at,
  up.clinic_id
FROM patient_scans ps
JOIN unique_patients up ON ps.patient_id = up.id;

-- ============================================
-- BACKWARD COMPATIBILITY QUERIES
-- ============================================

-- To get all patients (scans) - use patients_view instead of patients table
-- SELECT * FROM patients_view WHERE clinic_id = ? ORDER BY upload_date DESC;

-- To get CT patients only
-- SELECT * FROM patients_view WHERE clinic_id = ? AND scan_category = 'CT' ORDER BY upload_date DESC;

-- To get Ultrasound patients only
-- SELECT * FROM patients_view WHERE clinic_id = ? AND scan_category = 'Ultrasound' ORDER BY upload_date DESC;</content>
<parameter name="filePath">d:\clinic-system\MULTIPLE_SCANS_MIGRATION.sql