-- 1. Patients tablosundaki kısıtlamayı düzelt (Silerken hata almamak için)
-- Eğer kısıtlama varsa kaldır ve ON DELETE SET NULL ile yeniden ekle
DO $$ 
BEGIN
    -- Patients tablosu için
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_doctor_id_fkey') THEN
        ALTER TABLE patients DROP CONSTRAINT patients_doctor_id_fkey;
    END IF;
    
    -- Appointments tablosu için
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_doctor_id_fkey') THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_doctor_id_fkey;
    END IF;
END $$;

-- Kısıtlamaları ON DELETE SET NULL olarak ekle
ALTER TABLE patients 
ADD CONSTRAINT patients_doctor_id_fkey 
FOREIGN KEY (doctor_id) 
REFERENCES doctors(id) 
ON DELETE SET NULL;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_doctor_id_fkey 
FOREIGN KEY (doctor_id) 
REFERENCES doctors(id) 
ON DELETE SET NULL;

-- 2. Mükerrer verileri temizle (UNIQUE kısıtlaması hata vermesin diye)
-- Aynı isimdeki doktorlardan en yeni olanı tut, diğerlerini sil
DELETE FROM doctors a USING doctors b 
WHERE a.created_at < b.created_at 
AND a.full_name = b.full_name;

-- Aynı isimdeki bölümlerden en yeni olanı tut, diğerlerini sil
DELETE FROM departments a USING departments b 
WHERE a.created_at < b.created_at 
AND a.name = b.name;

-- 3. UNIQUE kısıtlamalarını ekle
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_full_name_key;
ALTER TABLE doctors ADD CONSTRAINT doctors_full_name_key UNIQUE (full_name);

ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE departments ADD CONSTRAINT departments_name_key UNIQUE (name);
