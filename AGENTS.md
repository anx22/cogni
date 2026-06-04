# AGENTS — Karte für Produktintelligenz

> Karte, kein Handbuch. Erst hier lesen, dann gezielt weiter.

## Was ist das?

PM-App: rohe Inputs → Verstehen → Review → kanonischer Projektzustand + Knowledge Graph.
Drei Außenmodi: Entität, Projekt, Dialog-Overlay. Persistente `AppSidebar` (Projektliste) zur Orientierung, keine Dashboard-Ästhetik.

## Routing

- **Was tut das Produkt?** → `docs/PRODUCT.md`
- **Wie ist es gebaut?** → `docs/ARCHITECTURE.md`
- **Was läuft jetzt?** → `docs/NOW.md`
- **Warum so entschieden?** → `docs/DECISIONS.md`
- **Seam-Inventar (lebende QA-Karte)** → `docs/qa-seam-inventar.md`
- **Entity-Kernmodul (Spec + Refactor-Roadmap)** → `docs/entity-core.md`
- **M4-Detailspec (S0–S9)** → `docs/m4-spec.md`

## Service-Schicht

Lovable Cloud (Supabase) = kanonisch · Graphiti/Neo4j = Spiegel · Unstructured = Parsing ·
AOL-Service auf Railway = LangGraph-Kontext · LangSmith = Prompts/Traces · Lovable AI Gateway = Modelle.

## Aktueller Sprint

Siehe `docs/NOW.md`. M1–M3 + Entity-Core durch. Aktiv: M4 (Bedeutungs-Integrität) + Wave 3 (Lebendiges System). Visuelle Quelle: `docs/redesign/prototype/` + `docs/redesign/screenshots/`.

## Regeln (immer)

- Edge Functions in `withErrorBoundary` wrappen, `createLogger` statt `console.log`.
- Roles in separater Tabelle, RLS überall, `has_role()` als SECURITY DEFINER.
- Vor jeder Antwort zu Infra/Status echte Daten ziehen (railway-admin, inspect-\*, supabase--read_query).
- Strukturelle Entscheidung → Eintrag in `docs/DECISIONS.md`. Sprintwechsel → `docs/NOW.md` updaten.
- **Edge Functions · Commit-Pfad · Entity-Core · Intake anfassen?** → erst `docs/qa-seam-inventar.md §1 Offene Risiken` lesen.
- **Branch-Flow:** Direkt-Push auf `dev` erlaubt. `main` nur über PR von `dev`.
