BEGIN;

--------------------------------------------------
-- ROLE
--------------------------------------------------

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (
role IN
(
'guest',
'member',
'officer',
'guild_master'
)
);

--------------------------------------------------
-- STATUS
--------------------------------------------------

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_status_check
CHECK (
status IN
(
'guest',
'pending',
'active',
'rejected',
'banned'
)
);

--------------------------------------------------
-- BOSS STATUS
--------------------------------------------------

ALTER TABLE public.boss_tracker
DROP CONSTRAINT IF EXISTS boss_tracker_status_check;

ALTER TABLE public.boss_tracker
ADD CONSTRAINT boss_tracker_status_check
CHECK (
status IN
(
'alive',
'dead',
'spawning'
)
);

COMMIT;