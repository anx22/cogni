---
name: upload-pipeline
description: Phase 6 — Echte Pipeline für Datei/Notiz/Link via Supabase Storage + intake-process Edge Function. Notizen/Links als asset_type=note/other mit metadata.kind. Realtime spiegelt processing_status auf Kern.
type: feature
---

# Upload-Pipeline (Phase 6)

## Datenfluss
- **Datei**: Upload nach `intake-files/{user_id}/{asset_id}/{filename}` → assets-Insert (`pending`) → Edge Function `intake-process` → `processing` → Unstructured-Parse → `parsed_documents` + `sources` → `completed` (oder `failed` mit metadata.error)
- **Notiz**: Direkt als asset (`file_type=note`, `metadata.kind=note`, `metadata.text`), Status sofort `completed`
- **Link**: Direkt als asset (`file_type=other`, `metadata.kind=url`, `metadata.url`), Status sofort `completed`

## Sicherheit
- Bucket `intake-files` privat, RLS pfadbasiert (`{user_id}/...`)
- Edge Function nutzt Service-Role nur für Storage-Read und Inserts; user_id stammt immer aus dem Asset
- Auth Pflicht — Index redirected zu `/auth` ohne Session

## V1-Grenzen
- Keine Proposed Facts, kein Knowledge Graph, kein Review-Case
- `project_id` immer null (keine Projekt-Zuordnung im Intake)
- Keine Voice-Aufnahme (Phase 7)
- Auto-confirm Email aktiv (Prototyp-Komfort)

## UI
- Rechtes SideGrid (`RecentAssets`) zeigt letzte 16 Assets mit Typ-Icon + Status-Punkt
- Realtime-Subscription auf `assets` spiegelt Status auf den Kern (processing → pulse, failed → rot)
