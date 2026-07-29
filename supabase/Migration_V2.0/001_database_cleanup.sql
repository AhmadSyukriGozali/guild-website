BEGIN;

--------------------------------------------------
-- APP SETTINGS
--------------------------------------------------

ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

UPDATE public.app_settings
SET created_at = now()
WHERE created_at IS NULL;

--------------------------------------------------
-- BOSSES
--------------------------------------------------

ALTER TABLE public.bosses
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.bosses
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

UPDATE public.bosses
SET updated_at = now()
WHERE updated_at IS NULL;

--------------------------------------------------
-- BOSS TRACKER
--------------------------------------------------

ALTER TABLE public.boss_tracker
ALTER COLUMN status SET DEFAULT 'dead';

UPDATE public.boss_tracker
SET status='dead'
WHERE status IS NULL;

--------------------------------------------------
-- BOSS LOOTS
--------------------------------------------------

ALTER TABLE public.boss_loots
ADD CONSTRAINT boss_loots_updated_by_fkey
FOREIGN KEY (updated_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

COMMIT;