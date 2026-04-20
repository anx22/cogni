
## Review-Ergebnis

Ja: Das aktuelle Overlay ist für einfache Projekt-Screen-Fälle zu komplex und in Teilen falsch interpretiert.

### Was die Briefings tatsächlich sagen
Die Dokumente definieren:
- ein **Box-System als Baukasten** mit 8 Box-Typen und 6 Zuständen
- einen **komponierten Gesprächsraum**
- **keinen Zwang**, bei jedem Fall mehrere Boxen oder eine vollständige Review-Maschinerie zu zeigen

Wichtig:
- Die Specs beschreiben das Overlay als **einfachen, fokussierten Gesprächsraum**
- In den Flow-Beispielen sind Boxen **fallabhängig**
- Für einen einfachen Handlungsbedarf-Fall ist **keine 3-stufige Redundanz** vorgegeben

### Wo die aktuelle Umsetzung abweicht
1. **Redundanz**  
   `Handlungsbedarf bearbeiten` zeigt aktuell:
   - Wissensbox
   - Eingabebox
   - Aktionsbox  
   Das sind faktisch drei UI-Blöcke für denselben Vorgang.

2. **Begriffe sind semantisch unsauber**
   - `Bearbeiten`
   - `Inline antworten`
   - `Commit`
   - `Bearbeitung übernehmen`  
   sind im aktuellen UI nicht klar getrennt und wirken teilweise wie dasselbe.

3. **Eskalieren ist nicht sauber definiert**  
   Der Begriff existiert zwar als Box-Zustand in den Docs, aber **nicht als klarer Nutzerbegriff** für V1 im Projekt-Overlay. Für den aktuellen Scope ist er eher verwirrend als hilfreich.

4. **Zu viele Systemzustände sind sichtbar**  
   Die Architektur darf intern komplex sein, aber der Nutzer muss das nicht alles sehen. Aktuell wird die Systemlogik zu direkt exponiert.

---

## Korrigierte Produktinterpretation

### Für einfache Projekt-Fälle soll das Overlay extrem simpel sein
Deine Erinnerung ist stimmig. Für typische Trigger aus dem Projekt-Screen sollte das Overlay meist nur aus **drei funktionalen Elementen** bestehen:

1. **Inhalt / erkannter Sachverhalt**
2. **Widerspruch oder Kontext**  
   nur wenn nötig
3. **Antwort / Entscheidung**

Nicht mehr.

### Praktische Regel
Die 8 Box-Typen bleiben als Systembaukasten bestehen, aber:
- **pro Anlass nur das Minimum**
- **kein eigener Aktionsblock**, wenn die Eingabe selbst schon abschließen kann
- **Kontext nur bei Bedarf**
- **kein Eskalieren in V1**, außer intern oder später

---

## Neue Overlay-Regel für V1

### Standardmuster nach Trigger

**Handlungsbedarf**
- 1 Karte: Sachverhalt
- 1 Karte: Antwort / Korrektur
- optional: Kontext inline oder als kleine Quelle
- kein separater Commit-Block

**Konflikt**
- 1 Karte: Widerspruch A vs. B
- optional: Quelle / Begründung
- 1 Karte: Entscheidung / Antwort

**Gap**
- 1 Karte: Fehlende Information + Wirkung
- 1 Karte: kurze Antwort / Ergänzung

**Feedback**
- 1 Karte: Kontext
- 1 Karte: Feedback-Eingabe

**Dokument / Quelle**
- 1 Karte: Kontext / Quelle
- optional: Reaktion

---

## Begriffsklärung für die UI

Diese Begriffe werden vereinheitlicht:

- **Bearbeiten** und **Inline antworten**: zusammenführen  
  Nur noch ein Einstieg, z. B. `Antworten`
- **Commit** und **Bearbeitung übernehmen**: zusammenführen  
  Für V1 nur noch ein klarer Abschluss, z. B. `Übernehmen`
