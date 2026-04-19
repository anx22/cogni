

## Phase 4 — Dialog-Overlay-Grundgerüst

### Ziel
Vollbild-Overlay über Entity- und Project-Screen. 8 Box-Typen × 6 Zustände als komponierter Gesprächsraum. Alle bestehenden `toast(...)`-Brücken werden durch `openDialog({...})`-Aufrufe ersetzt.

### Architektur

**Globaler State via React Context** (`DialogProvider`), montiert in `App.tsx`. Kein Routing, nur Overlay-State. Jeder Aufruf öffnet eine **Dialog-Session**, die aus 1–N **Boxen** besteht. Boxen sind eigenständige Komponenten, die per `type`-Discriminator gerendert werden.

```text
┌───────────────────────────────────────┐
│  DialogProvider (Context)             │
│  ├─ openDialog(session) → setState   │
│  ├─ closeDialog()                     │
│  ├─ updateBoxState(boxId, state)      │
│  └─ <DialogOverlay />  (Portal)       │
│      ├─ Backdrop + ESC + close-X      │
│      ├─ Session-Header (Anlass)       │
│      ├─ <BoxRenderer> (alle Boxen)   │
│      └─ Commit / Verwerfen Footer     │
└───────────────────────────────────────┘
```

### Datenmodell (TS, lokal — Phase 7 verbindet zu Supabase)

```ts
type BoxType = 'wissen' | 'zuordnung' | 'konflikt' | 'gap'
             | 'auswahl' | 'eingabe' | 'kontext' | 'aktion';

type BoxState = 'vorgeschlagen' | 'aufgeklappt' | 'geaendert'
              | 'bestaetigt' | 'verworfen' | 'eskaliert';

type DialogBox = {
  id: string;
  type: BoxType;
  state: BoxState;
  title: string;
  payload: any; // typ-spezifisch
};

type DialogSession = {
  id: string;
  anlass: string;       // "Konflikt klären", "Lücke schließen" ...
  context?: string;     // z.B. "Konflikt #k1"
  boxes: DialogBox[];
};
```

### Die 8 Box-Komponenten (`src/components/dialog/boxes/`)

Jede Box hat dieselbe Hülle (`BoxFrame`): Border, Status-Indikator (6-Zustand-Dot), Titel, Body, Footer-Aktionen (Bestätigen/Verwerfen/Ändern/Eskalieren — abhängig vom Zustand).

1. **WissensBox** — erkannter Sachverhalt + Quelle, „Stimmt / Korrektur / Verwerfen"
2. **ZuordnungsBox** — Vorschlag „Diesem Projekt/Thema zuordnen?", Auswahl + Bestätigen
3. **KonfliktBox** — Fakt A vs. Fakt B nebeneinander, Auswahl welche Variante stimmt + Begründung
4. **GapBox** — Lücke + Wirkung + Lebensdauer, Eingabefeld zur Schließung oder „Später"
5. **AuswahlBox** — N explizite Optionen als Radio
6. **EingabeBox** — Freitextfeld + Submit
7. **KontextBox** — Quelle, Auszug, Begründung, read-only mit „Quelle öffnen"
8. **AktionsBox** — abschließender Commit-Block: bestätigen / verwerfen / mergen / abbrechen

### 6 Zustände — visuell durchgängig

| Zustand | Indikator |
|---|---|
| `vorgeschlagen` | dezent, gestrichelter linker Balken |
| `aufgeklappt` | voll sichtbar, primary-Akzent |
| `geaendert` | amber-Punkt + „geändert"-Tag |
| `bestaetigt` | grüner Haken, Box collapsed |
| `verworfen` | dim 50%, durchgestrichener Titel |
| `eskaliert` | roter Rand + „eskaliert"-Badge |

### Overlay-UI

