-- Closures tablosu politikalarını sıkılaştır
-- Infinite recursion riskini azaltmak için auth.uid() direkt kullanılır

DROP POLICY IF EXISTS "Closures are viewable by authenticated users" ON closures;
DROP POLICY IF EXISTS "Closures are insertable by authenticated users" ON closures;
DROP POLICY IF EXISTS "Closures are updatable by authenticated users" ON closures;
DROP POLICY IF EXISTS "Closures are deletable by authenticated users" ON closures;
DROP POLICY IF EXISTS "Closures are viewable by anon" ON closures;

-- Herkes (anon dahil) kapatmaları görebilmeli (randevu uygunluğu için)
CREATE POLICY "closures_select_public" ON public.closures
    FOR SELECT USING (true);

-- Sadece giriş yapmış kullanıcılar ekleyebilir/düzenleyebilir/silebilir
CREATE POLICY "closures_insert_auth" ON public.closures
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "closures_update_auth" ON public.closures
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "closures_delete_auth" ON public.closures
    FOR DELETE USING (auth.uid() IS NOT NULL);
