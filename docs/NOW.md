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

- **2026-06-04 — Entity-Politur (Home-Center + OrbLab-Overhaul + FacePill-Morph)** auf `dev`. **Home:** Entität wieder **zentral** (`EntityRoot`, viewport-relativ via Größen-Tier), `EntityRail` nur noch auf ProjectScreen, `ImpactPipelinePanel` als rechtes Aside zurück (Backlog-Posten erledigt). **Siri** folgt der Maus nicht mehr (`DEFAULT_MOTION=[]`, opt-in). **OrbLab** = Config-Mode (`interaction` full/self/static): kein Entity-Click, FacePill-Hot-Area auf die Komponente begrenzt, statische Tiles (behebt button-in-button). **Editor:** HSL-Labels, Farb-Harmonie-Generator (`generatePalette`), benannte Presets (`useOrbLibrary`), Größe Klein/Mittel/Groß (viewport-relativ, `useOrbSizeTier`+ResizeObserver), Würfeln raus, „Punkt-Halo" verständlich. **FacePill-Morph** an Orby-Fremdcode angeglichen (260×160, Glas, rotierendes Bälle-Kreuz, Augen→Inhalt-Crossfade) — Panel-Inhalt (2×2) wandert in Phase 5. **Entity-Core Phase 1–4** auf dev. 169/169 ✓, tsc 0.
- **2026-06-04 — OR-1 fix (escalate-Flag)** `commitRoute.ts` + `DialogProvider.tsx` + 5 Tests. 162/162 ✓, tsc 0.
- **2026-06-03 — M3 abgeschlossen** Feedback-Layer flächendeckend (Lage+Verlauf+Substanz). 150/150 ✓, tsc 0.

---

## Pflege (Anti-Bloat)

> NOW beschreibt nur die **Gegenwart** — Status/aktive Arbeit dürfen in heißen Phasen ausführlicher werden.
> Der Deckel gilt nur für **Recently completed**:
>
> - **Recently completed**: nur die letzten ~3, je 1 Zeile. Ältere fallen raus — Historie lebt in Git (`git log --oneline -- docs/`), **nicht** in DECISIONS.
> - Wird ein Status zur Grundsatzentscheidung → `DECISIONS.md` (warum). Zukünftiges → `PLAN.md`.
