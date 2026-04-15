
-- ENUMS
CREATE TYPE public.asset_type AS ENUM ('pdf', 'docx', 'pptx', 'image', 'eml', 'note', 'other');
CREATE TYPE public.processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.delta_type AS ENUM ('confirm', 'add', 'replace', 'contradict', 'merge', 'discard');
CREATE TYPE public.review_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.box_type AS ENUM ('knowledge', 'assignment', 'conflict', 'selection', 'input', 'context', 'action');
CREATE TYPE public.box_state AS ENUM ('proposed', 'expanded', 'modified', 'confirmed', 'rejected', 'escalated');
CREATE TYPE public.fact_type AS ENUM ('topic', 'decision', 'deadline', 'task', 'open_point', 'stakeholder', 'reference', 'other');
CREATE TYPE public.decision_status AS ENUM ('active', 'superseded', 'revoked', 'draft');
CREATE TYPE public.contradiction_type AS ENUM ('deadline', 'decision', 'version', 'assignment');

-- HELPER
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROJECTS
CREATE TABLE public.projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PERSONS
CREATE TABLE public.persons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT, role TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own persons" ON public.persons FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORGANIZATIONS
CREATE TABLE public.organizations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, name TEXT NOT NULL, domain TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own organizations" ON public.organizations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ASSETS
CREATE TABLE public.assets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, file_name TEXT NOT NULL, file_type public.asset_type NOT NULL DEFAULT 'other', file_size BIGINT, storage_path TEXT, processing_status public.processing_status NOT NULL DEFAULT 'pending', metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own assets" ON public.assets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SOURCES
CREATE TABLE public.sources (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE, source_type TEXT NOT NULL, sender TEXT, recipients TEXT[], source_date TIMESTAMPTZ, extraction_run_id UUID, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sources" ON public.sources FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PARSED DOCUMENTS
CREATE TABLE public.parsed_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE, segments JSONB NOT NULL DEFAULT '[]', metadata JSONB DEFAULT '{}', parser_version TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.parsed_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own parsed_documents" ON public.parsed_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROPOSED FACTS
CREATE TABLE public.proposed_facts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL, parsed_document_id UUID REFERENCES public.parsed_documents(id) ON DELETE SET NULL, fact_type public.fact_type NOT NULL DEFAULT 'other', content JSONB NOT NULL, confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1), delta_type public.delta_type, against_fact_id UUID, extraction_run_id UUID, status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.proposed_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own proposed_facts" ON public.proposed_facts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CANONICAL FACTS
CREATE TABLE public.canonical_facts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, fact_type public.fact_type NOT NULL, content JSONB NOT NULL, source_proposed_fact_id UUID REFERENCES public.proposed_facts(id) ON DELETE SET NULL, valid_from TIMESTAMPTZ NOT NULL DEFAULT now(), valid_until TIMESTAMPTZ, superseded_by UUID, provenance JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.canonical_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own canonical_facts" ON public.canonical_facts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_canonical_facts_updated_at BEFORE UPDATE ON public.canonical_facts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REVIEW SESSIONS
CREATE TABLE public.review_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, status public.review_status NOT NULL DEFAULT 'open', summary TEXT, total_cases INT DEFAULT 0, resolved_cases INT DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review_sessions" ON public.review_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_review_sessions_updated_at BEFORE UPDATE ON public.review_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REVIEW CASES
CREATE TABLE public.review_cases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, session_id UUID NOT NULL REFERENCES public.review_sessions(id) ON DELETE CASCADE, proposed_fact_id UUID REFERENCES public.proposed_facts(id) ON DELETE SET NULL, box_type public.box_type NOT NULL DEFAULT 'knowledge', box_state public.box_state NOT NULL DEFAULT 'proposed', priority INT DEFAULT 0, title TEXT, description TEXT, context JSONB DEFAULT '{}', user_decision JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.review_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review_cases" ON public.review_cases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_review_cases_updated_at BEFORE UPDATE ON public.review_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CHANGE EVENTS
CREATE TABLE public.change_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, review_case_id UUID REFERENCES public.review_cases(id) ON DELETE SET NULL, canonical_fact_id UUID REFERENCES public.canonical_facts(id) ON DELETE SET NULL, event_type public.delta_type NOT NULL, previous_value JSONB, new_value JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.change_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own change_events" ON public.change_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COMMIT RESULTS
CREATE TABLE public.commit_results (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, session_id UUID NOT NULL REFERENCES public.review_sessions(id) ON DELETE CASCADE, committed_facts UUID[] DEFAULT '{}', rejected_facts UUID[] DEFAULT '{}', summary TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.commit_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own commit_results" ON public.commit_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROJECT STAKEHOLDER LINKS
CREATE TABLE public.project_stakeholder_links (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE, organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, role TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT stakeholder_link_check CHECK (person_id IS NOT NULL OR organization_id IS NOT NULL));
ALTER TABLE public.project_stakeholder_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stakeholder_links" ON public.project_stakeholder_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TOPICS
CREATE TABLE public.topics (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, canonical_fact_id UUID REFERENCES public.canonical_facts(id) ON DELETE SET NULL, name TEXT NOT NULL, description TEXT, merged_into UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own topics" ON public.topics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DECISIONS
CREATE TABLE public.decisions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, canonical_fact_id UUID REFERENCES public.canonical_facts(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT, status public.decision_status NOT NULL DEFAULT 'draft', decided_at TIMESTAMPTZ, valid_until TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own decisions" ON public.decisions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON public.decisions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DEADLINES
CREATE TABLE public.deadlines (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, canonical_fact_id UUID REFERENCES public.canonical_facts(id) ON DELETE SET NULL, title TEXT NOT NULL, due_date TIMESTAMPTZ NOT NULL, relevance TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deadlines" ON public.deadlines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON public.deadlines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TASKS
CREATE TABLE public.tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, canonical_fact_id UUID REFERENCES public.canonical_facts(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'open', assigned_to UUID REFERENCES public.persons(id) ON DELETE SET NULL, due_date TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- OPEN POINTS
CREATE TABLE public.open_points (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, canonical_fact_id UUID REFERENCES public.canonical_facts(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'open', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.open_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own open_points" ON public.open_points FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_open_points_updated_at BEFORE UPDATE ON public.open_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CONTRADICTIONS
CREATE TABLE public.contradictions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, contradiction_type public.contradiction_type NOT NULL, fact_a_id UUID REFERENCES public.canonical_facts(id) ON DELETE SET NULL, fact_b_id UUID REFERENCES public.canonical_facts(id) ON DELETE SET NULL, description TEXT, resolved BOOLEAN NOT NULL DEFAULT false, resolution TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.contradictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contradictions" ON public.contradictions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_contradictions_updated_at BEFORE UPDATE ON public.contradictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FEEDBACK
CREATE TABLE public.feedback (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, target_type TEXT NOT NULL, target_id UUID NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own feedback" ON public.feedback FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CORRECTIONS
CREATE TABLE public.corrections (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, canonical_fact_id UUID NOT NULL REFERENCES public.canonical_facts(id) ON DELETE CASCADE, previous_value JSONB, corrected_value JSONB NOT NULL, reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own corrections" ON public.corrections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- FACT REFERENCES
CREATE TABLE public.fact_references (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, source_type TEXT NOT NULL, source_id UUID NOT NULL, target_type TEXT NOT NULL, target_id UUID NOT NULL, relation TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.fact_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fact_references" ON public.fact_references FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- VERSION LINKS
CREATE TABLE public.version_links (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, predecessor_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE, successor_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE, link_type TEXT NOT NULL DEFAULT 'revision', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.version_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own version_links" ON public.version_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROJECT STATE SNAPSHOTS
CREATE TABLE public.project_state_snapshots (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, snapshot JSONB NOT NULL, summary TEXT, trigger_event TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.project_state_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own snapshots" ON public.project_state_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', false);
CREATE POLICY "Users upload own assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own assets" ON storage.objects FOR SELECT USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own assets" ON storage.objects FOR DELETE USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
