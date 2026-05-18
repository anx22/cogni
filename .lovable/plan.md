## Diagnose

Der Freeze ist sehr wahrscheinlich kein Backend-Hänger, sondern ein Overlay-Layering-Bug:

- Beim Klick auf `11 übernehmen` öffnet sich wegen `BULK_CONFIRM_THRESHOLD = 5` ein Bestätigungsdialog.
- Im Session-Replay sieht man: Radix setzt `body[data-scroll-locked]` und `pointer-events: none`.
- Der Confirm-Dialog liegt aber mit `z-50` unter dem fullscreen `BatchReviewOverlay` mit `z-index: 100`.
- Ergebnis: Der sichtbare Batch-Screen ist nicht mehr klickbar, der eigentliche Confirm-Dialog ist verdeckt. Das wirkt wie kompletter Freeze.
- Der einzelne `commit-fact` Request, der sichtbar war, kam erfolgreich mit `200 { ok: true }` zurück; das spricht gegen einen kaputten Backend-Commit als Hauptursache.

## Zielzustand

Batch Review muss zwei Dinge klar machen:

1. **Bulk-Übernahme darf nie die UI blockieren oder unsichtbar machen.**
2. **Projektzuordnung ist eine eigene kritische Vorentscheidung**, nicht eine normale Wissenszeile.

## Plan

### 1. Freeze-Hotfix: Confirm-Dialog sicher über BatchReview legen

Betroffene Dateien:

- `src/components/ui/alert-dialog.tsx`
- optional `src/components/shared/ConfirmDestructive.tsx`

Änderung:

- AlertDialog Overlay/Content bekommen eine höhere Layer-Stufe als `dlg2-root`, z. B. Overlay `z-[210]`, Content `z-[220]`.
- Dadurch bleibt `body` zwar korrekt scroll-locked, aber der aktive Dialog liegt sichtbar und klickbar oben.
- Optional: `ConfirmDestructive` bekommt eine klare Busy-Anzeige, damit während Bulk-Commit nicht der Eindruck entsteht, die UI sei eingefroren.

### 2. Bulk-Commit robuster und sichtbarer machen

Betroffene Datei:

- `src/components/dialog/BatchReviewOverlay.tsx`

Änderung:

- Lokalen `isBulkCommitting` State einführen.
- Commitbar zeigt währenddessen z. B. `Übernehme 3/11…` oder mindestens `Übernehme…`.
- Der Hauptbutton wird währenddessen deaktiviert, aber nicht stillschweigend ohne Feedback.
- Bulk-Confirm bleibt sequenziell, damit Backend-Guards und Reihenfolge stabil bleiben.
- Fehlerfall: Wenn ein Commit blockiert wird, bleibt die Zeile sichtbar offen und es gibt eine Toast-/Statusmeldung statt gefühltem Stillstand.

### 3. Zuordnung als kritische Gate-Zeile bauen

Betroffene Dateien:

- `src/components/dialog/parts/ReviewRow.tsx`
- `src/components/dialog/BatchReviewOverlay.tsx`

Änderung:

- Eigene `zuordnung`-Variante in `ReviewRow`, nicht mehr Default-Zeile.
- Visuelle Sprache:
  - kräftiger Akzent-/Warn-Stripe
  - Chip `ZUERST ZUORDNEN` oder `PROJEKT`
  - Titel: `Projektzuordnung erforderlich`
  - Kontexttext: z. B. empfohlenes Projekt / Grund aus `agent_reason`
  - prominente Auswahl-/Bestätigungsaktion statt kleinem Häkchen
- Wenn Kandidaten vorhanden sind: Projektchips anzeigen, z. B. empfohlener Kandidat hervorgehoben.
- Wenn keine Kandidaten vorhanden sind, aber `suggested_new_name`: Aktion `Neues Projekt: …` anbieten.
- Keine Reject-Aktion für Zuordnung, weil Backend sie ohnehin ablehnt.

### 4. Gating sichtbar machen: Andere Zeilen sind bewusst gesperrt

Betroffene Dateien:

- `src/components/dialog/BatchReviewOverlay.tsx`
- `src/components/dialog/parts/ReviewRow.tsx`
- optional `src/index.css`

Änderung:

- `ReviewRow` bekommt Props wie `blocked` und `blockedReason`.
- Solange eine offene Zuordnung existiert:
  - alle Nicht-Zuordnungs-Zeilen werden optisch gedimmt
  - Aktionen sind disabled
  - rechts steht sichtbar `nach Projektzuordnung`
  - Cursor/Tooltip/Inline-Hinweis machen klar: nicht kaputt, sondern Reihenfolge erforderlich
- Oben in der Batch-Liste erscheint ein kompakter Hinweisbanner:
  - `Erst Projekt wählen. Danach kannst du die 11 Erkenntnisse übernehmen.`
- Bulk-Button zeigt nicht `11 übernehmen`, sondern z. B. `Erst Projekt wählen`, solange Gate aktiv ist.

### 5. Typen stärker differenzieren

Betroffene Datei:

- `src/components/dialog/parts/ReviewRow.tsx`

Änderung:

- Type-Chips bekommen typabhängige Farbe/Form/Semantik:
  - `WISSEN`: ruhig/blau oder neutral
  - `LÜCKE`: amber, offener Kreis, Eingabe nötig
  - `KONFLIKT`: rot/amber, Varianten sichtbar
  - `ZUORDNUNG`: höchste Priorität, eigene Gate-Sprache
  - `AKTION`/`AUSWAHL`: handlungsorientiert
- Zeilenstatus unterscheidet klar zwischen:
  - bereit übernehmbar
  - manuell erforderlich
  - blockiert durch Zuordnung
  - bereits bestätigt

### 6. Verifikation

Nach Umsetzung prüfen:

- Klick auf `11 übernehmen` zeigt den Confirm-Dialog sichtbar über allem.
- Kein Zustand mehr, in dem die Batch-Liste sichtbar ist, aber keine Mausinteraktion möglich ist.
- Mit offener Zuordnung zeigt die Commitbar nicht fälschlich `11 übernehmen`.
- Nicht-Zuordnungs-Zeilen sind sichtbar blockiert und erklären warum.
- Zuordnung ist als erster kritischer Schritt sofort erkennbar.
- Ein erfolgreicher Zuordnungs-Commit hebt das Gate auf und macht die übrigen Zeilen übernehmbar.