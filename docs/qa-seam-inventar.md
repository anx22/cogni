# QA-SEAM-MAP

> Kontroll-Instrument, kein Backlog. Verletzung eines Vertrags = Bug.
> Pflege wenn Seam entsteht/umbaut/Risiko ändert. History → `DECISIONS.md`.
> **Vor Arbeit an:** Edge Functions · Commit-Pfad · Entity-Core · Intake → §1 lesen.

---

## 1. Offene Risiken

Stand: 2026-06-04 · Sortiert nach Schadenspotenzial × Eintrittswahrscheinlichkeit.

| #    | Seam                                   | Risiko                                                                                                                                                                                                                                    | Warum es offen ist                                      | R     |
| :--- | :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ | :---- |
| OR-2 | `EntityProvider` / `EntityRail`        | Entity-Core Phase 1 (Provider + Subscription-Singleton) noch nicht abgeschlossen. `EntityRail` hängt an Phase-0-Outputs, nicht am fertigen Provider. Mehrfach-Mount kann Racing-Subscriptions erzeugen sobald weitere Mounts hinzukommen. | Entity-Core Phase 1–7 läuft. Phase 0 ✅, Phase 1 aktiv. | **4** |
| OR-3 | `intake-understand` → `proposed_facts` | M4 S0 (Beleg-Verankerung): `evidence`-Zitat wird extrahiert aber nur im Konflikt-Drill gezeigt. Modell-Name + Prompt-Version fehlen in `provenance`. Jede Review-Card sollte Beleg tragen — tut sie noch nicht.                           | M4 S0 spezifiziert als `aktiv`, noch nicht deployed.    | **4** |
| OR-4 | Build-Drift (3 Stellen)                | `useProjectData` Migrations-Drift · `submitNote` DevLogCategory · `VerlaufFeed` — brauchen klare Backend-Entscheidung, kein blinder Fix. Können stille Laufzeitfehler erzeugen.                                                           | Explizit in `NOW.md §Aktive Loops` geführt.             | **3** |

---

## 2. Seam-Vertragsregister

> Was eine Seam immer garantieren muss. Verletzung = Bug. Spalte „Verletzung erkennen" = konkretes Signal im laufenden System.

### 2a. Pipeline — Edge Functions

| Seam                        | Garantiert                                                                                                                                                                                                                | Verletzung erkennen                                                                                  | R                                                                   |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ | --- |
| **E: `intake-trigger`**     | Jede Anfrage landet in `pipeline_events` mit `asset_id` + `correlation_id`. `mode='explicit'                                                                                                                              | 'assignment'`-Entscheidung ist geloggt.                                                              | Kein `pipeline_events`-Row für ein Asset das in `assets` auftaucht. | 3   |
| **E: `intake-process`**     | Unstructured-Aufruf hat eigene `pipeline_events`-Stage. Fehler von Unstructured werden differenziert geloggt (Timeout vs. 4xx vs. 5xx).                                                                                   | Unstructured-Fehler erscheint nur als generisches 500 ohne Stage-Marker.                             | 4                                                                   |
| **E: `intake-understand`**  | Jeder `proposed_facts`-Insert trägt: `extraction_run_id`, `modality`, `confidence`, `evidence`, `provenance.model`, `provenance.prompt_version`. Kein Insert ohne diese Felder.                                           | `proposed_facts`-Row ohne `modality` oder ohne `extraction_run_id`.                                  | **5**                                                               |
| **E: `aol-callback`**       | Jede Status-Transition (`processing → review_ready → committed`) schreibt einen `pipeline_events`-Row mit `level + status_before + status_after`.                                                                         | Transition passiert aber kein `pipeline_events`-Eintrag mit `status_before`.                         | 4                                                                   |
| **E: `commit-fact`**        | Kein `canonical_facts`-Insert ohne vorherigen `review_case` mit `decision = accepted`. `escalate:true` blockiert den Commit und hält den Review-Case offen. Jeder Insert schreibt `pipeline_events` mit `correlation_id`. | `canonical_facts`-Row ohne `review_case_id`. Oder: `escalate:true` gesendet, Row trotzdem committed. | **5**                                                               |
| **E: `graphiti-reconcile`** | Idempotent: gleicher `canonical_fact_id` zweimal = kein zweiter `/messages`-Call, kein zweiter `graphiti_sync_log`-Row mit `status='ok'`.                                                                                 | Zwei `graphiti_sync_log`-Rows für dieselbe `canonical_fact_id` mit `status='ok'`.                    | 3                                                                   |

