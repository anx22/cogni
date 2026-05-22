-- =============================================================================
--  graphiti_sync_log: Retry-Loop-Schema (K4 Stufe 1)
-- -----------------------------------------------------------------------------
--  attempt-Spalte existiert seit 20260420213405, wurde aber nirgends pflegt.
--  Wir ergänzen last_retry_at + Retry-Index und aktivieren pg_cron + pg_net,
--  damit Stufe 3 (cron.schedule) zur Verfügung steht.
--
--  Kein Backfill nötig — neue Spalte ist NULL-default und wird in Stufe 2 von
--  graphiti-reconcile gesetzt.
-- =============================================================================

-- (1) last_retry_at — wann wurde dieser Sync-Eintrag zuletzt wieder versucht.
ALTER TABLE public.graphiti_sync_log
  ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

-- (2) Index für den Retry-Selektor: failed-Rows die ältere oder fehlende
--     last_retry_at haben, geordnet nach attempt (Backoff-Heuristik).
CREATE INDEX IF NOT EXISTS graphiti_sync_log_retry_idx
  ON public.graphiti_sync_log (status, attempt, last_retry_at)
  WHERE status = 'failed';

-- (3) Extensions für Cron-Job in Stufe 3.
--     Supabase-Konvention: in extensions-Schema, nicht public.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
