-- Add scan-type specific ID column to separate IDs per clinic per scan type
ALTER TABLE patients ADD COLUMN clinic_scan_patient_id INT UNSIGNED AFTER clinic_patient_id;

-- Create index for clinic_scan_patient_id
ALTER TABLE patients ADD INDEX idx_clinic_scan_patient_id (clinic_id, scan_category, clinic_scan_patient_id);

-- Populate clinic_scan_patient_id with ROW_NUMBER for existing records
UPDATE patients p
SET clinic_scan_patient_id = (
  SELECT ROW_NUMBER() OVER (PARTITION BY clinic_id, scan_category ORDER BY id)
  FROM (
    SELECT id, clinic_id, scan_category
    FROM patients p2
    WHERE p2.clinic_id = p.clinic_id AND p2.scan_category = p.scan_category
    ORDER BY id
  ) AS numbered
  WHERE numbered.id = p.id
);

-- Verify the column was added
SELECT id, clinic_id, scan_category, clinic_patient_id, clinic_scan_patient_id, patient_name FROM patients LIMIT 10;
