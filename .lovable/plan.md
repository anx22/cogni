# Face Pill — Polish & Persistenz

## 1. Charakter persistieren (App-weit)

Aktuell lebt `characterId` nur lokal in `OrbLab`. Wir hängen ihn an die existierende `useNamespace("orb")`-Schiene (gleicher Mechanismus wie Presets, läuft schon mit Realtime).

- **Neuer Hook** `src/components/entity/useSelectedCharacter.ts`:
  ```ts
  const { values, setValue } = useNamespace<CharacterId>("orb");
  const id = (values.character as CharacterId) ?? "siri";
  return { characterId: id, setCharacterId: (c) => setValue("character", c), loaded };
  ```
- **OrbLab**: `useState` → `useSelectedCharacter()`. Schreibt sofort in DB beim Tab-Wechsel, `SavedIndicator` aktualisieren.
- **Index.tsx**: liest denselben Hook und übergibt `character={characterId}` an `<Entity>`. Damit ist die Auswahl global aktiv. `onPickInputMode` in Index ruft den bestehenden Overlay-Open auf — minimal: `(m) => setOverlayOpen(true)` (Mode-Routing lassen wir bewusst aus, kommt später).

## 2. State-Vorschauen passen zum Charakter

In der Matrix unten in OrbLab wird heute hart `<SiriOrb /> + <EntitySurface />` gerendert — egal welcher Charakter aktiv ist. Wir ersetzen das durch denselben Render-Pfad wie der Live-Orb:

- Jede Karte rendert `<Entity character={characterId} state={s} size="110px" presetOverride={sm} />` in einem `pointer-events-none`-Wrapper, damit der Klick weiterhin auf die `Card` geht (state-Wechsel). Kein zweiter Renderpfad, keine Sonderfälle.

## 3. Hot Area deutlich vergrößern (Pointer-Tracking)

Heute ist der Tilt-Bereich = sichtbare Card. User will ~2× Größe.

- In `FacePillCharacter` einen unsichtbaren **Hit-Layer** über der Card platzieren, der `2 × size` breit/hoch ist und absolut zentriert sitzt:
  ```tsx
  <div className="absolute" style={{
    width: size * 2, height: size * 2,
    left: -size/2, top: -size/2,
    pointerEvents: "auto",
  }} onPointerMove={...} onPointerLeave={resetTilt} />
  ```
- Pointer-Events wandern komplett auf diesen Layer. Card selbst bekommt `pointer-events-none` für den Tilt-Pfad, behält aber `onClick` (oder Click läuft via Hit-Layer; sauberer: Klick auf Hit-Layer toggelt nur, wenn der Cursor sich tatsächlich über der Card-Bounding-Box befindet).
- Die Berechnung `rx/ry` referenziert weiterhin **die Card-Box** (nicht den Hit-Layer), damit Bewegung außerhalb der Card stärker kippt — genau das gewünschte Gefühl.
- Smiley/Hover-State wird ebenfalls vom Hit-Layer getriggert.

## 4. Organische Ball-Bewegung

Original-Look (Container rotiert starr) → wir gehen darüber hinaus. Jeder Ball bekommt eine eigene Trajektorie (Lissajous-artig), keine gemeinsame Rotation mehr.

- 4 individuelle CSS-Keyframes (`face-pill-orbit-a/b/c/d`), je 14–22 s, `ease-in-out`, mit 4–5 Stops, die Position **und** leicht die Skala variieren:
  ```css
  @keyframes face-pill-orbit-a {
    0%   { transform: translate(-30%, -50%) scale(1); }
    25%  { transform: translate(20%, -40%)  scale(1.08); }
    50%  { transform: translate(40%, 10%)   scale(0.95); }
    75%  { transform: translate(-10%, 30%)  scale(1.05); }
    100% { transform: translate(-30%, -50%) scale(1); }
  }
  ```
- Verschiedene Phasen pro Ball (`animation-delay: -3s/-7s/-11s`), unterschiedliche Dauern → wirkt nie repetitiv.
- Bei `processing` werden alle Dauern halbiert (über CSS-Variable `--orbit-speed`); bei `failed`/`busy-blocked` verdoppelt.
- Hover pausiert weiterhin (`animation-play-state: paused`).
- Bälle nutzen `sample.colors.{c1,c2,c3,bg}` direkt (heute werden 3 Hex-Defaults vermischt — wir mappen alle 4 auf die Sample-Palette).

## Dateien

- **neu**: `src/components/entity/useSelectedCharacter.ts`
- **edit**: `src/pages/OrbLab.tsx` — Hook statt useState, Matrix-Rendering vereinheitlichen
- **edit**: `src/pages/Index.tsx` — Hook lesen, `character` + `onPickInputMode` an `<Entity>` durchreichen
- **edit**: `src/components/entity/characters/FacePillCharacter.tsx` — Hit-Layer (2× size), neue Orbit-Keyframes statt gemeinsamer Container-Rotation, State-getriebene Speed-Variable

## Was bewusst NICHT passiert

- Keine neue DB-Spalte/Migration (wir nutzen `app_settings.namespace='orb'` mit `key='character'`).
- Kein Mode-Routing in Index (PickInputMode öffnet nur Overlay, semantisches Mapping kommt separat).
- Kein Refactor von SiriCharacter / EntitySurface / SiriOrb.
- Kein Reduced-Motion-Bremsen (bewusst, wie zuletzt vereinbart).