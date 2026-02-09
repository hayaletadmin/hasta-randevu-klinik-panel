-- clinic_settings tablosu için RLS politikaları
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Okuma izni (Herkes okuyabilir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Clinic Settings') THEN
        CREATE POLICY "Public Read Clinic Settings" ON clinic_settings FOR SELECT USING (true);
    END IF;
END $$;

-- Yazma/Güncelleme izni (Herkes güncelleyebilir - Admin paneli için)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Upsert Clinic Settings') THEN
        CREATE POLICY "Public Upsert Clinic Settings" ON clinic_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
