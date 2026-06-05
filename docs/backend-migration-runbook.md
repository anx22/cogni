# Backend-Migration: Raus aus Lovable-Supabase → eigenständiges Supabase

> **Ziel:** Cogni vom Lovable-verwalteten Supabase-Projekt (`zeazrfidtpdtgcrbnhbo`,
> liegt in Lovables Org, für uns nicht administrierbar) auf ein **eigenständiges
> Supabase-Projekt** in eurem eigenen Account umziehen. Der Anwendungscode bleibt
> unverändert — der Frontend-Client liest rein aus `VITE_SUPABASE_*` (Env), das
> Schema liegt als Migrationen im Repo, die Edge Functions im Repo.
>
> **Daten:** Frischer Start (kein Alt-Daten-Import). Entscheidung 2026-06-05.

---

## 0. Voraussetzung — freier Projekt-Slot

Supabase begrenzt **Free-Projekte pro Benutzer** (nicht pro Org) auf 2. Der
Account `info@mikekaestner.de` hat beide Slots belegt (`baulog2`, `VPB`). Eine
neue Org **unter demselben Account** löst das **nicht**.

Eine der folgenden Bedingungen muss erfüllt sein, bevor das Projekt anlegbar ist:

- [ ] Ein **anderer Supabase-Account** (andere E-Mail) mit freiem Slot ist mit der
      Session-Integration verbunden, **oder**
- [ ] ein bestehendes Projekt (`baulog2`/`VPB`) ist pausiert/gelöscht, **oder**
- [ ] die Org ist auf **Pro** geupgradet.

---

## 1. Projekt anlegen

- **Name:** `cogni`
- **Region:** `eu-central-1` (passend zu den bestehenden Projekten)
- **Org:** die mit freiem Slot

Per MCP (sobald der richtige Account verbunden ist): `create_project`.
Per CLI: `supabase projects create cogni --region eu-central-1 --org-id <ORG>`.

Nach Anlage die neue **Project-Ref** notieren (`<NEW_REF>`), z.B. `abcde…`.

---

## 2. Schema — 19 Migrationen in dieser Reihenfolge

Buckets `intake-files` und `assets` werden **innerhalb** der Migrationen angelegt
(`20260415172437…`, `20260420141029…`) — kein separater Bucket-Schritt nötig.

```
20260415172437_b897abcc-…   ← legt u.a. Bucket intake-files an
20260416215301_01c6ffec-…
20260420141029_a0890ba6-…   ← legt u.a. Bucket assets an
20260420153601_3c901f7a-…
20260420154914_964ea295-…
20260420155731_9035cfdf-…
20260420213405_97dc5d99-…
20260513182534_18431ff1-…
20260513202238_ff6697ee-…
20260514015137_6f20aa0e-…
20260514023417_398d48ad-…
20260514073806_b5b2da31-…
20260514104938_389baea1-…
20260516134542_fb5d4a59-…
20260518185014_c1b8f22d-…
20260521090000_topic_merge.sql
20260522120000_delta_type_unclear.sql
20260522121000_graphiti_retry_loop.sql   ← CREATE EXTENSION pg_cron, pg_net
20260522121500_graphiti_retry_cron.sql   ← cron.schedule (siehe §3!)
```

**CLI (empfohlen):** `supabase link --project-ref <NEW_REF>` dann `supabase db push`.
**MCP:** jede Datei einzeln in Reihenfolge via `apply_migration` (Name = Dateiname).

---

## 3. ⚠ Manuelle Post-Migration-Schritte (NICHT in Migration committable)

Die Cron-Migration (`…retry_cron.sql`) referenziert ein Vault-Secret und ein
DB-Setting, die **pro Projekt** gesetzt werden müssen. Im **Supabase-Studio →
SQL-Editor** des neuen Projekts ausführen:

```sql
-- 1) Service-Role-Key in den Vault (Settings → API → service_role key kopieren):
SELECT vault.create_secret('<NEW_SERVICE_ROLE_KEY>', 'service_role_key',
  'graphiti retry cron — Service-Role für interne EF-Calls');

-- 2) Supabase-URL als App-Setting (falls nicht automatisch gesetzt):
ALTER DATABASE postgres
  SET app.settings.supabase_url = 'https://<NEW_REF>.supabase.co';
```

Ohne diese zwei Schritte feuert der Reconcile-Cron-Job ins Leere.

---

## 4. Edge Functions — 18 Stück deployen

Fast alle Functions importieren aus `supabase/functions/_shared/`. Die
**Supabase CLI** bündelt `_shared` + liest `config.toml` automatisch — daher
CLI gegenüber manuellem MCP-Deploy bevorzugen:

```bash
supabase functions deploy --project-ref <NEW_REF>
```

**`verify_jwt = false`** gilt laut `supabase/config.toml` für genau drei
Functions (eigene Auth: Bearer-Token/Webhook) — die CLI übernimmt das aus der
config.toml:

- `aol-callback` (Bearer `AOL_CALLBACK_TOKEN`)
- `railway-admin` (eigene Admin-Auth)
- `smoke-welle-b` (Test-Endpoint)

