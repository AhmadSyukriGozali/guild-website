INSERT INTO public.app_settings
(
guild_name,
master_passkey_hash,
allow_guest_login,
maintenance_mode,
emergency_lock
)
SELECT
'Guild Portal',
'',
true,
false,
false
WHERE NOT EXISTS
(
SELECT 1
FROM public.app_settings
);