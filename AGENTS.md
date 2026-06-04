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
