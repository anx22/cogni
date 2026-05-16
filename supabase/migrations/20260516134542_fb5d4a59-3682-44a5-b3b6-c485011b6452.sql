DELETE FROM public.pipeline_events
  WHERE level IN ('error','warn') AND ts < '2026-05-15 00:00:00+00';

DELETE FROM public.graphiti_sync_log
  WHERE status IN ('queued','failed') AND created_at < now() - interval '24 hours';

DELETE FROM public.aol_runs
  WHERE status = 'failed' AND updated_at < now() - interval '24 hours';