# Pipeline-Validierung Phase B+C — Befunde & Fix-Plan

## TL;DR

Die Kern-Innovation **läuft end-to-end durch**. Real-Daten beweisen das besser als ein synthetischer Smoke könnte:

- 4 Assets · 3 Unstructured-Parsings · 30 Vorschläge · 17 Reviews offen · **15 commitete Fakten** · **15 Graphiti-Episoden mit echter Entity-Extraktion** · RAG liefert sinnvolle Edges (`IS_CUSTOMER_OF: Teinacher`, `WORKS_AS: Leo Vogler @ FLANQ`, `CAMPAIGN_FOR …`).

Aber: **7 strukturelle Brüche** trüben das Bild. Ein synthetischer Smoke wäre jetzt verschwendete Zeit — die echten Daten zeigen alles, was wir brauchen. Stattdessen direkt fixen.

## Was real funktioniert (Beleg jeweils Live-Query)

```text
Schicht              Status   Beleg
───────────────────  ──────   ──────────────────────────────────────────────
Parsing (EML)        ✅       3 parsed_documents · 33/54/177 Segmente
Extraktion           ✅       30 proposed_facts · plausible Typen
Review-UI            ✅       35 cases · 17 offen · assignment + knowledge
Commit               ✅       15 canonical_facts · 15 change_events
Snapshot             ✅       15 snapshots (1 pro Commit)
Mirror → Graphiti    ✅       15 Episoden in beiden Projekten sichtbar
Entity-Extraktion    ✅       Edges wie WORKS_AS, IS_CUSTOMER_OF …
RAG-Search           ✅       /search liefert relevante Fakten
```

## Die 7 Brüche

### P0 — Datenintegrität

**1. `graphiti_uuid` bleibt für ALLE 15 canonical_facts NULL.**
`mirrorToGraphiti` setzt nur `provenance.graphiti = { queued: true, source_description: "canonical_fact:<id>" }`. Der Code-Kommentar verweist auf einen „Reconciler, der `graphiti_uuid` später auflöst" — der existiert aber nicht. Reverse-Lookup UI → Graphiti-Episode ist damit unmöglich.

**2. `graphiti_sync_log` strukturell tot.**
Tabelle existiert mit RLS, wird aber von keiner Edge-Function geschrieben. commit-fact loggt nur in `canonical_facts.provenance.graphiti`. Ohne Sync-Log keine Observability über fehlgeschlagene Spiegelungen, keine Retry-Strategie.

**3. Sender wird Entity.**
`graphitiAddMessage` schickt `role: "produktintelligenz", role_type: "system"`. Graphiti macht daraus die Entity „produktintelligenz(system)" und verbindet jeden echten Stakeholder darüber (`Stefan IS_AUFTRAGGEBER_OF produktintelligenz(system)`). Vergiftet den Graph mit Phantom-Knoten.

### P1 — Pipeline-Sauberkeit

**4. Note-Asset bypassed Unstructured.**
Asset „Miriam will treffen call am Montag 13 uhr" (file_type=note) hat **kein** parsed_document. Pfad `cloud_understand` greift direkt zu, ohne Provenance-Snippets. Für Notes vermutlich gewollt — aber dann muss ein Stub-parsed_document mit dem Notentext geschrieben werden, sonst bricht Provenance-Anzeige downstream.

**5. Session-Duplikate.**
Miriam-Asset hat **2 separate dialog_sessions** (`d6c001d3`, `22ad1473`) mit überlappenden, redundanten Boxes. Re-Trigger erzeugt neue Session statt die alte zu supersedieren.

**6. Asset ohne Zuordnung versteckt.**
Asset `113897e5` (AW_ Reels…) ist `review_ready` mit 54 Segmenten — taucht aber nirgends mit assignment-box auf. Hängt ohne UI-Anker.

### P2 — Sekundär

**7. Stale aol_runs (Phase-A-Befund noch offen).**
4 Runs zeigen auf gelöschte assets. Cascade-Delete für `aol_runs.asset_id` fehlt.

## Fix-Plan in Reihenfolge

### Schritt 1 — Graphiti-Reconciler + Sync-Log (P0-1, P0-2 zusammen)

Eine neue Edge-Function `graphiti-reconcile` (oder als Cron-Schritt in `inspect-graphiti`):

1. Findet alle `canonical_facts` mit `graphiti_uuid IS NULL` und `provenance->'graphiti'->>'queued' = 'true'`.
2. Pro Fakt: `GET /episodes?group_id=<project>&source_description=canonical_fact:<id>` → liest die echte Episode-UUID.
3. Schreibt `canonical_facts.graphiti_uuid = <uuid>` und einen Eintrag in `graphiti_sync_log` (`status='ok'`, `entity_id=cf.id`, `payload={episode_uuid, search_url}`).
4. Fehler-Pfad: `graphiti_sync_log.status='failed'` mit Fehler-Body.

Zusätzlich: **commit-fact** muss bei jedem Spiegelungs-Versuch (Erfolg ODER Fehler) **direkt** in `graphiti_sync_log` schreiben. Macht die Tabelle endlich nutzbar und gibt der UI eine Quelle für „Mirror-Status pro Fakt".

