

## Audit-Bericht Projekt-Detail-Screen + Doku-Update

### Methodik
Abgleich ProjectScreen + Subkomponenten + demoProject gegen `docs/produkt-gesamt.md` (4-Rollen-Modell, Kernsignale, Designprinzipien) und `docs/geplant.md` (Phase 3.5 Soll).

---

### Befunde — Was passt

| Bereich | Status |
|---|---|
| 4-Rollen-Struktur (Lage / Handlungsbedarf / Verlauf / Substanz) | ✓ vollständig vorhanden |
| Hierarchie (nicht gleichrangig): Lagebild Hero, Konflikt/Ziel sekundär, Mittelteil 60/40, Substanz full-width | ✓ |
| Provenance auf Items (SourceMarker, quelle-Felder) | ✓ |
| Delta-Tags im Verlauf (neu/ersetzt/bestaetigt/widersprochen) | ✓ |
| Konflikt-Banner in Lage | ✓ |
| Outcome Signal (Erfolgskriterium + No-Gos) | ✓ |
| Handlungsbedarf gruppiert in entscheiden/klären/umsetzen/prüfen | ✓ |
| Verlauf mit Typfiltern | ✓ |
| Themen-Drilldown + Dokumentliste mit Versionen | ✓ |

---

### Befunde — Lücken & Inkonsistenzen

**A. Datenmodell-Signale unterrepräsentiert in der UI**
1. **Gap Signals**: in `demoProject.gaps` definiert (3 Stück mit Wirkung, Betrifft, Lebensdauer), aber **nirgends im Screen sichtbar**. Sie tauchen nur indirekt als zwei Handlungsbedarf-Items (`gap` ObjektTyp) auf — die Wirkungs-/Lebensdauer-Information geht verloren. Vision verlangt aber „Lücken sind Kernfunktion, keine Nebenfunktion".
2. **Dependency Signals**: in `demoProject.dependencies` definiert (3 Stück, blockiert_durch / wartet_auf / haengt_ab_von), **null UI-Sichtbarkeit**. Komplette Datenklasse ohne Rendering.
3. **Stakeholder-Liste**: `demoProject.stakeholder` (6 Personen mit Rolle/Org) existiert, aber im Screen wird nur die **Anzahl** in Lage gezeigt. Vision sagt „Stakeholder-Kontext" als Lage-Bestandteil — Namen/Rollen fehlen.

