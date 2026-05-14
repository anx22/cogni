## Ja, ich kann Facts selbstständig submitten

**Wege, die ohne neuen Code funktionieren:**

1. `supabase--insert` → direkter Write in `projects`, `proposed_facts`, `canonical_facts`, `change_events`, `sources`, `parsed_documents` (Service-Role, RLS-bypass).
2. `supabase--curl_edge_functions` → ruft `commit-fact` mit deinem JWT auf → echter Pfad inkl. Graphiti-Spiegel + `change_events` + `corrections`.

Pfad 2 ist „echter", weil er die ganze Kette inkl. Knowledge-Graph durchläuft. Pfad 1 ist gut für Bulk-Seeds.

## Sandbox-Setup (3 fiktionale Dauerbaustellen)

Ich lege bei deinem User folgende Projekte an und pflege sie bei jedem Test weiter (neue Mails, Widersprüche, Deadlines, Zicken-Stakeholder):

1. **„Hase & Söhne Couture"** — Schwäbisches Fashion-Label, Sommerkollektion 2027.
  Kunde: Frau Hase (Senior, ändert wöchentlich Farbpalette). Ewige Themen: Stoffmuster-Freigabe, Lookbook-Shooting, Pariser Showroom.
2. **„Visualisierung Tübingen Tower"** — Archviz für einen nie genehmigten Wolkenkratzer in Tübingen.
  Kunde: Architekt Dr. Armbruster + Stadtplanungsamt. Ewige Themen: Sonnenstand-Studie, Fassaden-Materialwechsel, Bürgerinitiative.
3. **„Maschinenbau Spätzbohrer 4.0"** — Industrie-Mittelständler im Allgäu/Schwaben, Retrofit-Projekt für CNC-Linie.
  Kunde: Werkleiter Maggus, IT-Leiter, Betriebsrat. Ewige Themen: SPS-Update, Schichtmodell, ISO-Audit, neuer Lieferant aus Tschechien.

Jedes Projekt bekommt:

- 1 Org + 2–3 Persons
- 1 Source (fiktive E-Mail / Meeting-Notiz)
- 1 ParsedDocument-Eintrag
- 2–4 ProposedFacts mit unterschiedlichen `delta_type` (new, conflict_replace, refine)
- 1 ReviewSession mit Boxes
- Beim Commit: echte canonical_facts + change_events + Graphiti-Spiegel via `commit-fact`

## Was ich jetzt von dir brauche

Genau **eine Info**: deine `user_id` (UUID aus `auth.users`).
Sag entweder „nimm den letzten User aus auth.users" — dann lese ich sie selbst per `read_query` — oder paste sie direkt.  
  
UserID: 6a49ae0a-d8a9-4c42-9cdf-b2cab61e7b7b

## Was passiert dann (in der Build-Phase, nicht jetzt)

1. `read_query` → user_id verifizieren.
2. `supabase--insert` → 3 Projekte + Stakeholder + Sources + ParsedDocs + initiale ProposedFacts + ReviewCases.
3. `supabase--curl_edge_functions` → `commit-fact` für 1–2 Boxes pro Projekt (echter Pfad inkl. Graphiti).
4. `read_query` → bestätigen: canonical_facts, change_events, graphiti_sync_log = success.
5. Eintrag in `docs/NOW.md` + `docs/DECISIONS.md`: „Sandbox-Projekte als laufende QA-Begleitung".
6. Ab da: bei jedem neuen Feature/Fact-Typ würfle ich neue E-Mails/Konflikte in eines der drei Projekte und teste den Pfad live.

Kein neuer Code, keine neue Tabelle, keine Migration. Reine Daten + Tool-Aufrufe.