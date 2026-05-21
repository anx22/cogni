-- =============================================================================
--  P1-B4 topic-merge: Backfill + Trigger + Candidates-Tabelle
-- -----------------------------------------------------------------------------
--  Bisher unbenutzt: `topics`-Tabelle hat `merged_into` aber wird nirgends
--  befüllt. Topics existieren faktisch als canonical_facts mit fact_type='topic'.
--
--  Diese Migration:
--   1) Backfill `topics` aus existierenden canonical_facts (fact_type='topic')
--   2) Trigger AFTER INSERT auf canonical_facts: legt korrespondierende
--      topics-Zeile an (idempotent via canonical_fact_id-Lookup)
--   3) Neue Tabelle `topic_merge_candidates` für vom Detector erkannte
--      Merge-Kandidaten (analog contradictions/gap_signals/dependencies)
-- =============================================================================

-- ---------------------- 1) Backfill ----------------------
INSERT INTO public.topics (user_id, project_id, canonical_fact_id, name, description)
SELECT
  cf.user_id,
  cf.project_id,
  cf.id,
  COALESCE(NULLIF(cf.content->>'title', ''), NULLIF(cf.content->>'name', ''), 'Thema'),
  NULLIF(cf.content->>'description', '')
FROM public.canonical_facts cf
WHERE cf.fact_type = 'topic'
  AND cf.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.topics t WHERE t.canonical_fact_id = cf.id
  );

-- ---------------------- 2) Trigger ----------------------
CREATE OR REPLACE FUNCTION public.sync_topic_from_canonical_fact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.fact_type <> 'topic' OR NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;
  -- Idempotent: schon ein topics-Eintrag für diesen canonical_fact?
  IF EXISTS (SELECT 1 FROM public.topics WHERE canonical_fact_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.topics (user_id, project_id, canonical_fact_id, name, description)
  VALUES (
    NEW.user_id,
    NEW.project_id,
    NEW.id,
    COALESCE(NULLIF(NEW.content->>'title', ''), NULLIF(NEW.content->>'name', ''), 'Thema'),
    NULLIF(NEW.content->>'description', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_topic_on_canonical_fact_insert ON public.canonical_facts;
CREATE TRIGGER sync_topic_on_canonical_fact_insert
AFTER INSERT ON public.canonical_facts
FOR EACH ROW
EXECUTE FUNCTION public.sync_topic_from_canonical_fact();

-- ---------------------- 3) topic_merge_candidates ----------------------
CREATE TABLE IF NOT EXISTS public.topic_merge_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  target_topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  -- 'open' wartet auf User-Entscheidung; 'merged' / 'rejected' final
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'merged', 'rejected')),
  -- normalisiert auf sortierte Reihenfolge für Idempotenz (least, greatest)
  pair_key TEXT GENERATED ALWAYS AS (
    LEAST(source_topic_id::text, target_topic_id::text) || '|' ||
    GREATEST(source_topic_id::text, target_topic_id::text)
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS topic_merge_candidates_pair_unique
  ON public.topic_merge_candidates (project_id, pair_key);
CREATE INDEX IF NOT EXISTS topic_merge_candidates_user_idx
  ON public.topic_merge_candidates (user_id);
CREATE INDEX IF NOT EXISTS topic_merge_candidates_status_idx
  ON public.topic_merge_candidates (status);

ALTER TABLE public.topic_merge_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own topic_merge_candidates"
  ON public.topic_merge_candidates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_topic_merge_candidates_updated_at
  BEFORE UPDATE ON public.topic_merge_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime: REPLICA IDENTITY FULL + zur supabase_realtime Publikation hinzufügen.
ALTER TABLE public.topic_merge_candidates REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'topic_merge_candidates'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.topic_merge_candidates';
  END IF;
END $$;
