# Orb Lab — Finalisierung & Wiring

## Diagnose: Persistenz funktioniert "auf Papier"

Die Wiring ist korrekt: `useSelectedCharacter` → `useNamespace("orb")` → `app_settings`, Index liest dasselbe und gibt `character` an `<Entity>`. **Aber** in der DB stehen 0 Zeilen für `namespace='orb'` — Writes haben es entweder nie geschafft, oder die globale Scope-RLS (`(scope='global' AND user_id IS NULL)`) hat nicht gegriffen.

**Fix:** Charakter-Auswahl auf `scope="user"` umstellen (semantisch korrekt — jeder User wählt seinen Orb), und `useNamespace`-Optionen entsprechend übergeben. Damit greift die saubere `auth.uid() = user_id`-Policy, und die Auswahl reist mit dem User. Color-Presets bleiben global.

## Was geändert wird

### 1. `useSelectedCharacter` → user-scope + Verifizierung
- `useNamespace<CharacterId>("orb", { scope: "user" })`.
- Schreibt mit `user_id = auth.uid()`, liest dasselbe zurück. RLS sauber.
- Index nutzt denselben Hook → Charakterauswahl wirkt sofort beim nächsten Render.

### 2. Close-Button im Orb Lab
- Header rechts: dezenter `X`-Button (`Link to="/"` mit `lucide-react X`-Icon, `variant="ghost" size="icon"`).
- Zusätzlich `Esc`-Tastendruck schließt zurück nach `/` (kleines `useEffect` mit keydown-Listener).

### 3. Preview-Tiles werden statisch
- Aktuell rendert die Matrix `<Entity>` pro Tile → echtes Pointer-Tracking, Hover-Smiley, alles aktiv. Verwirrt und kostet Performance.
- Neu: jede Charakter-Tile zeigt **nur eine kleine Glas-Karte** mit dem Charakter-Label und einem statischen Mini-Vorschaubild des Orbs (kein Tilt, kein Hover-Effekt).
  - Render in Tile: ein 100×100-CSS-Snapshot — für `siri` ein gedämpfter `SiriOrb` mit fixer Farbsamplung, für `face-pill` ein statisches Squircle-Div mit 4 Blur-Bällen, **ohne Animation, ohne Pointer-Events** (`pointer-events-none`).
  - Tile selbst ist klickbar → `setCharacterId(...)`, aktiver Tile bekommt Border-Highlight `border-primary/60 ring-2 ring-primary/30`.
- Implementiert als kleine Komponente `<CharacterTile id="…" active={…} onSelect={…} />`, ein Eintrag pro `CHARACTER_LIST`-Item.
- Die heutige State-Matrix unten bleibt (zeigt wie der **aktive Charakter** in jedem State aussieht) — aber ebenfalls als Standbild ohne Pointer-Events (`pointer-events-none` Wrapper, `state="idle"`).

### 4. Auto-Roll / Re-Roll — Erklärung & Aktion

**Re-Roll**: Presets definieren keine festen Farben, sondern *Ranges* (z. B. Hue 220–240°). Bei jedem Render würfelt `samplePreset` aus diesen Ranges einen konkreten Wert. „Re-Roll" zwingt einen neuen Würfelwurf, damit du siehst, wie stark die Variation wirkt.

**Auto-Roll**: Tut dasselbe alle 4 s automatisch — reine Schau-Funktion zum Beobachten der Bandbreite.

**Verdict:** Re-Roll bleibt (nützlich, um die Range zu spüren); **Auto-Roll wird entfernt** (visuelles Rauschen, kein produktiver Nutzen). Re-Roll wird zu einem dezenten Icon-Button neben dem State-Badge — keine grellen Buttons mehr.

### 5. Layout-Refactor — weniger Scrollen, klarere Struktur

Statt einer langen vertikalen Liste:

```text
┌──────────────────────────────────────────────────────────┐
│  Orb Lab                              [DB] [gespeichert] [×] │
├──────────────────────────────────────────────────────────┤
│  Charaktere:  [ Siri ]  [ Face Pill ]                       │
├──────────────────────────────────────────────────────────┤
│                          │                                 │
│   ◉ Live-Vorschau         │   States                       │
│   (sticky, zentriert)     │   ┌──┐ ┌──┐ ┌──┐               │
│   [Re-Roll]  size: 320px  │   │id│ │ho│ │pr│ ...           │
│                           │   └──┘ └──┘ └──┘               │
│                           │                                 │
│                           │   Editor — {state}              │
│                           │   ▸ Farben    ▸ Animation       │
│                           │   ▸ Surface                     │
│                           │   (Accordion / Tabs)            │
└──────────────────────────────────────────────────────────┘
```

Konkret:
- `lg:grid-cols-[420px_1fr]` — links Live-Vorschau (sticky `top-6`), rechts alles andere.
- Editor-Sektionen werden in **3 Tabs** gepackt: `Farben | Animation | Surface`. Statt drei riesigen Blöcken untereinander.
- Size-Slider wandert in die Live-Vorschau-Karte (kompakter).
- State-Auswahl als kleine Pill-Reihe direkt über dem Editor (nicht doppelt: Tabs + große Matrix-Tiles ist redundant). Die untere große State-Matrix entfällt — die kleinen State-Pills oben reichen, plus ein kompakter Standbild-Streifen mit allen 6 States (statisch, klickbar).

### 6. Wiring zur Hauptapp — final

- Index nutzt bereits `useSelectedCharacter` und `character={characterId}`.
- `onPickInputMode` in Index öffnet Overlay (Mode-Routing kommt separat).
- Nach Scope-Umstellung auf `user` ist die Auswahl sofort persistent + reist mit dem Account.
- Verifikation am Ende: Charakter in OrbLab umstellen → zurück nach `/` → der neue Charakter ist sichtbar (ohne Reload).

## Dateien

- **edit** `src/components/entity/useSelectedCharacter.ts` — `scope: "user"` setzen.
- **edit** `src/pages/OrbLab.tsx` — neues Grid-Layout, Close-Button, Esc-Handler, Editor in Tabs, Auto-Roll raus, Re-Roll als Icon-Button, neue `<CharacterTile>` + statische State-Vorschauen.
- **neu** `src/pages/OrbLab/CharacterTile.tsx` — kleine, statische Auswahl-Karte pro Charakter.
- **neu** `src/pages/OrbLab/StaticStatePreview.tsx` — gerenderte Standbild-Tile pro State (kein Pointer-Tracking).

## Bewusst NICHT

- Kein Touch der Color-Presets-Architektur (`useOrbPresets` bleibt global).
- Keine neue Migration (RLS für `scope='user'` existiert bereits).
- Kein Mode-Routing in Index (separater Schritt).
- Keine Refactors an SiriCharacter / FacePillCharacter (nur Wrapper-Komponenten oben drüber).