-- =============================================================================
--  delta_type: 'unclear' ergänzen
-- -----------------------------------------------------------------------------
--  Schließt Drift TS↔DB: src/lib/project/types.ts:19 hat DeltaTyp = "...|unclear"
--  seit 2026-05-19 (siehe docs/DECISIONS.md Z. 91), DB-ENUM hinkt nach.
--  Eingeführt heute, damit künftig niemand beim Insert in proposed_facts.delta_type
--  oder change_events.event_type auf 'unclear' knallt.
--
--  Pattern-Referenz: 20260518185014 (box_type um 10 Werte erweitert).
-- =============================================================================

ALTER TYPE public.delta_type ADD VALUE IF NOT EXISTS 'unclear';
