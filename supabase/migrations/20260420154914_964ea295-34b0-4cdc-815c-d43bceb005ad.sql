-- A. Realtime aktivieren
ALTER TABLE public.assets REPLICA IDENTITY FULL;
ALTER TABLE public.dialog_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.proposed_facts REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dialog_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposed_facts;

-- B. Idempotenz-Index reparieren
DROP INDEX IF EXISTS public.proposed_facts_extraction_run_id_user_idx;

CREATE UNIQUE INDEX IF NOT EXISTS dialog_sessions_extraction_run_unique
  ON public.dialog_sessions ((metadata->>'extraction_run_id'), user_id)
  WHERE metadata->>'extraction_run_id' IS NOT NULL;