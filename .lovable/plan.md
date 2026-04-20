

## Plan: Phase 5 — Universeller Input (final)

### Entscheidungen
- **Drop**: bleibt direkt am Kern (wie heute)
- **Klick auf Kern**: öffnet großes, reduziertes Eingabe-Overlay
- **Modus-Auswahl im Overlay**: Pills (Notiz · Link · Datei · Sprache)
- **Voice**: Mikro-Pill als Platzhalter, Toast „kommt bald"
- **Link**: stiller Intake mit Toast „Link aufgenommen"

### Architektur

**Neue Dateien**
- `src/lib/intake/detectInputType.ts` — erkennt file/url/text aus Paste/Drop
- `src/lib/intake/useIntake.ts` — zentraler `intake(payload)`-Eintrittspunkt: Toast + Pulse-Trigger am Kern, mockt Verarbeitung
- `src/components/entity/InputOverlay.tsx` — Vollbild-Overlay (dunkel, glasartig, zentriert), Pills oben, großes Eingabefeld in der Mitte, ESC/Klick-außerhalb schließt
- `src/components/entity/InputPills.tsx` — Pills-Leiste (Notiz aktiv, Link, Datei, Sprache), schaltet Inhaltsfläche um

**Geänderte Dateien**
- `src/components/EntityCore.tsx` — Drop bleibt, neuer `onClick` öffnet Overlay; Drop ruft jetzt `useIntake` statt lokalem Setstate
- `src/pages/Index.tsx` — Overlay-State (`open`/`close`), Verdrahtung Kern↔Overlay↔Intake

### Overlay-Verhalten
- Öffnet zentriert über dem Kern (Backdrop-Blur, dunkel)
- Pills: **Notiz** (Default, großes Textarea), **Link** (URL-Feld, stiller Intake), **Datei** (Klick öffnet File-Picker, Drop weiterhin außerhalb möglich), **Sprache** (deaktiviert/Toast)
- Auto-Detection: wer im Notiz-Feld eine URL pastet, springt nicht um — landet als Link via Detection beim Submit
- Submit per Enter (Cmd/Ctrl+Enter bei Textarea) oder Button → `intake()` → Overlay schließt → Toast + Kern-Pulse

### Intake-Stub
`useIntake` zeigt:
- Toast: „{Typ} aufgenommen — wird verarbeitet"
- Setzt kurz `entityState` auf `processing`, danach zurück auf `idle`
- Kein Backend, kein Storage — Hook bietet später einen Plug-Point für Phase 6

### Was NICHT in Phase 5
- Kein echter Upload, kein Parsing, keine Voice-Aufnahme
- Keine Link-Vorschau (Briefing-konform: stiller Intake)
- Keine Persistenz der Inputs

### Memory & Docs
- Neue Notiz `mem://features/universeller-input` — Pills statt Auto-Switch, Drop am Kern, Click öffnet Overlay
- Update `docs/implementierung-aktuell.md` — Phase 5 als „in Arbeit" → nach Bau auf „erledigt"
- Update `docs/geplant.md` — Phase 5 abhaken

### Betroffene Dateien (Übersicht)
- neu: `src/lib/intake/detectInputType.ts`, `src/lib/intake/useIntake.ts`, `src/components/entity/InputOverlay.tsx`, `src/components/entity/InputPills.tsx`
- geändert: `src/components/EntityCore.tsx`, `src/pages/Index.tsx`, `docs/implementierung-aktuell.md`, `docs/geplant.md`
- neu (Memory): `mem://features/universeller-input`, Update `mem://index.md`

