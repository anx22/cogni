-- 1) Spalten ergänzen
ALTER TABLE public.canonical_facts
  ADD COLUMN IF NOT EXISTS graphiti_uuid TEXT;
CREATE INDEX IF NOT EXISTS idx_canonical_facts_graphiti_uuid
  ON public.canonical_facts(graphiti_uuid);

ALTER TABLE public.proposed_facts
  ADD COLUMN IF NOT EXISTS graphiti_episode_uuid TEXT;

-- 2) AOL-Runs Tabelle
CREATE TABLE IF NOT EXISTS public.aol_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_id UUID,
  project_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  langgraph_thread_id TEXT,
  current_node TEXT,
  trigger_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  error JSONB,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aol_runs_user ON public.aol_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_aol_runs_asset ON public.aol_runs(asset_id);
CREATE INDEX IF NOT EXISTS idx_aol_runs_project ON public.aol_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_aol_runs_status ON public.aol_runs(status);

ALTER TABLE public.aol_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own aol_runs"
  ON public.aol_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_aol_runs_updated_at
  BEFORE UPDATE ON public.aol_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Graphiti Sync Log
CREATE TABLE IF NOT EXISTS public.graphiti_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt INT NOT NULL DEFAULT 0,
  error TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_graphiti_sync_user ON public.graphiti_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_graphiti_sync_entity ON public.graphiti_sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_graphiti_sync_status ON public.graphiti_sync_log(status);

ALTER TABLE public.graphiti_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own graphiti_sync_log"
  ON public.graphiti_sync_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4) Testdaten leeren (Reihenfolge wegen FK-frei, aber sicherheitshalber CASCADE)
TRUNCATE TABLE
  public.commit_results,
  public.change_events,
  public.review_cases,
  public.dialog_sessions,
  public.corrections,
  public.contradictions,
  public.gap_signals,
  public.dependencies,
  public.deadlines,
  public.tasks,
  public.decisions,
  public.open_points,
  public.topics,
  public.outcome_signals,
  public.feedback,
  public.fact_references,
  public.version_links,
  public.project_state_snapshots,
  public.project_stakeholder_links,
  public.canonical_facts,
  public.proposed_facts,
  public.sources,
  public.parsed_documents,
  public.assets,
  public.projects,
  public.persons,
  public.organizations,
  public.aol_runs,
  public.graphiti_sync_log
CASCADE;