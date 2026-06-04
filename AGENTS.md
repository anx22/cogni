# AGENTS — Karte für Produktintelligenz

> Karte, kein Handbuch. Erst hier lesen, dann gezielt weiter.

## Was ist das?

PM-App: rohe Inputs → Verstehen → Review → kanonischer Projektzustand + Knowledge Graph.
Drei Außenmodi: Entität, Projekt, Dialog-Overlay. Persistente `AppSidebar` (Projektliste) zur Orientierung, keine Dashboard-Ästhetik.

## Routing

**Wissen (steht):**

- **Was tut das Produkt?** → `docs/PRODUCT.md`
- **Wie ist es gebaut?** (Ist-Zustand) → `docs/ARCHITECTURE.md`
- **Warum so entschieden?** (thematisch) → `docs/DECISIONS.md`

**Zeit (bewegt sich):**

- **Was läuft jetzt?** → `docs/NOW.md`
- **Was kommt?** (Roadmap + Backlog) → `docs/PLAN.md`
- **Was wann geliefert?** → Git: `git log --oneline -- docs/` · alter Stand: `git show <commit>:<datei>`

**Spezial-Specs:**

- **Lebende QA-Karte** → `docs/qa-seam-inventar.md`
- **Entity-Kernmodul** → `docs/entity-core.md`
- **M4-Detailspec (S0–S9)** → `docs/m4-spec.md`

> Vollständige chronologische Doku-Historie zusätzlich verbatim unter `docs/concept/veraltet/`.

## Service-Schicht

Lovable Cloud (Supabase) = kanonisch · Graphiti/Neo4j = Spiegel · Unstructured = Parsing ·
AOL-Service auf Railway = LangGraph-Kontext · LangSmith = Prompts/Traces · Lovable AI Gateway = Modelle.

## Schlüsseldateien

- **Pipeline-Steuerung** `supabase/functions/_shared/agentConfig.ts` — Modell, Prompts, Tools, Schwellen, `mapToBoxType()`
- **Provider-Adapter** `_shared/agentClient.ts` — `callExtractFacts()` + `callSuggestAssignment()`. Bei Modell-Wechsel: nur diese Datei.
- **Box-Mapping** `src/lib/dialog/boxMapping.ts` — DB-`box_type` → UI-String
- **Session laden** `src/lib/dialog/loadSession.ts` — DB-`box_state` → UI-Deutsch; Zuordnungsbox-Payload
- **Asset-Status** `assets.understanding_status` (`pending/running/empty/review_ready/failed/rate_limited/payment_required`) ist UI-Wahrheit
