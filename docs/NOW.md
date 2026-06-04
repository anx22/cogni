# NOW — MainCompass

> Sessions-übergreifender Kompass für die **Gegenwart**. Erst hier lesen, dann gezielt weiter.
> **Zukunft: `PLAN.md`** · Vergangenheit: Git (`git log --oneline -- docs/`) · Regeln: `ARCHITECTURE.md` · Vision: `PRODUCT.md` · Warum: `DECISIONS.md` · QA: `qa-seam-inventar.md`

---

## Status (Stand 2026-06-04)

Belastbare Basis steht. Vision-Kern ~90% implementiert, UI-Sprache am Prototyp ausgerichtet.

- **Pipeline 7/7** · **Detektoren 5/5** · **Dialog 18 BoxTypes** · **4 Rollen-Frontend**
- **Tests**: 162/162 Vitest · Deno-Suiten pro Detector · 19/19 EFs mit Boundary + Logger · RLS überall
- Aktiv: **Entity-Core Phase 1–7** · **M4 (Bedeutungs-Integrität)** · **Wave 3 (Lebendiges System)**

---

## Milestones

✅ **M1** — Empfehlung-First, Empfehlungs-Vertrag über alle Drilldowns (2026-06-01) → Details: `DECISIONS.md`
✅ **M2** — `EntityRail` persistent rechts (2026-06-03) → Details: `DECISIONS.md`
✅ **M3** — Antwort-Loops geschlossen, Feedback flächendeckend (2026-06-03) → Details: `DECISIONS.md`

**Entity-Core** — Phase A+0 ✅ · Phase 1–7 aktiv → Spec: `docs/entity-core.md`

**M4 — Bedeutungs-Integrität & Entity-Identität** → Detailspec: `docs/m4-spec.md`
Reihenfolge: **S0** (Beleg) → S1 → S2 → **S8** → S3 → S4 → S5 → S6 → S7/S9 (später)
Stand: S8/escalate-Fix ✅ 2026-06-04 · S0 aktiv

**Wave 3 — Lebendiges System** (nach M4, auf bestehenden Flächen, kein Dashboard)
LS-1 Confidence Decay · LS-3 Review-Badge · LS-2 Project Pulse — Reihenfolge: LS-1 → LS-3 → LS-2

---

## Aktive Loops

- **Graphiti-Sync-Retry** — Cron `*/30 min`, `inspect-graphiti diagnose` für Top-Reasons.
- **Test-Coverage halten** — neue Funktion = Pure-Test, Drift in DECISIONS.
- **Pre-existing Build-Fehler** — `useProjectData` Migrations-Drift · `submitNote` DevLogCategory · `VerlaufFeed`. Backend-Entscheidung ausstehend, kein blinder Fix.

---

## Recently completed

_Nur die letzten ~3 (je 1 Zeile). Ältere raus → Git (`git log --oneline -- docs/`), nicht DECISIONS._

- **2026-06-04 — Entity-Politur** Home-Entität zentral (Rail nur ProjectScreen), Siri ohne Pointer-Follow, OrbLab Config-Mode + Editor-Overhaul (HSL, Generator, Presets, Größen-Tier), FacePill-Morph an Orby; Entity-Core Phase 1–4 auf `dev`. 169/169 ✓, tsc 0. Detail: `entity-core.md`.
- **2026-06-04 — OR-1 fix (escalate-Flag)** `commitRoute.ts` + `DialogProvider.tsx` + 5 Tests. 162/162 ✓, tsc 0.
- **2026-06-03 — M3 abgeschlossen** Feedback-Layer flächendeckend (Lage+Verlauf+Substanz). 150/150 ✓, tsc 0.
