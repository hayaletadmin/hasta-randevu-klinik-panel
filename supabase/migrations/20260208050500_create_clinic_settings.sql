-- Klinik Ayarları Tablosu
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan Ayarları Ekle
INSERT INTO clinic_settings (key, value) VALUES 
('appointment_duration', '30'), -- dakika
('max_appointments_per_slot', '1') -- aynı saatteki max randevu
ON CONFLICT (key) DO NOTHING;
