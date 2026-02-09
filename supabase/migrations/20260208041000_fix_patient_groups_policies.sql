-- Allow public read/write for patient_groups
DROP POLICY IF EXISTS "Public Read Patient Groups" ON patient_groups;
CREATE POLICY "Public Read Patient Groups" ON patient_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Patient Groups" ON patient_groups;
CREATE POLICY "Public Insert Patient Groups" ON patient_groups FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Patient Groups" ON patient_groups;
CREATE POLICY "Public Update Patient Groups" ON patient_groups FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Patient Groups" ON patient_groups;
CREATE POLICY "Public Delete Patient Groups" ON patient_groups FOR DELETE USING (true);

-- Ensure RLS is enabled
ALTER TABLE patient_groups ENABLE ROW LEVEL SECURITY;