- **Eskalieren**: aus der sichtbaren V1-UI entfernen
- **Verwerfen**: nur dort zeigen, wo es fachlich wirklich Sinn ergibt
- **Mergen**: nur bei echter Zuordnungs-/Versionslogik, nicht in Standardfällen

---

## Umsetzungsplan

### 1. Overlay vereinfachen
- `sessionFactories.ts` auf **minimal-komponierte Sessions** umbauen
- `buildHandlungsbedarfSession()` von 3 Boxen auf **2 Boxen** reduzieren:
  - Sachverhalt
  - Antwort
- `buildGapSession()` ebenfalls auf **2 Boxen** reduzieren
- `buildFeedbackSession()` ohne separaten Aktionsblock, falls nicht nötig
- `buildKonfliktSession()` auf maximal:
  - Konflikt
  - optional Kontext
  - Antwort/Entscheidung

### 2. Aktionslogik vereinfachen
- `AktionsBox` nicht mehr als Standard-Endblock für fast alles verwenden
- `EingabeBox`, `KonfliktBox`, `ZuordnungsBox`, `AuswahlBox` bekommen den Abschluss direkt in ihrer eigenen Interaktion
- Footer nur noch für:
  - Schließen
  - einfache Zusammenfassung
- kein separater Commit-Zwang bei simplen Fällen

### 3. Eskalation aus V1 zurücknehmen
- `eskaliert` als interner Zustand vorerst nicht prominent in der UI nutzen
- Button `Eskalieren` aus `BoxFrame` Standardaktionen entfernen
- falls nötig später nur für echte Spezialfälle wieder einführen

### 4. Sichtbare Zustände entschlacken
Für V1 im UI nur klar lesbare Zustände priorisieren:
- offen
- bestätigt / übernommen
- verworfen
- geändert nur wenn sichtbar sinnvoll

`vorgeschlagen`, `aufgeklappt`, `eskaliert` können intern bleiben, aber sollten nicht überall als dominante Nutzerlabels auftauchen.

### 5. Trigger im Projektscreen sprachlich bereinigen
- In `HandlungsbedarfList.tsx` nur noch ein CTA: `Antworten`
- `FeedbackButton` bleibt separat
- Konflikt-/Gap-/Quelle-Overlays öffnen je ein klar fokussiertes Overlay statt Mehrfachbox-Stapel

### 6. Dokumentation korrigieren
Aktualisieren:
- `docs/implementierung-aktuell.md`
- `docs/geplant.md`
- optional `.lovable/memory/features/produkt-prinzipien.md`

Ergänzung in der Doku:
- Die **8 Box-Typen sind ein Systembaukasten, kein Pflichtsatz pro Fall**
- **Einfache Projekt-Overlays folgen einem Minimalprinzip**
- Standard für V1: **Inhalt + ggf. Widerspruch/Kontext + Antwort**

---

## Betroffene Dateien

- `src/lib/dialog/sessionFactories.ts`
- `src/components/dialog/BoxFrame.tsx`
- `src/components/dialog/DialogOverlay.tsx`
- `src/components/dialog/boxes/AktionsBox.tsx`
- `src/components/dialog/boxes/EingabeBox.tsx`
- `src/components/dialog/boxes/KonfliktBox.tsx`
- `src/components/dialog/boxes/GapBox.tsx`
- `src/components/project/HandlungsbedarfList.tsx`
- `src/components/project/shared/SignalStrip.tsx`
- `src/components/project/shared/ConflictBanner.tsx`
- `src/components/project/VerlaufFeed.tsx`
- `docs/implementierung-aktuell.md`
- `docs/geplant.md`

---

## Zielbild nach der Korrektur

Das Overlay wirkt wieder wie von dir beschrieben:
- extrem simpel
- schnell verständlich
- kein dreifacher UI-Aufbau für denselben Fall
- keine unklaren Begriffe
- die Entität zeigt Problem oder Widerspruch
- der Nutzer antwortet
- fertig

Die Systemarchitektur mit 8 Box-Typen bleibt erhalten, aber wird nur noch dort sichtbar, wo der Fall die zusätzliche Komposition wirklich braucht.
