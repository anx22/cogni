

## Plan: manuell-Flag automatisch in Dialog-Boxen setzen

### Ziel
Wenn ein Nutzer im Dialog etwas bestätigt/eingibt (EingabeBox, AuswahlBox, KonfliktBox), wird der zugehörige Fakt automatisch als `manuell: true` markiert — sichtbar via `SourceMarker`.

### Problem
Das Dialog-System ist heute eine isolierte Session ohne Rückkanal in `demoProject`. Boxen rufen `updateBoxPayload` + `updateBoxState` auf, aber das Ergebnis landet nirgends in den Listen (Handlungsbedarf, Verlauf etc.). Die `manuell`-Flags in `demoProject.ts` sind heute statisch gesetzt.

### Schlanker Lösungsansatz

**1. Globaler "manuell-bestätigt"-Store (Set von Quellen-IDs)**
Neuer leichter Context `ManualOverridesProvider` mit:
- `manualSources: Set<string>` (z. B. `"Gap #g3"`, `"h5"`, `"Mail Thomas"`)
- `markManual(quelle: string)` Funktion

Kein Persistenz, kein Datenmodell-Eingriff, nur Runtime-State für den Prototyp.

**2. Dialog-Boxen rufen `markManual` beim Bestätigen**
- `EingabeBox.submit()` → `markManual(session.context)`
- `AuswahlBox` Übernehmen → `markManual(session.context)`
- `KonfliktBox.confirm()` → `markManual(session.context)`

Die `session.context` enthält bereits die Quellen-Referenz (z. B. `"Gap #g3"`, `"Konflikt #k1"`, Handlungsbedarf-ID).

**3. `SourceMarker` liest aus dem Store**
`manuell`-Prop wird zu `manuell?: boolean` (statischer Override aus Demo-Daten) ODER abgeleitet aus `useManualOverrides().has(quelle)`. Effektiv: `manuell || isManual(quelle)`.

**4. Provider in `App.tsx` einhängen**
Wrappt die App, damit alle Komponenten Zugriff haben.

### Was wir NICHT machen
- Keine Mutation von `demoProject.ts` zur Laufzeit.
- Kein neues Feld am Datenmodell.
- Keine Persistenz/Backend.
- Kein Refactoring der Box-Signaturen.

### Betroffene Dateien
- `src/lib/dialog/manualOverrides.tsx` (neu) — Context + Provider + Hook
- `src/App.tsx` — Provider einhängen
- `src/components/dialog/boxes/EingabeBox.tsx` — `markManual` im submit
- `src/components/dialog/boxes/AuswahlBox.tsx` — `markManual` beim Übernehmen
- `src/components/dialog/boxes/KonfliktBox.tsx` — `markManual` im confirm
- `src/components/project/shared/SourceMarker.tsx` — Store-Lookup ergänzen

### Effekt im Prototyp
Nutzer öffnet z. B. einen Handlungsbedarf-Item, gibt eine Antwort ein → schließt → der `SourceMarker` dieses Items zeigt jetzt das UserCheck-Icon + "manuell". Ohne Reload, ohne Datenänderung.

