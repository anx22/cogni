-- =============================================================================
--  graphiti-reconcile Cron-Job (K4 Stufe 3)
-- -----------------------------------------------------------------------------
--  pg_cron + pg_net Extensions sind aus Stufe 1 verfügbar.
--  Job läuft alle 30 Minuten und feuert POST gegen die reconcile-EF mit dem
--  Retry-Modus (reconcile_failed=true). attempt + cooldown sind im EF-Pfad
--  über selectRetryCandidates abgehandelt.
--
--  ⚠ EINMALIGER MANUELLER SETUP-SCHRITT (NICHT in Migration committable):
--
--    -- 1) Service-Role-Key in Vault einspielen (Supabase-Studio → Settings → Vault):
--    SELECT vault.create_secret('<service-role-key>', 'service_role_key',
--      'graphiti retry cron — Service-Role für interne EF-Calls');
--
--    -- 2) Supabase-URL als App-Setting (Supabase setzt das normalerweise default,
--    --    falls nicht: in postgresql.conf oder per ALTER DATABASE setzen):
--    -- ALTER DATABASE postgres SET app.settings.supabase_url
--    --   = 'https://<projektref>.supabase.co';
--
--  Konflikt-Schutz: cron.unschedule eines bestehenden gleichnamigen Jobs vorab.
-- =============================================================================

-- Bestehenden Job entfernen, falls vorhanden (idempotent).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'graphiti-reconcile-loop') THEN
    PERFORM cron.unschedule('graphiti-reconcile-loop');
  END IF;
END $$;

-- Neuen Cron-Job einplanen: alle 30 Minuten, POST gegen reconcile-EF.
SELECT cron.schedule(
  'graphiti-reconcile-loop',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/graphiti-reconcile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'
      )
    ),
    body := jsonb_build_object(
      'max_facts', 100,
      'last_n', 200,
      'reconcile_failed', true,
      'max_attempts', 3,
      'retry_cooldown_min', 30
    )::text
  ) AS request_id;
  $$
);
