-- ============================================================
-- GUILD WEBSITE — SUPABASE INIT SCHEMA
-- ============================================================

-- 1. TABEL PROFILES (menyatu dengan auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  ign TEXT UNIQUE,                          -- In-Game Name
  username TEXT,                            -- Display name
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  game_class TEXT DEFAULT 'Unknown',         -- Class job di game
  role TEXT DEFAULT 'member' CHECK (role IN ('guest','member','officer','guild_master')),
  provider TEXT DEFAULT 'email',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL APP SETTINGS (pengaturan global guild)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guild_name TEXT DEFAULT 'My Guild',
  master_passkey_hash TEXT DEFAULT '',       -- Simpan hash (bukan plain text!)
  emergency_lock BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 3. TABEL BOSS TRACKER
CREATE TABLE IF NOT EXISTS public.boss_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT DEFAULT '',
  cooldown_minutes INT DEFAULT 120,
  next_spawn TIMESTAMPTZ DEFAULT NOW(),
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. TABEL BOSS ATTENDANCE (kehadiran member)
CREATE TABLE IF NOT EXISTS public.boss_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  boss_id UUID REFERENCES public.boss_tracker(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attended_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boss_id, user_id)
);

-- 5. TABEL LOOT HISTORY
CREATE TABLE IF NOT EXISTS public.loot_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  boss_id UUID REFERENCES public.boss_tracker(id) ON DELETE SET NULL,
  boss_name TEXT NOT NULL,
  killed_at TIMESTAMPTZ DEFAULT NOW(),
  dropped_items TEXT DEFAULT '',
  proof_image TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- 6. TABEL LOOT ATTENDEES (peserta yg berhak atas loot)
CREATE TABLE IF NOT EXISTS public.loot_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loot_id UUID REFERENCES public.loot_history(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ign TEXT,
  UNIQUE(loot_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_attendees ENABLE ROW LEVEL SECURITY;

-- PROFILES: Semua user bisa read, hanya user sendiri yg bisa update
CREATE POLICY "Profiles read -> authenticated" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles insert -> authenticated" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles update -> own user" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- APP SETTINGS: Semua authenticated bisa read, hanya officer/gm bisa update
CREATE POLICY "App settings read -> authenticated" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "App settings update -> staff only" ON public.app_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('officer','guild_master')
    )
  );

CREATE POLICY "App settings insert -> staff only" ON public.app_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('officer','guild_master')
    )
  );

-- BOSS TRACKER: Semua authenticated bisa read
CREATE POLICY "Boss tracker read -> authenticated" ON public.boss_tracker
  FOR SELECT USING (auth.role() = 'authenticated');

-- BOSS TRACKER: Hanya officer/gm bisa write (insert, update, delete)
CREATE POLICY "Boss tracker write -> staff only" ON public.boss_tracker
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer','guild_master'))
  );

CREATE POLICY "Boss tracker update -> staff only" ON public.boss_tracker
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer','guild_master'))
  );

CREATE POLICY "Boss tracker delete -> staff only" ON public.boss_tracker
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer','guild_master'))
  );

-- BOSS ATTENDANCE: Authenticated bisa read & insert (absen diri sendiri)
CREATE POLICY "Attendance read -> authenticated" ON public.boss_attendance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Attendance insert -> own user" ON public.boss_attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Attendance delete -> own user" ON public.boss_attendance
  FOR DELETE USING (auth.uid() = user_id);

-- LOOT HISTORY: Authenticated bisa read
CREATE POLICY "Loot read -> authenticated" ON public.loot_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- LOOT HISTORY: Staff hanya bisa insert/update
CREATE POLICY "Loot insert -> staff only" ON public.loot_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer','guild_master'))
  );

CREATE POLICY "Loot update -> staff only" ON public.loot_history
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer','guild_master'))
  );

-- LOOT ATTENDEES: Authenticated bisa read
CREATE POLICY "Loot attendees read -> authenticated" ON public.loot_attendees
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Loot attendees insert -> staff only" ON public.loot_attendees
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer','guild_master'))
  );

-- ============================================================
-- AUTO-CREATE PROFILE FUNCTION (Trigger after auth signup)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, email, provider, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
    'guest'
  );
  RETURN NEW;
END;
$$;

-- Trigger: ketika user baru daftar, auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INSERT DEFAULT APP SETTINGS (jika belum ada)
-- ============================================================
INSERT INTO public.app_settings (guild_name, master_passkey_hash, emergency_lock)
VALUES ('Guild Manager', '', FALSE)
ON CONFLICT (id) DO NOTHING;

