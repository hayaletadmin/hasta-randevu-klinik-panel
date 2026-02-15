-- 1. Create 'clinics' table
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT UNIQUE, -- Optional custom domain
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert Default Clinic (Backwards Compatibility)
-- We use a known UUID or let it generate, but we need to capture it to backfill.
-- For simplicity in a script, we'll do it in a DO block.

DO $$
DECLARE
    default_clinic_id UUID;
    default_clinic_slug TEXT := 'demo-klinik'; -- Change this to desired default slug
BEGIN
    -- Check if default clinic exists, if not create it
    SELECT id INTO default_clinic_id FROM clinics WHERE slug = default_clinic_slug;
    
    IF default_clinic_id IS NULL THEN
        INSERT INTO clinics (name, slug, is_active)
        VALUES ('Varsayılan Klinik', default_clinic_slug, true)
        RETURNING id INTO default_clinic_id;
    END IF;

    -- 3. Add clinic_id to existing tables and backfill
    -- We will loop through tables to add the column and FK

    -- Departments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'clinic_id') THEN
        ALTER TABLE departments ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE departments SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE departments ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_departments_clinic_id ON departments(clinic_id);
    END IF;

    -- Doctors
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'clinic_id') THEN
        ALTER TABLE doctors ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE doctors SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE doctors ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_doctors_clinic_id ON doctors(clinic_id);
    END IF;

    -- Procedures
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'clinic_id') THEN
        ALTER TABLE procedures ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE procedures SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE procedures ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_procedures_clinic_id ON procedures(clinic_id);
    END IF;

    -- Patients
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'clinic_id') THEN
        ALTER TABLE patients ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE patients SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE patients ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
    END IF;

    -- Appointments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'clinic_id') THEN
        ALTER TABLE appointments ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE appointments SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE appointments ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
    END IF;
    
    -- Patient Groups
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_groups' AND column_name = 'clinic_id') THEN
        ALTER TABLE patient_groups ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE patient_groups SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE patient_groups ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_patient_groups_clinic_id ON patient_groups(clinic_id);
    END IF;

    -- Closures
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'closures' AND column_name = 'clinic_id') THEN
        ALTER TABLE closures ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE closures SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE closures ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_closures_clinic_id ON closures(clinic_id);
    END IF;

    -- Notifications
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'clinic_id') THEN
        ALTER TABLE notifications ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE notifications SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
         -- Notifications might be system-wide or clinic specific. We'll default to clinic specific.
        ALTER TABLE notifications ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_notifications_clinic_id ON notifications(clinic_id);
    END IF;
    
     -- Patient Documents
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_documents' AND column_name = 'clinic_id') THEN
        ALTER TABLE patient_documents ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE patient_documents SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE patient_documents ALTER COLUMN clinic_id SET NOT NULL;
        CREATE INDEX idx_patient_documents_clinic_id ON patient_documents(clinic_id);
    END IF;

    -- Clinic Settings
    -- This table is tricky because it's currently EAV (Entity-Attribute-Value) with key-value pairs.
    -- Option A: Add clinic_id to each row.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_settings' AND column_name = 'clinic_id') THEN
        ALTER TABLE clinic_settings ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        UPDATE clinic_settings SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
        ALTER TABLE clinic_settings ALTER COLUMN clinic_id SET NOT NULL;
        -- Unique constraint should now be (clinic_id, key) instead of just (key)
        -- Drop old unique constraint if exists
        ALTER TABLE clinic_settings DROP CONSTRAINT IF EXISTS clinic_settings_key_key; 
        CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_settings_clinic_key ON clinic_settings(clinic_id, key);
    END IF;
    
    -- Migrate existing settings to the clinics table columns (optional but recommended for core info)
    -- We'll just keep them in the settings table for now to minimize refactor, 
    -- but eventually they should move to the `clinics` table columns (name, address, etc.)
    
END $$;
