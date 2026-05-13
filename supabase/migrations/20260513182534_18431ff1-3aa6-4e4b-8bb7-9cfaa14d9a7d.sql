-- Generic key-value app settings store
CREATE TABLE public.app_settings (
  namespace   text NOT NULL,
  key         text NOT NULL,
  value       jsonb NOT NULL,
  scope       text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','user')),
  user_id     uuid NULL,
  updated_by  uuid NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Composite uniqueness: a namespace/key/scope is unique;
-- for user scope, also unique per user_id.
CREATE UNIQUE INDEX app_settings_global_uniq
  ON public.app_settings (namespace, key)
  WHERE scope = 'global';

CREATE UNIQUE INDEX app_settings_user_uniq
  ON public.app_settings (namespace, key, user_id)
  WHERE scope = 'user';

CREATE INDEX app_settings_namespace_scope_idx
  ON public.app_settings (namespace, scope);

-- Enforce user_id presence consistent with scope
ALTER TABLE public.app_settings
  ADD CONSTRAINT app_settings_scope_user_chk
  CHECK (
    (scope = 'global' AND user_id IS NULL) OR
    (scope = 'user'   AND user_id IS NOT NULL)
  );

-- updated_at trigger
CREATE TRIGGER app_settings_set_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Global: any authenticated user may read/write, no delete
CREATE POLICY "Authenticated can read global settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (scope = 'global');

CREATE POLICY "Authenticated can insert global settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (scope = 'global' AND user_id IS NULL);

CREATE POLICY "Authenticated can update global settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (scope = 'global')
  WITH CHECK (scope = 'global' AND user_id IS NULL);

-- User-scoped: only owner
CREATE POLICY "Users read own settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (scope = 'user' AND auth.uid() = user_id);

CREATE POLICY "Users insert own settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (scope = 'user' AND auth.uid() = user_id);

CREATE POLICY "Users update own settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (scope = 'user' AND auth.uid() = user_id)
  WITH CHECK (scope = 'user' AND auth.uid() = user_id);

CREATE POLICY "Users delete own settings"
  ON public.app_settings FOR DELETE
  TO authenticated
  USING (scope = 'user' AND auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;