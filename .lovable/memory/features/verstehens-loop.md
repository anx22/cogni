---
name: verstehens-loop
description: Phase 7 — End-to-End Loop von Input zu kanonischem Fakt; Agent-Config zentral, Provider austauschbar
type: feature
---

# Verstehens-Loop (Phase 7)

## Architektur
Input → assets → (Datei: intake-process → Unstructured) → intake-understand
→ Agent (Lovable AI Gateway, Tool-Calling) → proposed_facts + dialog_session
+ review_cases → Realtime → Kern "review-ready" → Dialog-Overlay zeigt echte
Cases → commit-fact schreibt canonical_facts + change_event → Verlauf.

## Zentrale Steuerung
**Alles, was den Agenten betrifft, lebt in einer Datei:**
`supabase/functions/_shared/agentConfig.ts`
- `AGENT_MODEL` — welches Modell (default: google/gemini-2.5-pro)
- `AGENT_SYSTEM_PROMPT` — Rolle/Verhalten
- `EXTRACT_FACTS_TOOL` — JSON-Schema für strukturierten Output
- `mapToBoxType()` — delta_type + fact_type → Box-Typ
- `MAX_INPUT_CHARS`, `MAX_FACTS_PER_RUN` — Limits

**Provider-Adapter:** `supabase/functions/_shared/agentClient.ts`
Kapselt den Aufruf. Bei Wechsel auf LangChain / externen Agent-Service:
nur diese Datei tauschen. Der Vertrag `callExtractFacts(text)` bleibt gleich.

## Frontend-Mapping
`src/lib/dialog/boxMapping.ts` — DB-Enum (`box_type`) → UI-Typ ("wissen", ...)
`src/lib/dialog/loadSession.ts` — lädt eine echte Session aus der DB.
DialogProvider exportiert `commitBox(boxId, decision)` — ruft `commit-fact`
auf, wenn die Box ein `__reviewCaseId` hat (echte Cases), sonst rein UI
(Demo-Modus).

## Was bewusst grob ist
- Linking: nur String-Match auf `stakeholder`/`topic`-Titel
- Box-Mapping: 3 Fälle (knowledge, conflict, gap_box) — Rest fällt auf knowledge
- Konflikt-UI: noch der Demo-Look, lädt aber echte Cases

## Default-Projekt
`commit-fact` legt lazy ein "Allgemein"-Projekt an, falls der User keines hat
(weil `canonical_facts.project_id` NOT NULL ist). Ersetzbar sobald die UI
explizite Projekt-Zuordnung beim Intake bekommt.
