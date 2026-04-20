-- Enum für Verstehens-Status
CREATE TYPE public.understanding_status AS ENUM (
  'pending',
  'running',
  'empty',
  'review_ready',
  'failed',
  'rate_limited',
  'payment_required'
);

-- Neue Spalten auf assets
ALTER TABLE public.assets
  ADD COLUMN understanding_status public.understanding_status NOT NULL DEFAULT 'pending',
  ADD COLUMN understanding_error TEXT,
  ADD COLUMN understanding_attempt INTEGER NOT NULL DEFAULT 0;

-- Idempotenz-Schutz: extraction_run_id darf nur einmal pro user vorkommen
CREATE UNIQUE INDEX IF NOT EXISTS proposed_facts_extraction_run_id_user_idx
  ON public.proposed_facts (user_id, extraction_run_id)
  WHERE extraction_run_id IS NOT NULL;