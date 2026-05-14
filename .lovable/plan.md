## Stand-Review

| Phase | Status |
|---|---|
| 1 Tokens/Geist | ✅ |
| 2 LageZone Hero | ✅ |
| 3 AppSidebar + ProjectScreen | ✅ |
| 4 Home 3-Spalten + ImpactPipelinePanel | ✅ Vitest 60/60 |
| 5 Dialog V2 (BatchReview/FaktDrill) | ⚠ hinter Flag `?dialogV2=1`, alte Boxen noch Default |
| 6 AssetOrbit | ⏳ |

Sidequest aus letzter Runde (Entity-Touch + Home-Scroll-Lock auf Mobile Safari) ist live, kein offener Punkt dort.

**Gate vor Cleanup (laut design-implementation-plan.md, Stopp-Bedingung 4):** alte Boxen dürfen erst nach Phase-5-Verify gelöscht werden — Live-Smoke in „Hase & Söhne Couture" mit `?dialogV2=1` fehlt formell noch.

---

## Phase 5.4 — Live-Smoke V2 (Voraussetzung für Cleanup)

Im Sandbox-Projekt „Hase & Söhne Couture" mit `?dialogV2=1`:

1. Datei droppen → BatchReviewOverlay öffnet, Type-Chips korrekt, Theme erbt Tag/Nacht
2. Konflikt-Row: Inline-Chips + Details-Toggle, Quellen-Cards expandieren
3. Gap-Row: Suggestion-Chips aus `box.suggestions[]`
4. CommitButton glüht blau, „M übernehmen ↵" committed + schließt
5. Single-Box-Session → FaktDrillOverlay (38px Datum bei Konflikt, Tile-Auswahl aktiviert „Entscheidung speichern")
6. ESC schließt zuverlässig
7. Token-Sanity: `--d-blue` = `--accent`, kein `forced dark`

Wenn rot: V2-Komponenten patchen, Cleanup verschieben, Default bleibt alte Boxen.

---

## Phase 5.5 — V2 als Default + Cleanup (nur wenn 5.4 grün)

**Schritt A — Flag entfernen, V2 = Default**
- `src/components/dialog/DialogOverlay.tsx`: `useDialogV2Flag` + Branch löschen, V2-Pfad direkt rendern, alten Header/Body-JSX entfernen.

**Schritt B — Tote Boxen löschen**
```
src/components/dialog/BoxRenderer.tsx
src/components/dialog/BoxFrame.tsx
src/components/dialog/BoxStateBadge.tsx
src/components/dialog/boxes/AktionsBox.tsx
src/components/dialog/boxes/AuswahlBox.tsx
src/components/dialog/boxes/EingabeBox.tsx
src/components/dialog/boxes/GapBox.tsx
src/components/dialog/boxes/KonfliktBox.tsx
src/components/dialog/boxes/KontextBox.tsx
src/components/dialog/boxes/WissensBox.tsx
src/components/dialog/boxes/ZuordnungsBox.tsx
```
Nur löschen, was in V2-Pfad nicht referenziert wird (ripgrep-Check vorab). `useDialog`, `DialogProvider`, `sessionFactories`, `dialogContext` bleiben unberührt — Infrastruktur-Vertrag.

**Schritt C — Verify**
- `bun run lint`, `tsc --noEmit`, `bunx vitest run`
- Browser-Smoke: BatchReview + FaktDrill ohne Flag erreichbar
- `docs/NOW.md`: Phase 5 ✅, `docs/DECISIONS.md`: Eintrag „2026-05-14 — Dialog V2 default, Box-Renderer entfernt"

---

## Phase 6 — AssetOrbit (im Anschluss)

**Datei:** `src/components/entity/AssetOrbit.tsx` (neu), Einbindung in `src/pages/Index.tsx` zwischen `<Entity>` und `<HomePrompt>`.

**Daten:** read-only Hook auf `assets` mit `committed_at IS NULL` und `status IN ('parsing','understanding','review-ready','failed')` — über `useRealtimeTables` an bestehenden `assets`-Listener andocken, kein neuer Realtime-Channel, kein `src/lib/`-Eingriff.

**Geometrie:** oberer Bogen 225°, Radien 250/290px, `ageRing`-basiertes Opacity-Falloff (Spec exakt aus design-implementation-plan.md §1353-1364).

**Chip-Visuals:** `parsing` dashed, `understanding` Spinner-Ring, `review-ready` `--sig-review` Border + klickbar (öffnet BatchReview für dieses Asset via `openSessionFromDB`), `failed` `--sig-conflict` Border. Label `[TYPE] Name · vor X min ●`.

**Mobile:** unter `md` ausgeblendet (würde mit HomePrompt + Touch-Entity kollidieren).

**Verify:** Asset hochladen → Chip erscheint im Bogen, Status-Übergänge sichtbar, Klick auf review-ready öffnet V2-BatchReview, kein Layout-Bruch im 3-Spalten-Home.

---

## Stopp-Bedingungen (unverändert)
- Keine Edits in `src/lib/**` außer Format-Dateien
- `ProjectViewModel`-Vertrag unberührt
- Schema/Edge Functions tabu
- Wenn 5.4 rot: kein Cleanup, kein Default-Switch — nur V2-Patches

## Frage vor Start
Hast du V2 selbst schon im Sandbox-Projekt mit `?dialogV2=1` durchgespielt und freigegeben — oder soll ich Schritt 5.4 als Browser-Smoke selbst fahren bevor Cleanup + Phase 6 starten?
