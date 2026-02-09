-- 1. Bölüm isimlerini benzersiz (UNIQUE) yap
-- Not: Eğer veritabanında zaten aynı isimden varsa bu hata verebilir, önce mükerrerleri temizlemek gerekebilir.
ALTER TABLE departments ADD CONSTRAINT unique_department_name UNIQUE (name);

-- 2. Doktor isimlerini benzersiz (UNIQUE) yap
ALTER TABLE doctors ADD CONSTRAINT unique_doctor_full_name UNIQUE (full_name);

-- 3. Silme Hatasını Çöz: patients tablosundaki doctor_id kısıtlamasını 'ON DELETE SET NULL' olarak güncelle
-- Önce mevcut kısıtlamayı kaldırıyoruz (Genelde patients_doctor_id_fkey ismindedir)
-- Eğer kısıtlama ismini bilmiyorsanız bu manuel kontrol gerektirebilir ama standart isimlendirme budur.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_doctor_id_fkey') THEN
        ALTER TABLE patients DROP CONSTRAINT patients_doctor_id_fkey;
    END IF;
END $$;

-- Yeni kısıtlamayı 'ON DELETE SET NULL' ile ekle
ALTER TABLE patients 
ADD CONSTRAINT patients_doctor_id_fkey 
FOREIGN KEY (doctor_id) 
REFERENCES doctors(id) 
ON DELETE SET NULL;

-- 4. Randevular için de aynı işlemi yap (Her ihtimale karşı)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_doctor_id_fkey') THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_doctor_id_fkey;
    END IF;
END $$;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_doctor_id_fkey 
FOREIGN KEY (doctor_id) 
REFERENCES doctors(id) 
ON DELETE SET NULL;
