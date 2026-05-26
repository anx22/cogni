---
name: projekt-zuordnung
description: Wie heterogene Inputs dem richtigen Projekt zugeordnet werden — Scoring, Schwellen, Review
type: feature
---

# Projektzuordnung

## Drei Signale, eine Entscheidung, ein Review

1. **Explizit** (stärkstes Signal):
   `assets.project_id` ist gesetzt (User hat im Projekt-Screen abgelegt).
   → Keine Zuordnungsfrage. Keine Box.

2. **Lexikalisch** (`projectScoring.ts`):
   - Projektname (ganzes Wort, case-insensitive) → +3
   - Stakeholder-Name (verknüpft via `project_stakeholder_links`) → +2 / Match
   - Themenname → +2 / Match
   - Org-Domain → +1 / Match
     Höchster Score wird gemerkt + die "reasons".

3. **Agentisch** (`callSuggestAssignment` — Tie-Breaker):
   Bekommt Roh-Text, kompakte Projektliste (Name, Beschreibung, Top-3-Themen,
   Stakeholder-Initialen), und die lexikalischen Hinweise als Kontext.
   Antwort: `{ project_id|null, confidence, reason_short, suggested_new_name?,
alternatives? }`.

## Schwellen (`agentConfig.ts`)

- `ASSIGNMENT_CONFIDENT_THRESHOLD = 3` — ab hier auto-zuordnen, wenn Agent
  zustimmt UND Confidence ≥ 0.6.
- `ASSIGNMENT_UNCERTAIN_THRESHOLD = 1` — 1..2 = unsicher → Auswahlbox.
- 0 + Agent leer → "Neues Projekt anlegen" mit `suggested_new_name`.

## UI-Verhalten

| Lage                          | Zuordnungsbox                                                         |
| ----------------------------- | --------------------------------------------------------------------- |
| Score ≥ 3 + Agent stimmt zu   | Sanfte Bestätigung („Zuordnung zu „X" — passt?"), Default = bestätigt |
| Score 1–2 oder Agent unsicher | Erste Box, Top-3 Kandidaten + „Neues Projekt"                         |
| Score 0 + Agent leer          | „Neues Projekt anlegen" mit Vorschlagsname                            |

In allen Fällen wird die Zuordnungsbox VOR den Wissens-Boxen angezeigt
(`priority: 1000`). `commit-fact` propagiert die Wahl auf:

- `dialog_sessions.metadata.assignment.assigned_project_id`
- `dialog_sessions.project_id`
- `assets.project_id`
- alle `proposed_facts` dieser `extraction_run_id`

## Bewusst nicht

- Embedding-Ähnlichkeit (Phase 8 mit Graphiti / pgvector)
- Auto-Splitting eines Assets über mehrere Projekte
- Lernende Score-Gewichtung
