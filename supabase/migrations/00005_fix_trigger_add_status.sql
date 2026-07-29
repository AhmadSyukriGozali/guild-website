-- ============================================================
-- FIX: Trigger handle_new_user() harus set status = 'guest'
-- ============================================================

-- 1. Perbaiki fungsi trigger untuk menyertakan kolom status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, email, provider, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
    'guest',
    'guest'
  );
  RETURN NEW;
END;
$$;

-- 2. Pastikan semua profile yang sudah ada punya status
UPDATE public.profiles
SET status = 'guest'
WHERE status IS NULL;

-- 3. Verify
SELECT id, username, role, status FROM public.profiles ORDER BY updated_at DESC;
