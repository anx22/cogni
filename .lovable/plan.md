## Ziel

Den selbstgebauten radial-gradient-Kern (`EntityCore`) und die Voice-Visualisierung durch die **Siri Orb**-Komponente ersetzen. Der Orb reagiert sichtbar auf Zustände der App (idle, hover, processing, review-ready, failed) über Farb- und Geschwindigkeits-Presets, und auf Voice-Input über `animationDuration`-Modulation.

## Klarstellung Scope

Du hast „alles unter `src/components/entity` + `EntityCore`" gesagt. Diese Ordner enthalten aber zwei sehr verschiedene Dinge:

**Visuell der Kern (wird ersetzt):**

- `src/components/EntityCore.tsx`
- `src/components/entity/EntityVoice.tsx` (visueller Teil — die Voice-Logik in `useEntityVoice.ts` bleibt)

**Layout/Funktion drumherum (bleibt):**

- `SideGrid`, `IntakeSessionsPanel`, `ProjectTile`, `RecentAssets`, `InputPills`, `HomeDropOverlay`, `InputOverlay`

Diese Dinge sind keine Visualisierung der Entität, sondern Listen, Drop-Zonen und Eingabefelder. Sie zu löschen würde Drop, Projektnavigation und Intake-Sessions kaputtmachen. Falls du sie trotzdem weghaben willst, sag's — dann mache ich daraus einen separaten Schritt.

## Architektur

```text
src/components/entity/
  SiriOrb.tsx          ← Pure Komponente (Port aus smoothui)
  Entity.tsx           ← Wrapper: State-Preset + Drop/Click + Voice-Reaktion
  presets.ts           ← State → Color/Duration Map
src/index.css
  @keyframes orb-rotate
  prefers-reduced-motion override
```

`Index.tsx` rendert dann nur noch `<Entity state={entityState} onDrop={...} onClick={...} voiceLevel={voice.level} />` statt `EntityCore + EntityVoice` getrennt.

## Komponente

`**SiriOrb.tsx**` — 1:1 Port der smoothui-Komponente:

- Props `size`, `className`, `colors {bg,c1,c2,c3}`, `animationDuration`
- Conic-gradient + radial-gradient mit `filter: blur() contrast()`
- Mask, damit der Kern transparent bleibt
- CSS-Animation `orb-rotate 20s linear infinite` (Duration aus Prop)
- Größenabhängige Skalierung (Blur, Contrast, Dot-Size, Shadow) aus den Konstanten der Original-Source
- Reduced-motion: Animation pausieren

`**presets.ts**` — Mapping pro State:


| State        | bg                     | c1 (akzent)                             | c2        | c3        | duration |
| ------------ | ---------------------- | --------------------------------------- | --------- | --------- | -------- |
| idle         | dunkles blau           | kühles Pastell-Blau                     | Lavendel  | Petrol    | 20s      |
| hover        | leicht heller          | helles Cyan                             | Lavendel  | Petrol    | 12s      |
| processing   | warm-dunkel            | Amber                                   | Coral     | Gold      | 4s       |
| review-ready | tief-türkis            | Mint                                    | Aqua      | Soft-Gold | 8s       |
| failed       | fast schwarz           | Rot                                     | Anthrazit | Anthrazit | 10s      |
| busy-blocked | wie idle, aber gedimmt | (idle-Farben mit reduzierter Sättigung) | &nbsp;    | &nbsp;    | 25s      |


Voice: solange `voice.isRecording` oder `voice.level > 0`, wird `animationDuration` reaktiv kürzer (z. B. `Math.max(2, 12 - level*10)`). Sobald Voice still ist, fällt es zurück auf den State-Preset.

`**Entity.tsx**` — Wrapper:

- Übernimmt die bisherigen Drop/Drag-Handler aus `EntityCore` (`onDrop`, `busy`, `onClick`, `onReviewClick`)
- Click-Layer als unsichtbarer `button` über dem Orb (Accessibility: `aria-label="Entität öffnen"`)
- Liest optional `voiceLevel: number` aus, moduliert duration
- State-Wechsel mit CSS-Transition auf `--orb-c1` etc. (~600 ms), damit Farbwechsel butterweich wird

## Integration in Index.tsx

- Imports `EntityCore` und `EntityVoice` raus, `Entity` rein
- `EntityVoice` als sichtbares UI-Element entfällt; die Voice-Steuerung (Mic-Button, Transcript-Text) bleibt sichtbar als kleines Control unter dem Orb. Falls du Voice komplett unsichtbar in den Orb verschmelzen willst → bitte bestätigen, sonst lasse ich das kleine Mic-Control stehen.
- `voice.level` (RMS aus `useEntityVoice`) wird in `<Entity>` reingegeben

## Aufräumen

- Lösche `src/components/EntityCore.tsx`
- Lösche `src/components/entity/EntityVoice.tsx`
- Andere Dateien unter `src/components/entity/` bleiben unverändert

## Was ich nicht machen werde, ohne Rückfrage

1. SideGrid / IntakeSessionsPanel / Projekt-Tiles entfernen — die sind Funktion, nicht Deko.
2. Eine neue Voice-UI bauen — nur Reaktivität via Level. Falls du die Mic-Steuerung komplett aus dem UI haben willst, brauche ich ein OK.
3. Den Orb als Drop-Target globaler machen (aktuell ist `Index.tsx` der globale DragOver-Handler — bleibt so).

## Offene Frage vor Build

Soll der bestehende kleine Mic/Voice-Button (`EntityVoice.tsx` enthält UI für Recording-Indikator + Transcript) als kleines Control unter dem Orb erhalten bleiben oder komplett verschwinden und nur noch der Orb pulsiert?