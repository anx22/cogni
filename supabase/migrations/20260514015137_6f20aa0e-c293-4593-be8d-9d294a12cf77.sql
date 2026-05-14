DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'projects',
    'canonical_facts',
    'change_events',
    'tasks',
    'decisions',
    'deadlines',
    'gap_signals',
    'dependencies',
    'contradictions',
    'outcome_signals',
    'topics',
    'project_stakeholder_links',
    'open_points',
    'feedback',
    'project_state_snapshots',
    'review_cases',
    'graphiti_sync_log'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;