

## Phase 7.5.1 — Bugfix: Live-Stimme & Verstehens-Loop laufen nicht

Drei harte, voneinander unabhängige Bugs blockieren den ganzen Loop. Alle drei sind klein, alle drei sind sicher.

### Befund

1. **Realtime ist für die relevanten Tabellen nicht aktiviert.**
   `pg_publication_tables` ist leer für `assets`, `dialog_sessions`, `proposed_facts`. Konsequenz: Die Subscriptions in `useEntityVoice` und `Index.tsx` feuern nie. **Keine** Live-Stimme, **kein** Wechsel auf `review-ready`.

2. **`intake-process` triggert `intake-understand` nicht.**
   Der Edge-Log zeigt nach Upload nur `"intake-process responded"` — kein einziger Eintrag von `intake-understand`. Ursache: `intake-process` macht ein `await fetch(...)` mit Service-Key gegen die Function-URL ohne `apikey`-Header. Supabase Edge Functions verwerfen den Call still. Beweis: das letzte erfolgreiche Asset (DESIGN.md, 17:45) hat `processing_status='completed'`, aber **kein** Verstehens-Lauf.

3. **Idempotenz-Index ist falsch.**
   Der Index heißt `proposed_facts_extraction_run_id_user_idx` und ist **eindeutig auf `extraction_run_id` allein** (nicht zusammen mit `user_id` wie geplant). Folge: Sobald zwei Fakten mit derselben `extraction_run_id` geschrieben werden — was der Normalfall ist, denn ein Lauf produziert mehrere Fakten — wirft Postgres genau den Fehler aus dem Edge-Log: `duplicate key value violates unique constraint`. Damit schlägt **jeder** Verstehens-Lauf mit ≥2 Fakten fehl.

### Lösung

**A. Realtime aktivieren** (Migration)
   - `ALTER PUBLICATION supabase_realtime ADD TABLE public.assets, public.dialog_sessions, public.proposed_facts;`
   - `ALTER TABLE … REPLICA IDENTITY FULL` für die drei Tabellen, damit `payload.new` vollständig ankommt.

**B. Idempotenz-Index reparieren** (Migration)
   - Drop `proposed_facts_extraction_run_id_user_idx`.
   - Statt eindeutigem Index pro Fakt: Eindeutigkeit gehört auf die **Session**, nicht auf den Fakt. Wir setzen sie dort, wo sie hingehört: **`UNIQUE INDEX dialog_sessions_extraction_run_unique ON dialog_sessions((metadata->>'extraction_run_id'), user_id)`**. Damit kann ein Lauf beliebig viele Fakten schreiben, aber pro `extraction_run_id` entsteht nur eine Session — sauberer Idempotenzpunkt. Die deterministische `extraction_run_id` (asset_id + attempt) wird im Code ergänzt.
   - In `intake-understand`: `extraction_run_id` deterministisch aus `asset_id + attempt` ableiten (nicht mehr `crypto.randomUUID()`), damit Idempotenz greift.

**C. Chain `intake-process → intake-understand` reparieren**
   - Statt rohem `fetch` den Supabase-Client benutzen: `admin.functions.invoke("intake-understand", { body: { asset_id } })`. Der Client setzt `apikey` und `Authorization` korrekt.
   - Nicht-blockierend (kein `await`), damit `intake-process` schnell zurückkommt.

**D. Kleine UI-Korrekturen für sichtbares Leben**
   - `Index.tsx`: zusätzlich auf `assets` **INSERT** hören (nicht nur UPDATE) — heute landet eine Notiz/Link sofort als Asset, der erste Voice-Satz „Ich nehme deine Notiz auf" kommt sonst nicht durch.
   - `useEntityVoice`: gleiche Subscription-Filter, einmal überprüft (sind bereits korrekt — bloß Realtime fehlte).
   - Beim direkten Asset-Insert für Notiz/Link in `useIntake` setzen wir `understanding_status='pending'` mit, damit es konsistent ist.

**E. Aufräumen der hängenden Assets**
   - Die 4 Assets mit `understanding_status='pending'` werden nicht angefasst (gehören zu altem Stand). Optional: Knopf am Kern/Devlog später; nicht in diesem Bugfix.

### Test-Erwartung

Notiz „Lisa Müller hat zugesagt, das Aurora-Angebot bis Freitag zu prüfen" reinwerfen →
1. EntityVoice zeigt sofort „Ich nehme deine Notiz auf."
2. Wechselt auf „Ich verstehe gerade."
3. Wechselt auf „Ich erkenne etwas." (erster proposed_fact)
4. Kern wird golden, Voice sagt „Bereit. 4 Sachen für dich."
5. Klick auf Kern → Dialog mit Zuordnungsbox + Wissens-Boxen.

### Betroffene Dateien

- **Migration (neu):** Realtime-Publication + REPLICA IDENTITY + Index-Tausch
- `supabase/functions/intake-process/index.ts` — `admin.functions.invoke` statt `fetch`
- `supabase/functions/intake-understand/index.ts` — deterministische `extraction_run_id`
- `src/pages/Index.tsx` — zusätzlicher INSERT-Listener auf `assets`
- `src/lib/intake/useIntake.ts` — `understanding_status: 'pending'` beim Notiz/Link-Insert

### Nicht in diesem Schnitt

- Backfill der hängenden Pending-Assets
- Visualisierung von `understanding_status` als kleiner Punkt am `RecentAssets`-Tile (kommt mit Politur)
- Inhaltliche Änderungen am Agent oder am Scoring

