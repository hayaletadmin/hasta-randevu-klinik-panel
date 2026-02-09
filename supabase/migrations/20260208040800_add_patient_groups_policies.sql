-- Enable RLS for patient_groups (optional but good practice to follow current pattern)
ALTER TABLE patient_groups ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now to match other tables
CREATE POLICY "Public Read Patient Groups" ON patient_groups FOR SELECT USING (true);
CREATE POLICY "Public Insert Patient Groups" ON patient_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Patient Groups" ON patient_groups FOR UPDATE USING (true);
CREATE POLICY "Public Delete Patient Groups" ON patient_groups FOR DELETE USING (true);

-- Also ensure patients table has policies if not already there (for group_id updates)
-- Checking if policies exist is hard in SQL script without procedural logic, but these are new for this table
DROP POLICY IF EXISTS "Public Update Patients" ON patients;
CREATE POLICY "Public Update Patients" ON patients FOR UPDATE USING (true);
