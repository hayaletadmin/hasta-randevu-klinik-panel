-- Kapatma/İstisna tablosu
-- Belirli tarihlerde klinik veya doktor kapatmaları için
CREATE TABLE closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closure_date DATE NOT NULL,
    start_time TIME, -- NULL ise tüm gün kapalı
    end_time TIME,   -- NULL ise tüm gün kapalı
    target_type TEXT NOT NULL CHECK (target_type IN ('clinic', 'doctor')),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE, -- target_type='doctor' ise dolu
    reason TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Index'ler
CREATE INDEX idx_closures_date ON closures(closure_date);
CREATE INDEX idx_closures_doctor ON closures(doctor_id);
CREATE INDEX idx_closures_active ON closures(is_active);

-- RLS Politikaları
ALTER TABLE closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Closures are viewable by authenticated users"
ON closures FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Closures are insertable by authenticated users"
ON closures FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Closures are updatable by authenticated users"
ON closures FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Closures are deletable by authenticated users"
ON closures FOR DELETE
TO authenticated
USING (true);

-- Anon kullanıcılar için okuma izni (randevu kontrolü için)
CREATE POLICY "Closures are viewable by anon"
ON closures FOR SELECT
TO anon
USING (true);
