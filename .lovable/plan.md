# Side-Quest: Entität mobile-ready + Finger-Follow

## Ziel
Auf Touch-Geräten:
- Kein Text-Select / Callout / Tap-Highlight beim Berühren der Entität.
- Beim Bewegen des Fingers (vor Release) folgt die Entität spielerisch & smooth dem Finger.
- Klick/Tap löst weiterhin sauber aus (Index `handleCoreClick`, OrbLab etc. unangetastet).
- Funktioniert in allen modernen Browsern (Safari iOS, Chrome Android, Desktop).

Kein Overengineering: ein Hook, ein paar CSS-Properties, fertig. Keine neuen Libraries.

## Scope
Nur `src/components/entity/Entity.tsx` (+ ein winziger interner Hook). 
Keine Änderung an Charakteren, Presets, Drag-and-Drop, OrbLab, Index-Logik.

## Vorgehen

### 1. Touch-Hygiene (CSS am Entity-Wrapper)
Auf dem äußeren `<div>` in `Entity.tsx`:
- `touch-action: manipulation` → unterdrückt Double-Tap-Zoom & Long-Press-Verzögerung, lässt aber Scrollen außerhalb funktionieren.
- `user-select: none`, `-webkit-user-select: none` → kein Textmarkieren bei langem Drücken.
- `-webkit-touch-callout: none` → kein iOS-Bildmenü.
- `-webkit-tap-highlight-color: transparent` → kein graues Tap-Overlay.
Umgesetzt als Tailwind/Inline-Style direkt am Wrapper, damit lokal begrenzt.

### 2. Finger-Follow via Pointer Events
Pointer Events vereinen Maus + Touch + Pen → eine API für alle Browser.
- Neuer interner Hook `usePointerFollow(ref, { maxOffset: 14, damping: 0.18 })`:
  - `onPointerMove` (nur wenn `pointerType === "touch"` ODER Hover-Mausbewegung über dem Element): berechne Offset relativ zum Elementmittelpunkt, normiere auf `maxOffset` px, und setze `transform: translate3d(x, y, 0)` direkt per `ref.current.style` (kein React-Re-Render).
  - rAF-throttle: in `pointermove` nur den Zielwert speichern, in einem `requestAnimationFrame`-Loop linear interpolieren (`current += (target - current) * damping`) → seidiges Nachlaufen.
  - `onPointerDown` (touch): aktiviert Follow + setzt `setPointerCapture`, damit der Finger auch außerhalb der Entität noch verfolgt wird.
  - `onPointerUp / onPointerCancel / onPointerLeave`: Target = 0 → smooth zurück in Ruhelage; danach rAF-Loop stoppt.
  - Klick: bleibt React-`onClick` (pointerup im Element löst nativ Click aus, solange wir nicht `preventDefault` aufrufen).
- Respektiere `prefers-reduced-motion` → Follow deaktiviert.

### 3. Wo der Transform sitzt
Wrapper-Div bekommt `transform`. Innenliegende Charakter-Render bleiben unberührt → keine Layout-Shifts, GPU-beschleunigt.

### 4. Klick-Verträglichkeit
- Kein `preventDefault` in `pointermove`/`pointerdown` → Click-Event feuert weiterhin (auch Drag-Handler bleiben intakt, da Drag eigene `dragstart`-Events nutzt, nicht Pointer).
- Schwelle: wenn der Finger > X px gewandert ist, könnten wir einen "Quick-Tap" unterscheiden — aber: explizit **nicht** nötig laut User-Wunsch ("keine Dutzend Zusatzfunktionen"). Wir lassen Browser-Default: Wenn der Finger nur leicht wackelt, ist es ein Tap; bei Drag bleibt's ein Drag. Reicht.

### 5. Verifikation
- `bun run lint`, `tsc --noEmit`, `vitest`.
- Browser-Smoke: Mobile Viewport (375×812) im Preview, Pointer-Drag prüfen (Follow + Snap-Back), Tap → öffnet Overlay.
- Desktop: Maus-Hover bleibt unverändert (Follow nur bei Pointer **innerhalb** des Wrappers, sehr dezent).

## Ergebnis
Eine Datei (`Entity.tsx`) + ein kleiner Hook im selben File. Keine neuen Dependencies, keine API-Änderung, keine Auswirkung auf Redesign-Phasen 4/5.
