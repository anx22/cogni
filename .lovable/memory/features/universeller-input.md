---
name: Universeller Input
description: Phase-5-Modul. Drop am Kern, Klick öffnet Overlay mit Pills (Notiz/Link/Datei/Sprache). Kein Auto-Switch.
type: feature
---

**Universeller Input (Phase 5)**

- Drop direkt auf den Entity-Kern bleibt erhalten — schnellster Weg.
- Klick auf den Kern öffnet ein Vollbild-Overlay (dunkel, glasartig, zentriert).
- Modus-Auswahl im Overlay über **Pills**, kein Auto-Switch zwischen Modi:
  - Notiz (default, großes Textarea, Cmd/Ctrl+Enter zum Übernehmen)
  - Link (URL-Feld, stiller Intake mit Toast)
  - Datei (File-Picker; Drag&Drop läuft weiter über den Kern)
  - Sprache (Platzhalter, Toast „Phase 6")
- Auto-Detection greift nur **innerhalb** des Notiz-Modus: ist der Inhalt eine URL, wird beim Submit als Link aufgenommen.
- Paste einer Datei im Overlay löst direkt Intake aus.
- Voice in Phase 5 NICHT implementiert — bewusst Platzhalter.

**Intake-Flow**

- Zentraler Hook `useIntake` zeigt Toast „X aufgenommen — wird verarbeitet", setzt Entity kurz auf `processing`, danach zurück auf `idle`.
- Kein Backend, kein Storage in Phase 5 — Plug-Point für Phase 6.