**B. Interaktivität — tote Buttons**
4. ProjectTile-Klick auf der Entität öffnet immer dasselbe `demoProject` (kein ID-Routing) — bekannt, Phase 4.
5. **Themen-Buttons** in Substanz: visuell als Drilldown-Einstieg gestaltet (`→`-Pfeil, hover-State), haben aber **keinen onClick** → funktional tot, optisch versprechend.
6. **Dokument-Zeilen** in Substanz: hover-State, aber **kein onClick** → kein Preview, kein Drilldown.
7. **Handlungsbedarf-Row Buttons** „Bearbeiten" + „Inline antworten": **keine Handler**, keine State-Änderung, kein Toast-Feedback.
8. **Verlauf-Einträge**: kein Klick auf Eintrag (z.B. um Quelle zu öffnen oder Kontext zu sehen) — nur SourceMarker-Button ist klickbar, aber auch ohne Handler.
9. **SourceMarker** generell: button-Element, **kein onClick** → wirkt klickbar, ist es nicht.
10. **Konflikt-Einträge im Banner**: keine Interaktion möglich (Vision: „Konflikt → öffnet Konfliktbox im Dialog-Overlay" — Phase 4, aber wenigstens Hover/Cursor-Klärung fehlt).
11. **Meta-Chips** (Termin, Stakeholder, Budget): rein dekorativ — vertretbar, aber Stakeholder-Zahl könnte zu Stakeholder-Liste expandieren.

**C. Feedback-/Korrektur-Kanal fehlt**
12. Vision: „Feedback und Korrektur sind allgegenwärtig". Im Projektscreen gibt es **keinen sichtbaren Feedback/Korrektur-Affordance** auf Lagebild, Verlauf-Einträgen, Themen, Dokumenten. Nur Handlungsbedarf hat „Inline antworten" (ohne Funktion).

**D. Handlungsbedarf — Modell unvollständig abgebildet**
13. Vision: Handlungsbedarf vereint „offene Punkte, Aufgaben, unbestätigte Entscheidungen, **Konflikte, Gaps, Dependencies**, arbeitsrelevantes Feedback". Aktuell: Konflikte und Gaps tauchen via `objektTyp` auf, **Dependencies komplett nicht** als Handlungsbedarf-Item.
14. Counter im Header: „9 offen · 2 Blocker" — `stats.handlungsbedarf` ist hardcoded `9`, könnte aus `items.length` kommen (DRY).

**E. Verlauf — Zustände fehlen**
15. Filter „milestone" existiert, aber `ereignisTyp` enthält nur die Werte aus den Verlauf-Einträgen. Demo hat genau 1 milestone (`v8`). OK.
16. Kein Indikator, ob ein Verlaufseintrag noch reviewbar/widersprüchlich ist (Vision: „bestätigte Entscheidungen, Konfliktereignisse" — Konflikt-Eintrag `v4` ist nur via Delta-Tag „widersprochen" markiert, ohne Verbindung zum aktiven Konflikt #k1/k2).

**F. Substanz — Sortierung & Status**
17. Themen-Karten zeigen Counts, aber kein Status-Signal (z.B. „enthält Konflikt" / „enthält Gap"). Vision: Themen sollen Drilldown in projektinterne Substanz sein — aktuell statische Counts ohne Bewertung.
18. Dokumente: keine Sortierung (Datum? Typ?), keine Versionshistorie-Aufruf.

**G. Header / Back-Navigation**
19. „← Entität" als fixed top-left ist okay, aber bei Scroll auf Surface-1 kontrastschwach. Funktional korrekt.
20. Kein Breadcrumb, kein Projekt-Identifier sichtbar bei Scroll (Title verschwindet).

**H. Logische Konsistenz**
21. `stats.konflikte = 2`, `konflikte.length = 2` — passt.
22. `stats.handlungsbedarf = 9`, `handlungsbedarf.length = 9` — passt aber redundant.
23. `stats.stakeholder = 6`, `stakeholder.length = 6` — passt aber redundant.
24. Themen-Counts (`entscheidungen`, `offenePunkte`, `dokumente`) sind hardcoded, **kein Bezug** zu tatsächlichen Items im Datensatz → reine Demo-Zahlen.

---

### Empfohlene Korrekturen (priorisiert)

**P1 — Vision-kritische Sichtbarkeit (Gap & Dependency)**
- **Lage-Zone erweitern**: kompakter „Signale"-Streifen unter Lagebild oder als 3. Spalte neben Konflikt/Ziel: Gap-Counter + Dependency-Counter mit Badge-Stil analog Konflikt.
- **Handlungsbedarf**: Dependency-Items als eigene `objektTyp: "dependency"` Einträge ergänzen (z.B. unter „klären" oder „prüfen").
- **Optional Substanz-Erweiterung**: kleiner Block „Offene Signale" mit allen 3 Gaps (Titel + Wirkung + Lebensdauer) und 3 Dependencies (Quelle → Ziel + Typ) — als kompakte Listen unter Themen oder als eigener Substanz-Subblock. Alternativ in der rechten Spalte des Mittelteils zwischen Verlauf und Handlungsbedarf einblenden.

**P2 — Tote Interaktionen aktivieren (mit Toast als Phase-4-Brücke)**
- Themen-Karten: onClick → Toast „Drilldown für Thema X kommt mit Phase 4 (Dialog-Overlay)".
- Dokument-Zeilen: onClick → Toast „Preview kommt mit Phase 6".
- Handlungsbedarf-Buttons (Bearbeiten / Inline antworten): onClick → Toast „Dialog-Overlay (Phase 4)".
- SourceMarker: onClick → Toast mit Quellen-Info.
- Konflikt-Items: hover cursor-pointer + onClick → Toast.
- So bleibt UX konsistent (kein Klick versickert), Phase-4-Aufhängung explizit dokumentiert.

**P3 — Feedback-Affordance**
- Kleiner „Feedback/Korrektur"-Button (Icon + Text) auf Lagebild und auf Verlauf-Einträgen (hover-revealed). onClick → Toast/Phase-4-Hinweis.

**P4 — Stakeholder sichtbar machen**
- In Lage: hinter Stakeholder-Zahl ein Popover/expandable mit Liste (Name, Rolle, Org). Oder als kleiner Avatar-Stack neben dem Chip.

**P5 — Konsistenz-Cleanup**
- `stats.handlungsbedarf` / `stats.stakeholder` aus `items.length` ableiten statt hardcoden.
- Handlungsbedarf-Header-Counter konsistent.

**P6 — Verlauf ↔ Konflikt Verbindung**
- Verlauf-Eintrag mit Delta „widersprochen" sollte optisch auf zugehörigen Konflikt verweisen können (Klick auf Eintrag → Toast „Konflikt #k2 öffnen, Phase 4").

---

### Doku-Update (nach Code-Korrekturen)

Anzupassen:
- `docs/implementierung-aktuell.md`:
  - Status Phase 3.5 von „NÄCHSTER SCHRITT" auf **abgeschlossen** setzen.
  - Implementierte Komponenten auflisten (LageZone, HandlungsbedarfList, VerlaufFeed, SubstanzSection, shared/ConflictBanner/DeltaTag/SourceMarker/ObjectToken).
  - Phase 3.6 „Visual Hierarchy & Layout-Revise" + „Side-Grids Entity-Screen" als zusätzlich abgeschlossen ergänzen.
  - Bekannte Phase-4-Lücken explizit listen (Buttons als Toast-Brücken).
- `docs/geplant.md`:
  - Phase 3.5 entfernen / als done markieren.
  - Nächster Schritt = Phase 4 Dialog-Overlay.
  - Phase 4 um Übergangs-Punkt „bestehende Toast-Brücken durch echte Box-Aufrufe ersetzen" ergänzen.
- `mem://features/produkt-prinzipien.md` (Memory): Hinweis ergänzen, dass Gap- und Dependency-Signale auch im Projekt-Screen sichtbar sein müssen, nicht nur im Datenmodell.

---

### Out of Scope
- Echtes Dialog-Overlay (Phase 4)
- Echte Drilldown-Routes für Themen/Dokumente (Phase 4+)
- Backend-Anbindung der Demo-Daten
- Inhaltliche Veränderung der Demo-Daten (außer Ergänzung Dependency-Items in Handlungsbedarf für P1)

---

### Erwartetes Ergebnis
Der Projekt-Screen reflektiert die Produktvision vollständig: Konflikte, **Gaps und Dependencies** sind sichtbar als eigenständige Kernsignale; jede klickbare Fläche reagiert (mindestens Toast-Brücke); Stakeholder-Kontext erschließbar; Feedback/Korrektur-Affordance präsent. Doku ist auf Stand.

