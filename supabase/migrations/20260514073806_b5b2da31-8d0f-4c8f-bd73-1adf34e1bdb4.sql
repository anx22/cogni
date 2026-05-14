
CREATE TABLE IF NOT EXISTS public.pipeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  fn text NOT NULL,
  stage text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  correlation_id text,
  asset_id uuid,
  run_id uuid,
  session_id uuid,
  project_id uuid,
  duration_ms integer,
  message text,
  payload jsonb DEFAULT '{}'::jsonb,
  error jsonb
);

CREATE INDEX IF NOT EXISTS idx_pipeline_events_asset ON public.pipeline_events(asset_id) WHERE asset_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pipeline_events_run ON public.pipeline_events(run_id) WHERE run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pipeline_events_corr ON public.pipeline_events(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pipeline_events_fn_ts ON public.pipeline_events(fn, ts DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_user_ts ON public.pipeline_events(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_level ON public.pipeline_events(level, ts DESC) WHERE level IN ('warn','error');

ALTER TABLE public.pipeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own pipeline_events"
  ON public.pipeline_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own pipeline_events"
  ON public.pipeline_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
