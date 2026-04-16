-- 1. Enum: box_type um 'gap_box' erweitern
ALTER TYPE public.box_type ADD VALUE IF NOT EXISTS 'gap_box';

-- 2. Neue Enums
DO $$ BEGIN
  CREATE TYPE public.dependency_type AS ENUM ('blockiert_durch', 'wartet_auf', 'haengt_ab_von');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.gap_status AS ENUM ('open', 'in_clarification', 'resolved', 'obsolete');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.dialog_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. gap_signals
CREATE TABLE public.gap_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  impact TEXT,
  affects TEXT,
  status public.gap_status NOT NULL DEFAULT 'open',
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  canonical_fact_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gap_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gap_signals"
ON public.gap_signals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_gap_signals_updated_at
BEFORE UPDATE ON public.gap_signals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gap_signals_project ON public.gap_signals(project_id);
CREATE INDEX idx_gap_signals_status ON public.gap_signals(status);

-- 4. dependencies
CREATE TABLE public.dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  dependency_type public.dependency_type NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  description TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dependencies"
ON public.dependencies FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_dependencies_updated_at
BEFORE UPDATE ON public.dependencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dependencies_project ON public.dependencies(project_id);
CREATE INDEX idx_dependencies_source ON public.dependencies(source_type, source_id);
CREATE INDEX idx_dependencies_target ON public.dependencies(target_type, target_id);

-- 5. outcome_signals (Zielbild pro Projekt)
CREATE TABLE public.outcome_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  success_criteria TEXT NOT NULL,
  no_gos TEXT[] DEFAULT '{}'::text[],
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.outcome_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own outcome_signals"
ON public.outcome_signals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_outcome_signals_updated_at
BEFORE UPDATE ON public.outcome_signals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX idx_outcome_signals_project ON public.outcome_signals(project_id);

-- 6. dialog_sessions (getrennt von review_sessions)
CREATE TABLE public.dialog_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  trigger_ref_id UUID,
  status public.dialog_status NOT NULL DEFAULT 'open',
  summary TEXT,
  total_boxes INTEGER DEFAULT 0,
  resolved_boxes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dialog_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dialog_sessions"
ON public.dialog_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_dialog_sessions_updated_at
BEFORE UPDATE ON public.dialog_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dialog_sessions_project ON public.dialog_sessions(project_id);
CREATE INDEX idx_dialog_sessions_status ON public.dialog_sessions(status);