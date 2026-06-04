# Cogni — Pflichtkontext für jede Session

Vollständige Orientierung: **[`AGENTS.md`](./AGENTS.md)**

---

## Nicht-verhandelbare Regeln

- **Branch-Flow:** Direkt-Push auf `dev` erlaubt. `main` ausschließlich via PR von `dev`.
- **Edge Functions** in `withErrorBoundary` wrappen, `createLogger` statt `console.log`. CI blockt `console.log`.
- **Kein Direkt-Supabase** aus Komponenten — ausschließlich über `src/lib/<domain>/`-Hooks.
- **Review vor Commit** — kein `canonical_facts`-Insert ohne `review_case.decision = accepted`.
- **RLS** auf jeder neuen Tabelle. Strukturelle Entscheidung → `docs/DECISIONS.md`.
- **Vor Arbeit an** Edge Functions · Commit-Pfad · Entity-Core · Intake: `docs/qa-seam-inventar.md §1` lesen.
