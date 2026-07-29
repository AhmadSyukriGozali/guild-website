BEGIN;

DROP TRIGGER IF EXISTS update_bosses_updated_at
ON public.bosses;

CREATE TRIGGER update_bosses_updated_at
BEFORE UPDATE
ON public.bosses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tracker_updated_at
ON public.boss_tracker;

CREATE TRIGGER update_tracker_updated_at
BEFORE UPDATE
ON public.boss_tracker
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at
ON public.app_settings;

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE
ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;