

## Befund

**1. „Zur Kenntnis"** — sitzt nur in `KontextBox.tsx`. Setzt die Box auf `bestaetigt`. Sonst nichts. Da KontextBoxen rein informativ sind (Quelle, Auszug, Themen-/Dokument-/Verlauf-Vorschau), ist der Button funktional leer und semantisch verwirrend — er suggeriert eine Entscheidung, wo keine zu treffen ist.

**2. Schließen-Guard** — `DialogOverlay.tsx` blockiert ESC und Backdrop-Klick mit einem Toast („Erneut schließen bestätigt"), wenn nicht alle Boxen einen Endzustand haben. Das widerspricht dem Prinzip „User nicht stoppen". Offene Fragen sollen offen bleiben dürfen — sie bleiben ja ohnehin als Konflikt/Gap/Handlungsbedarf im Projekt-Screen sichtbar.

## Plan

**A. „Zur Kenntnis" entfernen**
- `KontextBox.tsx`: „Zur Kenntnis"-Button raus. „Quelle öffnen" bleibt (nützlich, später Phase 6 Preview).
- KontextBoxen brauchen keinen Endzustand — sie sind Kontext, kein Entscheidungspunkt.

**B. Schließen-Guard entfernen**
- `DialogOverlay.tsx`: `tryClose()` durch direktes `closeDialog()` ersetzen. ESC, Backdrop-Klick und X schließen sofort.
- Kein Toast, keine Rückfrage. Unbeantwortete Sachen bleiben als Konflikt/Gap/Handlungsbedarf im Projekt sichtbar — das ist die natürliche Persistenz.

**C. Footer-Logik anpassen**
- Footer-Summary („X von Y entschieden") darf bleiben als ruhiger Hinweis, aber **kein blockierendes Verhalten**.
- KontextBoxen werden in der Zählung nicht mehr als „offen" geführt (sie haben keinen Entscheidungscharakter). Praktisch: in `DialogOverlay` die Decided-/Total-Berechnung auf Boxen mit Entscheidungscharakter beschränken (alle außer `kontext`).

## Betroffene Dateien
- `src/components/dialog/boxes/KontextBox.tsx` — Button raus
- `src/components/dialog/DialogOverlay.tsx` — Guard raus, Zählung anpassen

## Zielbild
- Overlay schließt jederzeit ohne Rückfrage
- KontextBoxen sind reine Info, keine Pseudo-Entscheidung
- Offene Punkte bleiben über die Projekt-Sicht sichtbar — die Entität vergisst nichts, der User wird aber nicht festgehalten

