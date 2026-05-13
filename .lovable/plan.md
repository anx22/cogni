## Korrektur

Du hast recht: In der Lovable-Cloud-UI gibt es für dich keinen verlässlichen sichtbaren Zugang, um den `SUPABASE_SERVICE_ROLE_KEY` zu kopieren. Meine vorherigen Schritte waren falsch.

## Neuer Plan ohne Service-Role-Key in Railway

Statt Railway direkten Datenbankzugriff zu geben, bleibt der private Datenbank-Key komplett in Lovable Cloud. Railway ruft nur noch eine geschützte Backend-Funktion in Lovable Cloud zurück.

```text
App / Edge Function
  -> AOL-Service auf Railway
      -> Graphiti / LangGraph arbeitet
      -> ruft Lovable-Cloud Callback auf
          -> Lovable Cloud schreibt proposed_facts / review_cases / aol_runs
```

## Was du dann auf Railway brauchst

Nur noch diese Variablen:

- `AOL_SERVICE_TOKEN`
- `GRAPHITI_SERVICE_URL`
- `GRAPHITI_SERVICE_TOKEN`
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`
- `OPENAI_API_KEY`
- `LANGSMITH_API_KEY`
- `LOVABLE_API_KEY`
- neu: `AOL_CALLBACK_URL`
- neu: `AOL_CALLBACK_TOKEN`

Nicht mehr nötig:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional erstmal auch `DATABASE_URL`

## Umsetzung

1. Neue Lovable-Cloud Backend-Funktion `aol-callback` anlegen.
   - Sie nimmt Ergebnisse vom Railway-AOL-Service entgegen.
   - Sie prüft `Authorization: Bearer AOL_CALLBACK_TOKEN`.
   - Sie schreibt mit intern verfügbarem Datenbankzugriff in `aol_runs`, später `proposed_facts`, `dialog_sessions`, `review_cases`.

2. `AOL_CALLBACK_TOKEN` als Lovable-Cloud Secret anlegen.
   - Gleicher Wert kommt als Railway Variable rein.
   - Das ist nur ein gemeinsames Secret zwischen Railway und Lovable Cloud, kein Datenbank-Key.

3. AOL-Service auf Railway umbauen.
   - Entfernt Pflicht auf `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
   - Nach `/aol/run` ruft der Service `AOL_CALLBACK_URL` auf.
   - Payload enthält `run_id`, `asset_id`, `status`, `last_node`, `facts_written`, später extrahierte Facts/Cases.

4. `aol-service/README.md` korrigieren.
   - Keine falsche Anleitung mehr mit Service-Role-Key.
   - Railway-Setup wird auf die echte Lovable-Cloud-Variante reduziert.

5. Danach testen.
   - Health von Railway prüfen.
   - `intake-trigger` aus Lovable Cloud aufrufen.
   - Verifizieren, dass `aol_runs` von `pending/running` auf `completed` oder `failed` aktualisiert wird.

## Ergebnis

Du musst keinen versteckten Backend-Key suchen. Railway bekommt nur normale API-/Service-Secrets und spricht für Datenbank-Schreibvorgänge zurück zu Lovable Cloud.