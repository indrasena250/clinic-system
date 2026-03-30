-- Add clinic-specific ID column to separate IDs per clinic
ALTER TABLE patients ADD COLUMN clinic_patient_id INT UNSIGNED AFTER clinic_id;

-- Create index for clinic_patient_id
ALTER TABLE patients ADD INDEX idx_clinic_patient_id (clinic_id, clinic_patient_id);

-- Populate clinic_patient_id with ROW_NUMBER for existing records
UPDATE patients p
SET clinic_patient_id = (
  SELECT ROW_NUMBER() OVER (PARTITION BY clinic_id ORDER BY id)
  FROM (
    SELECT id, clinic_id
    FROM patients p2
    WHERE p2.clinic_id = p.clinic_id
    ORDER BY id
  ) AS numbered
  WHERE numbered.id = p.id
);

-- Verify the column was added
SELECT id, clinic_id, clinic_patient_id, patient_name FROM patients LIMIT 10;
