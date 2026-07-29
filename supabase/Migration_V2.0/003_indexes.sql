BEGIN;

CREATE INDEX IF NOT EXISTS idx_profiles_banned
ON public.profiles(is_banned);

CREATE INDEX IF NOT EXISTS idx_bosses_active
ON public.bosses(is_active);

CREATE INDEX IF NOT EXISTS idx_bosses_order
ON public.bosses(display_order);

CREATE INDEX IF NOT EXISTS idx_tracker_status
ON public.boss_tracker(status);

CREATE INDEX IF NOT EXISTS idx_tracker_killed
ON public.boss_tracker(killed_at);

CREATE INDEX IF NOT EXISTS idx_tracker_next_spawn
ON public.boss_tracker(next_spawn);

CREATE INDEX IF NOT EXISTS idx_loot_tracker
ON public.boss_loots(tracker_id);

CREATE INDEX IF NOT EXISTS idx_attendance_user
ON public.boss_attendance(user_id);

COMMIT;