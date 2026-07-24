-- ============================================================
-- FIX: RPC Function untuk verifikasi passkey (tanpa RLS)
-- ============================================================

-- Fungsi untuk verifikasi passkey tanpa perlu authenticated session
CREATE OR REPLACE FUNCTION public.verify_master_passkey(input_passkey TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  stored_passkey TEXT;
BEGIN
  SELECT master_passkey_hash INTO stored_passkey
  FROM public.app_settings
  LIMIT 1;

  RETURN stored_passkey = input_passkey;
END;
$$;

-- Fungsi untuk mengambil guild_name (publik)
CREATE OR REPLACE FUNCTION public.get_guild_settings()
RETURNS TABLE (
  guild_name TEXT,
  emergency_lock BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT s.guild_name, s.emergency_lock
  FROM public.app_settings s
  LIMIT 1;
END;
$$;

-- Set default passkey (ganti 'guild123' dengan passkey yang Anda inginkan)
UPDATE public.app_settings 
SET master_passkey_hash = 'guild123'
WHERE master_passkey_hash = '' OR master_passkey_hash IS NULL;

