-- 1. UUID Eklentisini Aç (Zaten vardır ama garanti olsun)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Hastalar Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_no TEXT NOT NULL, -- UNIQUE kısıtlamasını kodda kontrol ediyoruz ama DB'de de olması iyi olur.
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    gender TEXT,
    birth_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Randevular Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    procedure_id UUID, -- Opsiyonel
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL, -- TIME yerine TEXT kullanıyoruz (Supabase JS formatı için daha kolay olabilir)
    status TEXT DEFAULT 'Bekleniyor',
    priority TEXT DEFAULT 'normal',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Güvenlik Kilitlerini (RLS) Kaldır (Hata almamak için)
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 5. İzinleri Herkese Aç
GRANT ALL ON patients TO postgres, anon, authenticated, service_role;
GRANT ALL ON appointments TO postgres, anon, authenticated, service_role;
