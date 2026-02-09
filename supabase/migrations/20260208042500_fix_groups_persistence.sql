-- Simply ensure the column exists and has a default value
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_groups' AND column_name='is_active') THEN
        ALTER TABLE patient_groups ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update all existing records to be active
UPDATE patient_groups SET is_active = true WHERE is_active IS NULL;

-- Simple policies
ALTER TABLE patient_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Patient Groups" ON patient_groups;
CREATE POLICY "Public Read Patient Groups" ON patient_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Insert Patient Groups" ON patient_groups;
CREATE POLICY "Public Insert Patient Groups" ON patient_groups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public Update Patient Groups" ON patient_groups;
CREATE POLICY "Public Update Patient Groups" ON patient_groups FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public Delete Patient Groups" ON patient_groups;
CREATE POLICY "Public Delete Patient Groups" ON patient_groups FOR DELETE USING (true);
