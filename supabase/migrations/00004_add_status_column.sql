-- ============================================================
-- ADD STATUS COLUMN TO PROFILES + FIX VERIFY API
-- ============================================================

-- 1. Tambah kolom status ke tabel profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'guest'
CHECK (status IN ('guest', 'pending', 'active', 'rejected'));

-- 2. Update semua profile yang belum punya status jadi 'guest'
UPDATE public.profiles
SET status = 'guest'
WHERE status IS NULL;

-- 3. Verify hasilnya
SELECT id, username, role, status FROM public.profiles ORDER BY updated_at DESC;

