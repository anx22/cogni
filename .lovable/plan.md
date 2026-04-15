

## Projekt-Screen: Architektur-Redesign

### Kernproblem

10 gleichwertige Panels auf einer Seite erzeugen visuellen Lärm. Die aktuelle Anordnung behandelt alle Facetten als gleichrangig, obwohl sie fundamental verschiedene Rollen haben.

### Neue Informationsarchitektur

Die Panels lassen sich in drei natürliche Archetypen gruppieren:

```text
┌──────────────────────────────────────────────────────┐
│  PROJECT HEADER                                       │
│  Name + Lagetext + Stat-Chips (Konflikte, Offene P.) │
│  + Konflikt-Banner (nur wenn Konflikte existieren)   │
└──────────────────────────────────────────────────────┘

┌─ TAB BAR ────────────────────────────────────────────┐
│  INTELLIGENCE    SUBSTANZ    KONTEXT                  │
└──────────────────────────────────────────────────────┘
```

**Tab 1: INTELLIGENCE** (Was passiert? Was muss ich wissen?)
- Lagebild/Aktueller Stand (verdichteter Fließtext + KPIs)
- Timeline (Chronologie der Veränderungen -- absorbiert Änderungen)
- Entscheidungen (mit Geltungsstatus)
- Offene Punkte & Aufgaben

**Tab 2: SUBSTANZ** (Woraus besteht das Projekt inhaltlich?)
- Themen (inhaltliche Cluster)
- Dokumente & Versionen
- Feedback & Korrekturen

**Tab 3: KONTEXT** (Wer und was drumherum?)
- Stakeholder
- Projektmetadaten (Infrastruktur, Zeitrahmen etc.)

### Konflikte & Änderungen: Neue Patterns

**Konflikte** werden kein eigenes Panel mehr. Stattdessen:
- **Konflikt-Banner** im Header: Erscheint nur wenn `konflikte.length > 0`. Rotes, dezentes Banner direkt unter dem Lagetext mit Anzahl + klickbar zum Aufklappen der Details. Null Konflikte = Banner existiert nicht.
- Im Referenz-Bild sichtbar: "KRITISCH" Badge-Stil, nicht als voller Panel.

**Änderungen** werden aufgelöst:
- Die Timeline absorbiert alle Änderungen (sie sind bereits dort als Events abgebildet -- aktuell redundant).
- Timeline-Entries bekommen Delta-Tags (Neu, Ersetzt, Bestätigt) wie bisher in FacetAenderungen.
- Zusätzlich: Jedes Panel, das kürzlich geändert wurde, bekommt einen subtilen Change-Indicator (kleiner Dot oder Icon-Button im BentoCard-Header), der bei Hover die letzten Änderungen zu diesem Panel zeigt.

### Betroffene Dateien

1. **ProjectScreen.tsx** -- Tab-System mit 3 Tabs, neues Layout pro Tab
2. **ProjectHeader.tsx** -- Konflikt-Banner (conditional), Stat-Chips bleiben
3. **FacetKonflikte.tsx** -- Wird zu KonfliktBanner (inline im Header, kein eigenes Panel)
4. **FacetAenderungen.tsx** -- Entfällt als eigenständiges Panel
5. **FacetTimeline.tsx** -- Erweitert um Delta-Tags, absorbiert Änderungsinhalte
6. **BentoCard.tsx** -- Neues `changeIndicator`-Prop für subtilen Änderungsdot
7. **demoProject.ts** -- Timeline-Entries um Delta-Infos ergänzen
8. Alle Facetten -- Zuordnung zu Tabs, ggf. kleine Anpassungen

### Design-Orientierung (aus den Referenzbildern)

- Tab-Bar: Zentriert, schlank, uppercase, dezenter Active-Indicator (Linie oder Highlight)
- Bottom-Bar oder Top-Bar-Tabs im Stil von Bild 2 (INTELLIGENCE / GAPS / DOCUMENTS)
- Konflikt-Badge: Kompakt, rot akzentuiert, nicht raumgreifend
- Horizontale Timeline (wie Bild 2: CHRONOLOGY) statt vertikaler Liste

