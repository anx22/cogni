

## Phase 5 — Status: vollständig ✓

Geprüft und abgeschlossen:
- `EntityCore` mit Drop + Click → öffnet Overlay
- `InputOverlay` mit Pills (Notiz/Link/Datei/Sprache), ESC + Cmd+Enter
- `detectInputType` (file/url/text) inkl. Paste-Detection
- `useIntake`-Hook als Plug-Point mit Toast + Pulse
- Voice als Platzhalter mit Toast „Phase 6"
- Docs (`implementierung-aktuell.md`, `geplant.md`) + Memory (`features/universeller-input.md`) gepflegt

Keine Lücken zur Phase-5-Definition.

---

## Plan: Phase 6 — Upload-Pipeline (V1)

### Ziel
Aus dem heutigen Mock-Intake wird ein echter Pfad: Datei/Notiz/Link landen in Supabase, werden geparst (bei Dateien), und sind als `assets` + `sources` + `parsed_documents` sichtbar. Kein Knowledge-Graph, keine Proposed Facts — das ist Phase 7.

### Scope-Schnitt (bewusst eng)
- **In:** Auth (Pflicht für RLS), Storage-Bucket, Asset-Insert, Notiz/Link als `asset_type=other` mit Inhalt im `metadata`, Datei-Upload mit Status-Tracking, Unstructured-Parsing via Edge Function, Realtime-Status am Kern
- **Out:** Voice-Aufnahme (bleibt Platzhalter), Proposed-Facts-Generierung, Knowledge-Graph, Review-Cases, Themen-Zuordnung, Projekt-Zuordnung im UI (alles `project_id=null` in V1)

### Architektur

**1. Auth (Voraussetzung)**
- Neue Seite `/auth` (Login + Signup, E-Mail/Passwort + Google)
- `useAuth`-Hook (Session-Listener nach Lovable-Pattern: `onAuthStateChange` zuerst, dann `getSession`)
- Auto-confirm aktivieren (Prototyp-Komfort, später abschaltbar)
- `Index.tsx` redirected zu `/auth`, wenn keine Session

**2. Storage**
- Neuer privater Bucket `intake-files` (RLS: nur eigener `user_id`-Pfad)
- Upload-Pfad: `{user_id}/{asset_id}/{filename}`

**3. Edge Function `intake-process`**
- Input: `{ asset_id }`
- Lädt Datei aus Storage, ruft Unstructured API
- Schreibt `parsed_documents` (segments) + `sources` (source_type='upload')
- Setzt `assets.processing_status` von `pending` → `processing` → `parsed` (oder `failed`)
- Secret nötig: `UNSTRUCTURED_API_KEY`

**4. Frontend-Verdrahtung**
- `useIntake` wird zum echten Upload-Hook:
  - **Datei:** Storage-Upload → `assets`-Insert → invoke `intake-process`
  - **Notiz:** `assets`-Insert mit `file_type='other'`, Inhalt als `metadata.text`, `processing_status='parsed'` (kein Parsing nötig)
  - **Link:** `assets`-Insert mit `file_type='other'`, URL als `metadata.url`, `processing_status='parsed'`
- Realtime-Subscription auf `assets` → Kern-Status spiegelt `processing_status`
- Toast-Stufen: „aufgenommen" → „verarbeitet" / „fehlgeschlagen"

**5. Side-Grid „Letzte Inputs" (rechts)**
Das heute leere rechte SideGrid bekommt eine schlanke Liste der letzten 8 Assets pro User (Name, Typ-Icon, Status-Punkt). Klick zeigt Toast mit Status — Drilldown kommt später.

### Datenmodell
Keine neuen Tabellen. Nutzt bestehende `assets`, `sources`, `parsed_documents`. Notizen/Links werden bewusst als `asset_type='other'` mit Inhalt in `metadata` modelliert — keine Sondertabellen, schlank.

### Sicherheit
- Bucket privat, RLS pfadbasiert auf `user_id`
- Edge Function nutzt Service-Role nur für Storage-Read und parsed_documents-Insert; alle User-Daten via `user_id` aus dem Asset
- `UNSTRUCTURED_API_KEY` als Secret (Add-Secret-Flow vor Bau)

### Was Nutzer beim Bau tun müssen
1. `UNSTRUCTURED_API_KEY` eingeben (Add-Secret-Prompt)
2. Sich nach Phase-6-Build einmal registrieren

### Betroffene Dateien
- **Neu:** `src/pages/Auth.tsx`, `src/hooks/useAuth.ts`, `supabase/functions/intake-process/index.ts`
- **Geändert:** `src/lib/intake/useIntake.ts` (echter Upload), `src/pages/Index.tsx` (Auth-Gate + Realtime), `src/components/entity/SideGrid.tsx` (rechte Seite mit echten Assets), `src/App.tsx` (Auth-Route)
- **Migrationen:** Bucket `intake-files` + Storage-RLS-Policies
- **Docs:** `docs/implementierung-aktuell.md`, `docs/geplant.md`
- **Memory:** `mem://features/upload-pipeline`

### Out of Scope (Phase 7+)
- Voice-Transkription
- Proposed Facts aus geparsten Segmenten erzeugen
- Knowledge-Graph (Graphiti)
- Projekt-Zuordnung beim Intake
- Dokument-Preview im Substanz-Bereich

### Reihenfolge der Umsetzung
1. Auth + Auth-Gate (sonst kein RLS-Test möglich)
2. Storage-Bucket + Policies
3. `useIntake` → echte DB-Inserts (Notiz/Link funktionieren sofort)
4. Edge Function + Datei-Upload + Realtime
5. SideGrid rechts mit Asset-Liste
6. Docs/Memory

