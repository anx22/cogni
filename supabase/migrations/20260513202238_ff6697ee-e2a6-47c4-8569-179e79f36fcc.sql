DROP INDEX IF EXISTS public.app_settings_global_uniq;
DROP INDEX IF EXISTS public.app_settings_user_uniq;
CREATE UNIQUE INDEX app_settings_uniq ON public.app_settings (namespace, key, user_id) NULLS NOT DISTINCT;