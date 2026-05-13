# Sprint-Stand: Welle A live, Verifikation offen

## Heute deployt

- **Graphiti-Mirror in `commit-fact`** — `_shared/graphiti.ts` mit URL-Härtung; async `POST /messages` mit Client-UUID; `graphiti_uuid` zurück nach `canonical_facts`. Fehler brechen den Commit nicht.
- **AOL-Service (Railway)** — `router → context_loader → condenser → END`. `/aol/run` liefert nur `graph_context`. Kein DB-/Service-Role-Zugriff.
- **Welle-A-Integration** — `intake-trigger` → AOL → `intake-understand(graph_hint)`. `_shared/agentClient.ts → callExtractFacts(text, graphHint?)` hängt Hint als 2. System-Message vor User-Text (4 KB Limit). Legacy-Fallback ohne AOL-Secrets.

## Railway-Setup (User-Aktion)

Nur diese Variablen in Railway setzen:
- `GRAPHITI_SERVICE_URL`
- optional `GRAPHITI_SERVICE_TOKEN`, `AOL_SERVICE_TOKEN`
- optional `AOL_CALLBACK_URL`/`AOL_CALLBACK_TOKEN`
- optional `LANGSMITH_API_KEY`

**Niemals** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `DATABASE_URL` setzen — Railway hat bewusst keinen DB-Zugriff (Lovable-Cloud-User bekommen den Service-Role-Key sowieso nicht).

## Verifikation (sobald Railway-Redeploy durch ist)

1. Asset hochladen → `aol_runs` zeigt `status: completed`, Pipeline-Trace sichtbar.
2. Confirm im Review → `canonical_facts.graphiti_uuid` ist gesetzt (inspect-pipeline).
3. **Reuse-Check:** Zweites Asset im selben Projekt → `context_loader` liefert nicht-leeren Kontext, Extraction sortiert bestehende Fakten als `confirm` statt `add`.

## Nächster Sprint: Welle B

Linker / conflict_detector / gap_detector / dependency_detector zwischen `interpreter` und `condenser`. Erst starten, wenn Reuse-Check sauber ist.

## Was bewusst NICHT gemacht wird

- Keine Portierung von Scoring/Assignment/Hashing nach Python.
- Kein Schreibzugriff aus Python auf `proposed_facts` / `review_cases`.
- Kein Auto-Commit, Review-First bleibt.
- Kein Parallel-/Schatten-Run.