### 2b. Frontend — Hooks & Komponenten

| Seam                                  | Garantiert                                                                                                                                              | Verletzung erkennen                                                                | R     |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------- | :---- |
| **F: `useIntake.intake`**             | Drei Stages (Storage-Upload → DB-Insert → Invoke) sind als separate `pipeline_events`-Stages erkennbar über dieselbe `correlation_id`.                  | Storage-Upload erfolgreich, aber kein `pipeline_events`-Row mit Stage `db_insert`. | 4     |
| **F: `commitRoute.planCommitRoute`**  | Einziger Ort der entscheidet _welche_ Commit-Aktion ausgeführt wird. Kein direkter DB-Write außerhalb. `escalate:true` → kein Commit, Box bleibt offen. | `commit-fact`-Aufruf der nicht durch `planCommitRoute` geroutet wurde.             | **5** |
| **F: `useEntity` / `EntityProvider`** | Singleton — exakt eine Supabase-Subscription unabhängig vom Mount-Count. `useEntityDetached` (OrbLab) ist die einzige legale Ausnahme.                  | Zwei simultane Realtime-Subscriptions auf denselben Entity-Channel.                | 4     |
| **F: `retryIntake`**                  | Gleiche Provenance-Standards wie Erst-Intake: `asset_id` bleibt erhalten, kein neuer `assets`-Row.                                                      | Retry erzeugt doppelten `assets`-Row für dasselbe Original-Asset.                  | 3     |
| **F: `FeedbackButton → submitNote`**  | Feedback-Intent läuft über `submitNote` + `__submitIntent: intake_note` → `intake-trigger`. Kein separater Edge-Function-Pfad.                          | Direkter Supabase-Insert in `feedback`-Tabelle aus dem Frontend.                   | 3     |

### 2c. Externe Service-Seams

| Seam                          | Garantiert                                                                                                                                                                                  | Verletzung erkennen                                                                | R                     |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------- | :-------------------- | ----------------------------------------------------------------------------------- | ----- |
| **X: Graphiti `/messages`**   | Jeder Call trägt `client_uuid` für Idempotenz. Fehler von Graphiti brechen den Commit nicht (async, fail-soft). `matched_via: 'local'                                                       | 'graphiti'                                                                         | 'none'` wird geloggt. | Commit scheitert wegen Graphiti-Timeout. Oder: `/messages`-Call ohne `client_uuid`. | **5** |
| **X: AOL-Service `/aol/run`** | AOL liest Graphiti (read-only). Kein Schreibpfad von AOL nach Supabase — ausschließlich über Cloud-Edge-Functions. `graph_hint` ist optional: Fehler → Fallback ohne Kontext, kein Abbruch. | AOL schreibt direkt in Supabase. Oder: AOL-Fehler bricht Intake ab statt Fallback. | 4                     |
| **X: Unstructured**           | Parsing-Fehler sind differenziert (`timeout` / `unsupported_format` / `api_error`) in `pipeline_events` erkennbar. Kein Parsing-Fehler verhindert den Intake-Record selbst.                 | Unstructured-Fehler → `assets`-Row landet nie in der DB.                           | 3                     |

---

## Systemweite Vertrags-Invarianten

Diese gelten für **alle** Seams ohne Ausnahme. Verletzung = sofortiger Bug.

```
1. HARD  withErrorBoundary()  — jede Edge Function. Kein ungewrappter Deno.serve-Handler.
2. HARD  createLogger()       — jede Pipeline-Stage. Kein console.log. CI blockt Pushes.
3. HARD  correlation_id       — jeder pipeline_events-Row trägt asset_id oder run_id.
4. HARD  RLS                  — jede neue Tabelle. User-Daten via auth.uid(), nie via FK.
5. HARD  Review vor Commit    — kein canonical_facts-Insert ohne review_case.decision=accepted.
6. HARD  Kein Direkt-Supabase — Frontend spricht nur über src/lib/<domain>/-Hooks, nie direkt.
```
