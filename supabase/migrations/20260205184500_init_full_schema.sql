-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tablo: Departments (Poliklinikler)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tablo: Doctors (Doktorlar)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    title TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tablo: Procedures (İşlemler)
CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    price DECIMAL(10, 2),
    duration_minutes INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tablo: Patients (Hastalar)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_no TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    gender TEXT,
    birth_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tablo: Appointments (Randevular)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    procedure_id UUID REFERENCES procedures(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT DEFAULT 'Bekleniyor', -- 'Bekleniyor', 'Tamamlandı', 'İptal', 'Gelmedi'
    priority TEXT DEFAULT 'normal', -- 'normal', 'acil', 'vip', 'engelli'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_identity_no ON patients(identity_no);

-- Seed Data (Başlangıç Verileri) - Mock verilerin aktarımı
INSERT INTO departments (name) VALUES
('Kardiyoloji'),
('Dermatoloji'),
('Göz Hastalıkları'),
('KBB'),
('Dahiliye'),
('Nöroloji'),
('Ortopedi'),
('Genel Cerrahi'),
('Üroloji')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Create policies for Departments table
-- Allow anyone to read departments
DROP POLICY IF EXISTS "Public Read Departments" ON departments;
CREATE POLICY "Public Read Departments" ON departments
FOR SELECT USING (true);

-- Allow insert/update/delete for ALL users (Admin access fix)
DROP POLICY IF EXISTS "Public Insert Departments" ON departments;
CREATE POLICY "Public Insert Departments" ON departments
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Departments" ON departments;
CREATE POLICY "Public Update Departments" ON departments
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Departments" ON departments;
CREATE POLICY "Public Delete Departments" ON departments
FOR DELETE USING (true);


-- Create policies for Doctors table
-- Allow anyone to read doctors
DROP POLICY IF EXISTS "Public Read Doctors" ON doctors;
CREATE POLICY "Public Read Doctors" ON doctors
FOR SELECT USING (true);

-- Allow insert/update/delete for ALL users (Admin access fix)
DROP POLICY IF EXISTS "Public Insert Doctors" ON doctors;
CREATE POLICY "Public Insert Doctors" ON doctors
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Doctors" ON doctors;
CREATE POLICY "Public Update Doctors" ON doctors
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Doctors" ON doctors;
CREATE POLICY "Public Delete Doctors" ON doctors
FOR DELETE USING (true);
