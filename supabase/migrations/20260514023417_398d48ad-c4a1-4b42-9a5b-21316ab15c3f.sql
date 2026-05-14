-- 1. Stale aol_runs entfernen (asset_id zeigt auf nicht existierende Assets)
DELETE FROM public.aol_runs ar
WHERE ar.asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.assets a WHERE a.id = ar.asset_id);

-- 2. Foreign Key mit Cascade-Delete für aol_runs.asset_id
ALTER TABLE public.aol_runs
  ADD CONSTRAINT aol_runs_asset_id_fkey
  FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

-- 3. Index für Sync-Log-Lookup pro Entity (Reconciler + UI)
CREATE INDEX IF NOT EXISTS idx_graphiti_sync_log_entity
  ON public.graphiti_sync_log (entity_id, created_at DESC);

-- 4. Index für Session-Dedup-Lookup
CREATE INDEX IF NOT EXISTS idx_dialog_sessions_trigger_ref
  ON public.dialog_sessions (trigger_ref_id, status);