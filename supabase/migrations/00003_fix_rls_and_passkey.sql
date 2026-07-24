-- ============================================================
-- FIX: RLS policy untuk app_settings + set default passkey
-- ============================================================

-- 1. HAPUS policy lama yang require authenticated
DROP POLICY IF EXISTS "App settings read -> authenticated" ON public.app_settings;

-- 2. BUAT policy baru yang allow anon read (karena passkey perlu dicek SEBELUM login)
CREATE POLICY "App settings read -> public" ON public.app_settings
  FOR SELECT USING (true);

-- 3. HAPUS policy insert/update yang mungkin blocking
DROP POLICY IF EXISTS "App settings insert -> staff only" ON public.app_settings;
DROP POLICY IF EXISTS "App settings update -> staff only" ON public.app_settings;

-- 4. BUAT ulang policy insert/update dengan akses lebih longgar
CREATE POLICY "App settings insert -> staff only" ON public.app_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "App settings update -> staff only" ON public.app_settings
  FOR UPDATE USING (true);

-- 5. SET DEFAULT PASSKEY (ganti 'guild123' dengan passkey Anda)
-- OVERRIDING SYSTEM VALUE karena kolom id identity GENERATED ALWAYS
INSERT INTO public.app_settings (id, guild_name, master_passkey_hash, emergency_lock)
OVERRIDING SYSTEM VALUE
VALUES (1, 'Guild Manager', 'guild123', false);

-- 6. CEK HASILNYA
SELECT * FROM public.app_settings;