Alle übrigen 15 Functions: `verify_jwt = true` (Default).

---

## 5. Secrets — 15 setzen, 3 liefert Supabase automatisch

```bash
supabase secrets set --project-ref <NEW_REF> \
  ANTHROPIC_API_KEY=… \
  OPENAI_API_KEY=… \
  UNSTRUCTURED_API_KEY=… \
  GRAPHITI_SERVICE_URL=… \
  GRAPHITI_SERVICE_TOKEN=… \
  AOL_SERVICE_URL=… \
  AOL_SERVICE_TOKEN=… \
  AOL_CALLBACK_TOKEN=… \
  RAILWAY_API_TOKEN=… \
  LANGSMITH_API_KEY=… \
  LANGSMITH_BASE_URL=… \
  LANGSMITH_ENDPOINT=… \
  LANGSMITH_PROMPT_OWNER=… \
  LANGSMITH_WORKSPACE_ID=… \
  LANGCHAIN_PROJECT=…
```

| Secret                                                             | Quelle                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | **automatisch** von Supabase in jede Edge Function injiziert — NICHT manuell setzen |
| `ANTHROPIC_API_KEY`                                                | console.anthropic.com (neu, ersetzt LOVABLE_API_KEY für Extraktion/Zuordnung)       |
| `OPENAI_API_KEY`                                                   | platform.openai.com (neu, für voice-transcribe / Whisper)                           |
| `UNSTRUCTURED_API_KEY`                                             | Unstructured (Dokument-Parsing)                                                     |
| `GRAPHITI_SERVICE_URL` / `GRAPHITI_SERVICE_TOKEN`                  | euer deployter graphiti-server                                                      |
| `AOL_SERVICE_URL` / `AOL_SERVICE_TOKEN`                            | Railway-AOL-Service                                                                 |
| `AOL_CALLBACK_TOKEN`                                               | Shared Secret, identisch im Railway-Service                                         |
| `RAILWAY_API_TOKEN`                                                | Railway (railway-admin Function)                                                    |
| `LANGSMITH_*` / `LANGCHAIN_PROJECT`                                | LangSmith (Prompts/Traces)                                                          |

> `LOVABLE_API_KEY` wird **nicht** mehr gebraucht (durch Anthropic/OpenAI ersetzt).

---

## 6. Frontend-Env umstellen

`.env` (lokal) und die Deploy-Env (Vercel) auf das neue Projekt zeigen:

```
VITE_SUPABASE_PROJECT_ID=<NEW_REF>
VITE_SUPABASE_URL=https://<NEW_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<NEW_ANON_KEY>
```

(Settings → API im neuen Projekt: Project URL + anon/public key.)
In **Vercel** dieselben drei Variablen im Projekt-Env aktualisieren und neu deployen.

---

## 7. Typen neu generieren

```bash
supabase gen types typescript --project-ref <NEW_REF> > src/integrations/supabase/types.ts
```

(Schema identisch → Diff sollte minimal/leer sein. `types.ts` ist prettier-ignored.)

---

## 8. Repo-Referenzen auf alte Ref aktualisieren

- `supabase/config.toml`: `project_id = "<NEW_REF>"` (aktuell `zeazrfidtpdtgcrbnhbo`).
- `aol-service/README.md`: Beispiel-Callback-URL `https://<NEW_REF>.functions.supabase.co/aol-callback`.

---

## 9. Auth & externe Dienste

- **Auth:** frischer Start → keine User-Migration. Auth-Provider/Redirect-URLs im
  neuen Projekt (Settings → Authentication) neu konfigurieren (Site-URL = Prod-Domain).
- **Railway-AOL-Service:** `AOL_CALLBACK_URL` dort auf die neue Function-URL zeigen
  (`https://<NEW_REF>.functions.supabase.co/aol-callback`) und `AOL_CALLBACK_TOKEN`
  abgleichen.

---

## 10. Smoke-Test

1. `bun run dev` → Login/Signup gegen neues Projekt.
2. Einen Intake (Text) auslösen → `pipeline_events`-Row erscheint.
3. `intake-understand` → `proposed_facts` mit `modality` + `provenance`.
4. Edge-Function-Logs im Studio prüfen (keine 500 wegen fehlender Secrets).

---

## Wer macht was

| Schritt                       | Ich (via MCP, sobald Account verbunden) | Du (Dashboard/CLI)      |
| ----------------------------- | --------------------------------------- | ----------------------- |
| Projekt anlegen (§1)          | ✅                                      | —                       |
| Migrationen (§2)              | ✅                                      | —                       |
| Cron-Vault + URL-Setting (§3) | — (braucht Service-Role-Key)            | ✅                      |
| Functions deployen (§4)       | CLI bevorzugt                           | ✅ (`functions deploy`) |
| Secrets (§5)                  | — (Werte hast nur du)                   | ✅                      |
| `.env` / Vercel-Env (§6)      | ✅ (.env-Diff) / —                      | ✅ (Vercel)             |
| Typen (§7)                    | ✅                                      | —                       |
| Repo-Refs (§8)                | ✅                                      | —                       |
| Auth/Railway (§9)             | —                                       | ✅                      |
