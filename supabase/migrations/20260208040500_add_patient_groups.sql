-- Create Patient Groups Table
CREATE TABLE IF NOT EXISTS patient_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add group_id to patients table
ALTER TABLE patients DROP COLUMN IF EXISTS group_id;
ALTER TABLE patients ADD COLUMN group_id UUID REFERENCES patient_groups(id) ON DELETE SET NULL;

-- Add index for group_id
CREATE INDEX IF NOT EXISTS idx_patients_group_id ON patients(group_id);
