---
name: verstehens-loop
description: Phase 7 + 7.5 — End-to-End Loop, Projektzuordnung, Live-Stimme, Härtung
type: feature
---

# Verstehens-Loop (Phase 7 + 7.5)

## Architektur

Input → assets → (Datei: intake-process → Unstructured) → intake-understand
→ Agent (Lovable AI Gateway, Tool-Calling) → Lexikalisches Scoring +
Assignment-Agent → proposed_facts + dialog_session + review_cases (inkl.
Zuordnungsbox) → Realtime → EntityVoice + Kern "review-ready" →
Dialog-Overlay → commit-fact schreibt canonical_facts (+ gap_signals /
dependencies bei passendem fact_type) + change_event → Verlauf.

## Zentrale Steuerung

**Alles, was den Agenten betrifft, lebt in einer Datei:**
`supabase/functions/_shared/agentConfig.ts`

- `AGENT_MODEL`, `AGENT_TIMEOUT_MS`
- `AGENT_SYSTEM_PROMPT`, `ASSIGNMENT_SYSTEM_PROMPT`
- `EXTRACT_FACTS_TOOL`, `SUGGEST_ASSIGNMENT_TOOL`
- `ASSIGNMENT_CONFIDENT_THRESHOLD = 3`, `ASSIGNMENT_UNCERTAIN_THRESHOLD = 1`
- `mapToBoxType()`, `MAX_INPUT_CHARS`, `MAX_FACTS_PER_RUN`

**Provider-Adapter:** `supabase/functions/_shared/agentClient.ts`
Kapselt zwei Calls: `callExtractFacts(text)` und `callSuggestAssignment()`.
Bei Wechsel auf LangChain / externen Agent-Service: nur diese Datei tauschen.
AbortController mit 30s. Fehler: Rate, Payment, Timeout.

## Härtung (7.5)

- `assets.understanding_status` (pending|running|empty|review_ready|failed|
  rate_limited|payment_required) ist die Wahrheit für die UI — getrennt vom
  Parsing-Status.
- `assets.understanding_attempt` zählt Retries.
- Idempotenz: laufende/fertige Assets werden nicht erneut verarbeitet.
- Unique-Index auf `proposed_facts(user_id, extraction_run_id)`.
- Frontend: Retry-Button neben EntityVoice bei failed/rate_limited/payment.

## Projektzuordnung

Siehe `mem://features/projekt-zuordnung`. Kurz: explizit > lexikalisch >
agentisch. Zuordnungsbox als erste Box wenn unsicher; bei Auto-Zuordnung
als sanfte Bestätigung. `commit-fact` liest Wahl aus
`dialog_sessions.metadata.assignment.assigned_project_id` — kein Lazy-
"Allgemein" mehr.

## Live-Stimme

`EntityVoice` + `useEntityVoice` komponieren aus Realtime-Events
(assets, proposed_facts, dialog_sessions) deterministische Sätze. Min-
Anzeige 1.5s, Soft-Fade/Blur-Übergang. Backend liefert nur den
`agent_reason` aus Assignment-Metadaten — alle anderen Sätze sind FE.

## Frontend-Mapping

- `src/lib/dialog/boxMapping.ts` — DB-box_type → UI ("wissen", ...)
- `src/lib/dialog/loadSession.ts` — DB-box_state (englisch) → UI (deutsch);
  Zuordnungsbox bekommt spezielles Payload (candidates, suggested_new_name,
  agent_reason, asset_id).
- `DialogProvider.commitBox(boxId, decision, userDecision)` — ruft
  commit-fact mit user_decision (z.B. {project_id} oder {new_project_name}).

## commit-fact — Spezialpfade

- `box_type='assignment'`: schreibt Wahl in Session-Metadaten, propagiert
  `project_id` auf Asset und alle proposed_facts dieser extraction_run_id.
- `fact_type='open_point'`: zusätzlich Eintrag in `gap_signals`.
- `fact_type='reference'`: zusätzlich Eintrag in `dependencies`
  (V1: Self-Ref, echtes Linking in Phase 8).
- Alle anderen: canonical_facts + change_event wie gehabt.

## Was bewusst grob ist

- Linking: nur String-Match auf `stakeholder`/`topic`-Titel.
- Box-Mapping: 3 Fälle (knowledge, conflict, gap_box) — Rest fällt auf knowledge.
- Konflikt-UI: noch der Demo-Look, lädt aber echte Cases.
- Reference-Linking: Self-Ref bis Graphiti (Phase 8).
