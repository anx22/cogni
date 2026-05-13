# Finalisierung Entity-Charaktere

Letzter Pass über `Entity`, `FacePillCharacter`, `SiriCharacter` und das OrbLab. Schwerpunkt: Schließverhalten der Face-Pill, größere Buttons im 2×2-Raster, Aufräumen toter Enden und Inkonsistenzen.

## 1. Face-Pill — Schließ-Routinen (Hauptproblem)

Aktuell öffnet Klick die Pill, danach gibt es keinen Weg zurück: das Hit-Layer setzt im offenen Zustand `pointer-events: none`, es gibt keine Esc-, Outside-Click- oder Auto-Close-Logik.

Neu, in `FacePillCharacter.tsx`:
- **Outside-Click**: globaler `pointerdown`-Listener nur wenn `open=true`; schließt, sobald das Target nicht im Card-Container liegt.
- **Esc**: globaler `keydown`-Listener, schließt + entfernt Tilt.
- **Auto-Close**: Timer (~5 s) ab Öffnen; jede Hover-/Pointermove-Aktivität setzt den Timer zurück. Wahl eines Modus schließt sofort (bestehend).
- **Tilt-Reset beim Öffnen**: bisher bleibt der letzte Tilt-Winkel beim Öffnen stehen. `resetTilt()` zusätzlich beim Übergang `closed → open` aufrufen.
- **Hit-Layer korrigieren**: das doppelt so große Hit-Layer (`size*2`, Offset `-size/2`) liegt auch über den Side-Grids und fängt dort Klicks ab. Lösung: Hit-Layer vom Tilt entkoppeln und nur Pointer-Move/-Enter/-Leave tracken; `onClick` auf die Card legen, damit Geschwister-UI klickbar bleibt. Im offenen Zustand bleibt das Hit-Layer aktiv für Move-Tracking, fängt aber keine Klicks (klickbarer Bereich = Card + Outside-Listener).

## 2. Open-State als 2×2-Raster, größere Buttons

In `FacePillCharacter`:
- Container: `grid grid-cols-2 grid-rows-2 gap-2 p-3` statt `flex flex-wrap`.
- Buttons: deutlich größere Touch-Fläche (`h-full w-full min-h-[56px]`, vertikal Icon + Label gestapelt, Icon `size-5`, Label `text-xs`), gleicher Glas-Look (`bg-background/40 backdrop-blur-md border border-white/15 hover:border-primary/60 hover:bg-primary/20`).
- Pill-Größe im offenen Zustand passend angleichen (`openW`/`openH` leicht hoch, damit das Raster atmet, z. B. 280 × 200 statt 260 × 160 bei k=1).

## 3. Code-Cleanup, tote Enden, Inkonsistenzen

- **Doppelte Mode-Liste**: `MODES` in `FacePillCharacter` dupliziert die Liste aus `InputPills`. Eine geteilte Konstante (`INPUT_MODES`) in `InputPills.tsx` exportieren und in beiden Komponenten nutzen.
- **`onClick` in `CharacterRenderProps`**: wird von keinem Charakter verwendet — entfernen (auch in `Entity.tsx` aus dem Render-Aufruf), sonst Render-Vertrag aufräumen.
- **`STATE_TUNE`-Typing**: `glowBurst` ist im Const-Object nicht deklariert und wird per Cast nachgereicht. Sauber typisieren (`Record<EntityState, Tune>` mit optionalem `glowBurst`), Cast entfernen.
- **`EntityState` in `Index.tsx`**: lokal redeklariert ohne `busy-blocked` — durch den Type aus `orbPresets` ersetzen, damit überall ein Typ gilt.
- **`SiriCharacter`**: bewusst kein `onPickInputMode` (Siri hat keinen Picker). Dokumentationszeile + ungenutzte Props ignorieren — sauber lassen.
- **OrbLab `StaticStatePreview`**: Tile-Klick funktioniert, aber Face-Pill rendert intern auch dort sein Hit-Layer. Da der Wrapper `pointer-events-none` setzt, ist das harmlos — verifizieren und ggf. eine `interactive={false}`-Prop am Charakter-Render einführen, falls Animationen weiter laufen sollen, aber keine Listener nötig sind. Einfacher: `pointer-events-none` reicht; nichts ändern.

## 4. Verifikation

- Face-Pill: öffnen → 2×2-Buttons, Auswahl schließt, Klick außerhalb schließt, Esc schließt, nach 5 s ohne Aktivität schließt automatisch.
- Side-Grids (`Projekte`, Intake-Sessions) bleiben klickbar, auch wenn die Pill in der Mitte liegt.
- Siri-Charakter bleibt visuell unverändert.
- OrbLab: Charakterwechsel persistent, State-Tiles statisch, kein Regress.

## Dateien

- Edit: `src/components/entity/characters/FacePillCharacter.tsx` (Schließlogik, 2×2-Raster, Hit-Layer-Trennung, Tilt-Reset, Typing).
- Edit: `src/components/entity/characters/SiriCharacter.tsx` (nur falls Render-API-Cleanup).
- Edit: `src/components/entity/characters/types.ts` (`onClick` aus `CharacterRenderProps` entfernen).
- Edit: `src/components/entity/Entity.tsx` (kein `onClick` mehr an `Char.render`).
- Edit: `src/components/entity/InputPills.tsx` (`INPUT_MODES` exportieren).
- Edit: `src/pages/Index.tsx` (`EntityState` aus `orbPresets` importieren).