### Schritt 2 — Episode-Struktur säubern (P0-3)

In `_shared/graphiti.ts` / Aufrufer:

- `role` und `role_type` raus aus dem `content`-Feld der Message. Der Sender gehört in Metadata, nicht in den Episode-Text.
- Episode-Body wird ausschließlich `episodeContent` (also `Title — key: value · …`).
- Vorhandene 15 Episoden mit Phantom-Entity cleasnen  
  
Schritt 3 — Note-Pfad: Stub-parsed_document (P1-4)

In `intake-process` (oder dem Pfad, der `cloud_understand` triggert): wenn `file_type='note'`, schreibe nach Trigger ein parsed_document mit `parser_version='note-direct'` und `segments=[{text: <note_body>, kind: 'note', offset: 0}]`. Damit hat jeder proposed_fact `parsed_document_id`, Provenance-Snippets funktionieren universell.

### Schritt 4 — Session-Dedup (P1-5)

`intake-trigger` / `intake-understand`: vor dem Anlegen einer neuen `dialog_sessions`-Zeile prüfen, ob für `(asset_id, status='open')` schon eine existiert. Wenn ja → bestehende Session schließen (`status='superseded'`) und neue erstmalige anlegen, oder die alte wiederverwenden mit zurückgesetzten Box-States. Konkrete Wahl: **superseden + neu anlegen**, behält Verlauf, vermeidet State-Mischmasch.

### Schritt 5 — Versteckte Assets sichtbar machen (P1-6)

Asset `113897e5` ohne assignment-box ist Symptom: nicht jeder review_ready-Lauf erzeugt eine Zuordnungs-Box, wenn der Agent „sicher" einem Projekt zuordnet. Aber wenn die Zuordnung fehlschlägt oder NULL bleibt, fehlt der UI-Einstieg.

Fix: in `aol-callback` / commit-Phase prüfen, ob `proposed_facts.project_id IS NULL` für die Session — dann assignment-box erzwingen, auch wenn der Agent keine Kandidaten lieferte (zumindest „neues Projekt"-Option).

### Schritt 6 — Cascade-Delete für aol_runs (P2-7)

Migration: `ALTER TABLE aol_runs ADD CONSTRAINT aol_runs_asset_fk FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE`. Phase-A-Stale-Runs einmalig per Insert-Tool aufräumen.

## Verifikation pro Schritt

Jeder Schritt wird sofort gegen reale Daten geprüft:

- **Schritt 1**: `SELECT count(*) FROM canonical_facts WHERE graphiti_uuid IS NOT NULL` → 15. `SELECT count(*) FROM graphiti_sync_log WHERE status='ok'` → ≥15.
- **Schritt 2**: Neuen Commit triggern → `railway-admin graphiti-probe` zeigt Episode ohne „produktintelligenz(system)" als Subjekt.
- **Schritt 3**: Note-Asset re-triggern → `parsed_documents` enthält Stub.
- **Schritt 4**: Re-Trigger Miriam → genau 1 offene Session.
- **Schritt 5**: Asset 113897e5 zeigt assignment-box im UI.
- **Schritt 6**: Asset löschen → zugehörige aol_runs verschwinden.

## Bewusste Auslassungen

- **Kein synthetischer Smoke-Test.** Real-Daten decken alle Pfade ab; ein zweiter, künstlicher Lauf liefert nichts Neues.
- **Kein UI-Drop für Reverse-Lookup** in dieser Runde. Sobald `graphiti_uuid` zuverlässig steht, kommt das als separates kleines UI-Feature.
- **Kein Eingriff in die Bestands-Episoden** mit Phantom-Entity. Cleanup wäre Bonus; Mehrwert gering, Risiko (Edge-Löschung in Neo4j) hoch.

## Technische Details


| Schicht           | Datei                                                 | Änderung                                                        |
| ----------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Reconciler        | neu: `supabase/functions/graphiti-reconcile/index.ts` | matched cf.id ↔ episode.uuid via `source_description`           |
| Sync-Log          | `supabase/functions/commit-fact/index.ts`             | bei jedem mirrorToGraphiti-Versuch insert in graphiti_sync_log  |
| Episode-Body      | `supabase/functions/_shared/graphiti.ts`              | role/role_type bleibt in payload, NICHT in content-Text         |
| Note-Stub         | `supabase/functions/intake-process/index.ts`          | branch `if file_type='note'` → write parsed_documents           |
| Session-Dedup     | `supabase/functions/intake-trigger/index.ts`          | upsert-by-asset, supersede vorherige                            |
| Forced Assignment | `supabase/functions/aol-callback/index.ts`            | falls keine assignment-box generiert wurde aber project_id NULL |
| Cascade           | neue Migration                                        | FK auf aol_runs.asset_id ON DELETE CASCADE                      |


## Frage vor Start

Schritt 5 (forced assignment-box) und Schritt 4 (session-dedup) berühren UX-Verhalten. Wenn Du eine andere Strategie für Re-Trigger willst (z.B. „Nicht supersedieren, sondern stille Fakt-Updates auf bestehender Session"), sag Bescheid — sonst gehe ich mit dem oben skizzierten Default los.