-- Final robustness check: uses gen_random_uuid() which is more reliable across schemas
CREATE TABLE IF NOT EXISTS patient_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies with absolute schema just in case
ALTER TABLE public.patient_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Patient Groups" ON public.patient_groups;
CREATE POLICY "Public Read Patient Groups" ON public.patient_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Insert Patient Groups" ON public.patient_groups;
CREATE POLICY "Public Insert Patient Groups" ON public.patient_groups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public Update Patient Groups" ON public.patient_groups;
CREATE POLICY "Public Update Patient Groups" ON public.patient_groups FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public Delete Patient Groups" ON public.patient_groups;
CREATE POLICY "Public Delete Patient Groups" ON public.patient_groups FOR DELETE USING (true);