- Vollbild-Portal, `position: fixed inset-0`, Backdrop `bg-background/85 backdrop-blur-md`
- Container zentriert max-w-3xl, vertikal scrollbar bei langen Sessions
- Header: kleiner Anlass-Label + Context-Chip (z.B. „Konflikt #k1") + Close-X
- Body: vertikal gestapelte Boxen, ~16px Abstand
- Footer: „Alle bestätigen" / „Session schließen" — wird aktiv, wenn alle Boxen einen Endzustand haben
- ESC schließt, Klick auf Backdrop fragt nach (kein versehentlicher Verlust)
- Animations: fade-in 200ms, einzelne Boxen staggered 60ms

### Helper-Factories

`src/lib/dialog/sessionFactories.ts` — kleine Helfer, die aus einem Trigger-Kontext eine Session bauen:

- `buildKonfliktSession(konflikt)` → KonfliktBox + KontextBox + AktionsBox
- `buildGapSession(gap)` → GapBox + EingabeBox + AktionsBox
- `buildHandlungsbedarfSession(item)` → WissensBox + EingabeBox + AktionsBox
- `buildThemaSession(thema)` → KontextBox + ZuordnungsBox
- `buildDokumentSession(doc)` → KontextBox (Phase-6-Hinweis)
- `buildVerlaufSession(eintrag)` → KontextBox + ggf. KonfliktBox
- `buildFeedbackSession(context)` → EingabeBox + AktionsBox
- `buildSourceSession(quelle)` → KontextBox

### Toast-Brücken → Dialog-Aufrufe ersetzen

In folgenden Komponenten werden alle `toast(...)`-Aufrufe durch `openDialog(buildXSession(...))` ersetzt:

- `ConflictBanner.tsx` → `buildKonfliktSession`
- `SignalStrip.tsx` (Gaps + Dependencies) → `buildGapSession` / `buildHandlungsbedarfSession`
- `HandlungsbedarfList.tsx` (Bearbeiten + Antworten) → `buildHandlungsbedarfSession`
- `SubstanzSection.tsx` (Themen + Dokumente) → `buildThemaSession` / `buildDokumentSession`
- `VerlaufFeed.tsx` (Eintrags-Klick) → `buildVerlaufSession`
- `SourceMarker.tsx` → `buildSourceSession`
- `FeedbackButton.tsx` → `buildFeedbackSession`

### Box-Verhalten (lokal in Phase 4)

- Aktionen ändern nur den Box-State im Context (kein Backend-Commit)
- „Bestätigen" auf AktionsBox schließt die Session und zeigt einen kurzen Toast „Commit (Mock) — Backend-Anbindung in Phase 7"
- Geänderter Zustand pro Box wird im Footer als Mini-Summary sichtbar („3 bestätigt, 1 geändert, 1 verworfen")

### Neue Dateien

```
src/components/dialog/
  DialogProvider.tsx          # Context + State + Portal-Mount
  DialogOverlay.tsx           # Vollbild-UI
  BoxRenderer.tsx             # type-Switch
  BoxFrame.tsx                # gemeinsame Hülle + Zustands-Indikator
  BoxStateBadge.tsx
  boxes/
    WissensBox.tsx
    ZuordnungsBox.tsx
    KonfliktBox.tsx
    GapBox.tsx
    AuswahlBox.tsx
    EingabeBox.tsx
    KontextBox.tsx
    AktionsBox.tsx
src/lib/dialog/
  types.ts                    # BoxType, BoxState, DialogBox, DialogSession
  sessionFactories.ts         # buildKonfliktSession etc.
  useDialog.ts                # Hook
```

### Geänderte Dateien

- `src/App.tsx` — `<DialogProvider>` um die Routes legen
- `ConflictBanner.tsx`, `SignalStrip.tsx`, `HandlungsbedarfList.tsx`, `SubstanzSection.tsx`, `VerlaufFeed.tsx`, `SourceMarker.tsx`, `FeedbackButton.tsx` — `useDialog().openDialog(...)` statt `toast(...)`
- `docs/implementierung-aktuell.md` + `docs/geplant.md` — Phase 4 als in Arbeit / abgeschlossen markieren

### Out of Scope (bleibt für später)

- Echtes Backend-Commit gegen Supabase (Phase 7 mit Graphiti-Integration)
- Gesprächsboxen-Persistenz / Wiederaufnahme von Sessions
- Auto-Generierung von Sessions aus Pipeline-Output (Phase 5/6)
- Multi-User / Realtime-Sync
- Sprach-/KI-gestützte Antworten in EingabeBox

### Erwartetes Ergebnis

Klick auf Konflikt, Gap, Handlungsbedarf-Aktion, Thema, Dokument, Verlauf-Eintrag, SourceMarker oder Feedback öffnet ein konsistentes Vollbild-Overlay mit der passenden Box-Komposition. Jede Box reagiert auf Bestätigen/Ändern/Verwerfen mit sichtbarem Zustandswechsel. Die Toast-Übergangsschicht ist vollständig abgelöst.

