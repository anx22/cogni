# AGENTS — Karte für Produktintelligenz

> Karte, kein Handbuch. Erst hier lesen, dann gezielt weiter.

## Was ist das?

PM-App: rohe Inputs → Verstehen → Review → kanonischer Projektzustand + Knowledge Graph.
Drei Außenmodi: Entität, Projekt, Dialog-Overlay. Keine Sidebar, keine Dashboard-Ästhetik.

## Routing

- **Was tut das Produkt?** → `docs/PRODUCT.md`
- **Wie ist es gebaut?** → `docs/ARCHITECTURE.md`
- **Was läuft jetzt?** → `docs/NOW.md`
- **Warum so entschieden?** → `docs/DECISIONS.md`
- **Seam-Inventar (lebende QA-Karte)** → `docs/qa-seam-inventar.md`
- **Entity-Kernmodul (Spec + Refactor-Roadmap)** → `docs/entity-core.md`

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

Siehe `docs/NOW.md`. Basis + Welle B + UI-Redesign durch. Aktiv: Prototyp-Finalisierung in drei Milestones (Provenance, Entity-Präsenz, Antwort-Loops). Visuelle Quelle: `docs/redesign/prototype/` + `docs/redesign/screenshots/`.

## Regeln (immer)

- Edge Functions in `withErrorBoundary` wrappen, `createLogger` statt `console.log`.
- Roles in separater Tabelle, RLS überall, `has_role()` als SECURITY DEFINER.
- Vor jeder Antwort zu Infra/Status echte Daten ziehen (railway-admin, inspect-\*, supabase--read_query).
- Strukturelle Entscheidung → Eintrag in `docs/DECISIONS.md`. Sprintwechsel → `docs/NOW.md` updaten.
