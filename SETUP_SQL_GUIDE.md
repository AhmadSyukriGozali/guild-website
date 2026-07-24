# 🚀 Panduan Setup Supabase

## 1. Buat RPC Function & Set Passkey

Buka **Supabase Dashboard → SQL Editor**, lalu jalankan SQL berikut:

```sql
-- ============================================================
-- 1. BUAT RPC FUNCTION: verify_master_passkey
-- ============================================================
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

-- ============================================================
-- 2. SET DEFAULT PASSKEY STAFF (ganti 'guild123' sesuai keinginan)
-- ============================================================
UPDATE public.app_settings 
SET master_passkey_hash = 'guild123'
WHERE master_passkey_hash = '' OR master_passkey_hash IS NULL;

-- ============================================================
-- 3. CEK HASILNYA
-- ============================================================
SELECT * FROM public.app_settings;
SELECT * FROM public.profiles LIMIT 5;
```

## 2. Cek Tabel & Data

Buka **Supabase Dashboard → Table Editor**, pastikan tabel-tabel ini ada:
- ✅ `profiles` — data anggota guild
- ✅ `app_settings` — pengaturan guild (guild_name, passkey, emergency_lock)
- ✅ `boss_tracker` — daftar boss
- ✅ `boss_attendance` — kehadiran member
- ✅ `loot_history` — riwayat loot
- ✅ `loot_attendees` — peserta loot

## 3. Setelah Login Pertama

Setelah login via Google/Discord, cek **Table Editor → profiles**. Profile Anda akan otomatis terbuat dengan role `guest`. 

Untuk upgrade role Anda jadi `guild_master`, jalankan di SQL Editor:

```sql
UPDATE public.profiles 
SET role = 'guild_master' 
WHERE email = 'email-anda@gmail.com';  -- GANTI dengan email Anda
```

---

