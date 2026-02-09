-- Ensure patient_groups table exists
CREATE TABLE IF NOT EXISTS patient_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure group_id column exists on patients table with correct type
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='group_id') THEN
        ALTER TABLE patients ADD COLUMN group_id UUID REFERENCES patient_groups(id) ON DELETE SET NULL;
    ELSE
        -- If it exists, ensure it is UUID (it might be text from a manual script)
        ALTER TABLE patients ALTER COLUMN group_id TYPE UUID USING group_id::UUID;
        -- Add constraint if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='patients_group_id_fkey') THEN
            ALTER TABLE patients ADD CONSTRAINT patients_group_id_fkey FOREIGN KEY (group_id) REFERENCES patient_groups(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Policies (Redundant but safe)
ALTER TABLE patient_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Patient Groups" ON patient_groups;
CREATE POLICY "Public Read Patient Groups" ON patient_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Insert Patient Groups" ON patient_groups;
CREATE POLICY "Public Insert Patient Groups" ON patient_groups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public Update Patient Groups" ON patient_groups;
CREATE POLICY "Public Update Patient Groups" ON patient_groups FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public Delete Patient Groups" ON patient_groups;
CREATE POLICY "Public Delete Patient Groups" ON patient_groups FOR DELETE USING (true);
