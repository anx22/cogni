# AGENTS — Karte für Produktintelligenz

> Karte, kein Handbuch. Erst hier lesen, dann gezielt weiter.

## Was ist das?
PM-App: rohe Inputs → Verstehen → Review → kanonischer Projektzustand + Knowledge Graph.
Drei Außenmodi: Entität, Projekt, Dialog-Overlay. Keine Sidebar, keine Dashboard-Ästhetik.

## Routing
- **Was tut das Produkt?** → `PRODUCT.md`
- **Wie ist es gebaut?** → `ARCHITECTURE.md`
- **Was läuft jetzt?** → `NOW.md`
- **Warum so entschieden?** → `DECISIONS.md`
- **QA-Geschichte / Audit** → `docs/qa-historie.md`
- **Seam-Inventar** → `docs/qa-seam-inventar.md`

## Memory (`mem://`)
Detailwissen liegt in Project-Memory. Index ist immer im Kontext. Wichtigste Files:
- `mem://strategy/observability-und-anbindung` — volle API-Nutzung aller Services
- `mem://features/techstack` — Datenfluss-Architektur
- `mem://features/graphiti-semantik` — Spiegel-Vertrag
- `mem://features/railway-zugriff`, `mem://features/langsmith-zugriff`

## Service-Schicht (Stand 2026-05-14)
Lovable Cloud (Supabase) = kanonisch · Graphiti/Neo4j = Spiegel · Unstructured = Parsing ·
AOL-Service auf Railway = LangGraph-Kontext · LangSmith = Prompts/Traces · Lovable AI Gateway = Modelle.

## Aktueller Sprint
Siehe `NOW.md`. QA-Härtung Stages 1–7 abgeschlossen. Backlog: optionale Browser-E2E, Inspector-Logger.

## Regeln (immer)
- Edge Functions in `withErrorBoundary` wrappen, `createLogger` statt `console.log`.
- Roles in separater Tabelle, RLS überall, `has_role()` als SECURITY DEFINER.
- Vor jeder Antwort zu Infra/Status echte Daten ziehen (railway-admin, inspect-*, supabase--read_query).
- Strukturelle Entscheidung → Eintrag in `DECISIONS.md`. Sprintwechsel → `NOW.md` updaten.
