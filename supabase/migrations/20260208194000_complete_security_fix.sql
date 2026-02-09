-- ============================================
-- KAPSAMLI GÜVENLİK DÜZELTMESİ - TEK DOSYA
-- Infinite recursion sorununu çözer
-- Tüm RLS politikalarını düzeltir
-- ============================================

-- ============================================
-- 1. ESKİ POLİTİKALARI TEMİZLE (TÜM TABLOLAR)
-- ============================================

-- Users tablosu
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname); END LOOP;
END $$;

-- Departments
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'departments' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.departments', pol.policyname); END LOOP;
END $$;

-- Doctors
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'doctors' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.doctors', pol.policyname); END LOOP;
END $$;

-- Patients
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'patients' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.patients', pol.policyname); END LOOP;
END $$;

-- Appointments
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'appointments' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', pol.policyname); END LOOP;
END $$;

-- Procedures
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'procedures' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.procedures', pol.policyname); END LOOP;
END $$;

-- Patient Groups
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'patient_groups' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.patient_groups', pol.policyname); END LOOP;
END $$;

-- Clinic Settings
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'clinic_settings' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.clinic_settings', pol.policyname); END LOOP;
END $$;

-- Appointment History
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'appointment_history' AND schemaname = 'public'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointment_history', pol.policyname); END LOOP;
END $$;

-- ============================================
-- 2. SORUNLU FONKSİYONLARI SİL
-- ============================================

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_authenticated() CASCADE;

-- ============================================
-- 3. USERS TABLOSUNU OLUŞTUR/GÜNCELLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'doctor', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TÜM TABLOLARDA RLS ETKİNLEŞTİR
-- ============================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patient_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointment_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. YENİ POLİTİKALAR (FONKSİYON KULLANMADAN)
-- Direkt auth.uid() IS NOT NULL kontrolü
-- ============================================

-- USERS: Sadece kendi kaydını görebilir (FONKSİYON YOK - RECURSION OLMAZ)
CREATE POLICY "users_select" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- DEPARTMENTS: Herkes okuyabilir
CREATE POLICY "departments_read" ON public.departments
    FOR SELECT USING (true);
CREATE POLICY "departments_write" ON public.departments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "departments_modify" ON public.departments
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "departments_remove" ON public.departments
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- DOCTORS: Herkes okuyabilir
CREATE POLICY "doctors_read" ON public.doctors
    FOR SELECT USING (true);
CREATE POLICY "doctors_write" ON public.doctors
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "doctors_modify" ON public.doctors
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "doctors_remove" ON public.doctors
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- PATIENTS: Authenticated erişim
CREATE POLICY "patients_read" ON public.patients
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "patients_write" ON public.patients
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "patients_modify" ON public.patients
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "patients_remove" ON public.patients
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- APPOINTMENTS: Authenticated erişim
CREATE POLICY "appointments_read" ON public.appointments
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "appointments_write" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "appointments_modify" ON public.appointments
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "appointments_remove" ON public.appointments
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- PROCEDURES: Herkes okuyabilir
CREATE POLICY "procedures_read" ON public.procedures
    FOR SELECT USING (true);
CREATE POLICY "procedures_write" ON public.procedures
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "procedures_modify" ON public.procedures
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "procedures_remove" ON public.procedures
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- PATIENT_GROUPS: Authenticated erişim
CREATE POLICY "patient_groups_read" ON public.patient_groups
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "patient_groups_write" ON public.patient_groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "patient_groups_modify" ON public.patient_groups
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "patient_groups_remove" ON public.patient_groups
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- CLINIC_SETTINGS: Authenticated erişim
CREATE POLICY "clinic_settings_read" ON public.clinic_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "clinic_settings_write" ON public.clinic_settings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clinic_settings_modify" ON public.clinic_settings
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "clinic_settings_remove" ON public.clinic_settings
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- APPOINTMENT_HISTORY: Authenticated erişim
CREATE POLICY "appointment_history_read" ON public.appointment_history
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "appointment_history_write" ON public.appointment_history
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 6. FONKSİYONLAR (search_path güvenli)
-- ============================================

-- Fonksiyonları sil
DROP FUNCTION IF EXISTS public.get_todays_appointments() CASCADE;
DROP FUNCTION IF EXISTS public.get_appointments_by_date_range(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.get_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.log_appointment_changes() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- get_todays_appointments
CREATE FUNCTION public.get_todays_appointments()
RETURNS SETOF public.appointments
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT * FROM public.appointments
    WHERE appointment_date = CURRENT_DATE
    ORDER BY appointment_time;
$$;

-- get_appointments_by_date_range
CREATE FUNCTION public.get_appointments_by_date_range(start_date DATE, end_date DATE)
RETURNS SETOF public.appointments
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT * FROM public.appointments
    WHERE appointment_date >= start_date AND appointment_date <= end_date
    ORDER BY appointment_date, appointment_time;
$$;

-- get_dashboard_stats
CREATE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'total_appointments', (SELECT COUNT(*) FROM public.appointments),
        'todays_appointments', (SELECT COUNT(*) FROM public.appointments WHERE appointment_date = CURRENT_DATE),
        'completed_appointments', (SELECT COUNT(*) FROM public.appointments WHERE status = 'Tamamlandı'),
        'cancelled_appointments', (SELECT COUNT(*) FROM public.appointments WHERE status = 'İptal'),
        'total_patients', (SELECT COUNT(*) FROM public.patients WHERE is_active = true),
        'total_doctors', (SELECT COUNT(*) FROM public.doctors WHERE is_active = true)
    ) INTO result;
    RETURN result;
END;
$$;

-- update_updated_at_column
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- log_appointment_changes
CREATE FUNCTION public.log_appointment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- handle_new_user (Auth trigger)
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'), 'admin')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. ADMİNS TABLOSUNU SİL (artık gerekmiyor)
-- ============================================

DROP TABLE IF EXISTS public.admins CASCADE;

-- ============================================
-- TAMAMLANDI!
-- ============================================
