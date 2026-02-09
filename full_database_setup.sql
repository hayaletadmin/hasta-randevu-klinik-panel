-- 1. UUID Eklentisini Aç
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabloları Oluştur (Yoksa)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Güvenlik) Ayarlarını Sıfırla ve Herkese Aç
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Departments Full Access" ON departments;
DROP POLICY IF EXISTS "Doctors Full Access" ON doctors;
DROP POLICY IF EXISTS "Admins Read Access" ON admins;
DROP POLICY IF EXISTS "Admins Manage Access" ON admins;

-- Yeni politikaları oluştur (HERKESE AÇIK ERİŞİM)
CREATE POLICY "Departments Full Access" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Doctors Full Access" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins Read Access" ON admins FOR SELECT USING (true);
CREATE POLICY "Admins Manage Access" ON admins FOR ALL USING (true);

-- 4. Admin Kullanıcısını Tekrar Ekle (Garanti Olsun)
INSERT INTO admins (email, password, full_name)
VALUES ('harunirfan2000@gmail.com', 'admin123', 'Harun İrfan')
ON CONFLICT (email) DO NOTHING;
