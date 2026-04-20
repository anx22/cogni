## Plan: Signale auflösen + Briefing-Audit der App

### Teil A — Signale-Auflösung (deine Entscheidung)

**Ausgangslage**
`SignalStrip` zeigt Gaps + Dependencies in Lage-Zone. Briefing sagt: gehören in **Handlungsbedarf**. Heute sind sie ohnehin doppelt — in `demoProject.handlungsbedarf` existieren schon `h3, h4, h10, h11` mit `objektTyp: "gap"` bzw. `"dependency"`.

**Änderungen**

1. `LageZone.tsx` — `SignalStrip`-Import + `<SignalStrip />` raus.
2. `SignalStrip.tsx` — Datei löschen.
3. `demoProject.ts` — sicherstellen, dass **alle** Gaps (g1–g3) und **alle** Dependencies (dep1–dep3) als Handlungsbedarf-Items existieren. Aktuell fehlen `g3` und `dep2`. Ergänzen mit korrektem Arbeitsmodus (Gaps → `klaeren`, Dependencies → `klaeren`/`pruefen` je nach Typ, Blocker-Flag bei `blockiert_durch`).
4. `HandlungsbedarfList.tsx` — keine Strukturänderung, nur Daten profitieren. Optional: ObjectToken-Visualisierung für `gap`/`dependency` schärfen, damit Herkunft sichtbar bleibt.
5. Nicht entfernt: `gaps` und `dependencies` Felder im demoProject (Datenmodell bleibt — sind später Quelle, aus der Handlungsbedarf abgeleitet wird; nur die separate UI-Anzeige verschwindet).

---

### Teil B — Audit: Erfindungen vs. Briefing

Beim Durchgehen aller relevanten Komponenten gegen `00-06-PRODUKTKERN.md` und `08-DESIGN-UND-UI-SPECS.md` gefunden:

#### 1. „Signale" als Zone — Erfindung

Briefing kennt nur Lage / Handlungsbedarf / Verlauf / Substanz. „Signale" existiert nicht.
→ Wird mit Teil A entfernt.

#### 2. ConflictBanner in Lage UND Handlungsbedarf — teilweise Erfindung

Briefing: „Konflikte sind kein normales Panel. Sie sind kritischer Zustand, **Banner, Marker oder Alarm**." Banner in Lage ist also korrekt. Aber: in `handlungsbedarf` sitzen `h1, h2` als „entscheiden"-Items — gleicher Konflikt zweimal.
→ Briefing-konform ist: **Banner in Lage** (Hinweis) + **Item in Handlungsbedarf** (Arbeit). Aktuell so umgesetzt. **Keine Erfindung, aber Doppelung sollte bewusst sein** (Banner = „Achtung", Handlungsbedarf-Item = „arbeite daran"). Empfehlung: lassen, aber Banner-Klick und Handlungsbedarf-Klick öffnen denselben Dialog → Konsistenz prüfen.

#### 3. „Outcome / Zielbild" als eigenständige Karte in Lage — korrekt

Briefing erwähnt explizit „falls vorhanden: Zielbild oder Erfolgskriterium" als Lage-Bestandteil. **Keine Erfindung.**

#### 4. „Stakeholder-Popover" als Meta-Chip — korrekt

Briefing: „Stakeholder und Projektdaten sitzen hier reduziert im Header." **Keine Erfindung.**

#### 5. VerlaufFeed — Filter-Chips „Alle / Änderungen / Entscheidungen / Konflikte / Uploads / Milestones" — leichte Eigeninterpretation

Briefing erwähnt „Typfilter" als Pattern. **Konform**, aber Filter-Set wurde frei gewählt. Kein Problem.

#### 6. Side-Grid (rechts, Platzhalter) im Entity-Screen — Erfindung

Briefing nennt nur **eine** orbital-/asset-Zone. Aktuell zwei Side-Grids (links Projekte, rechts leerer Platzhalter).  
→ wurde im nachhinein entschiede, ist ok  
  
7. Top-Right-Button „Projekte" im Entity-Screen — leichte Erfindung

Briefing 4.5: „zurückhaltender Projektzugang" — ist also vorgesehen. Aktuelle Umsetzung als kleiner Text-Link **konform**. **Keine Erfindung.**

#### 8. „Aktionsbox" im Dialog-System

Briefing definiert Aktionsbox explizit. Aktuell kaum genutzt (Eingabe/Auswahl/Konflikt schließen selbst ab). **Keine Erfindung**, nur faktisch redundant — aber der Code-Kommentar dokumentiert das bereits sauber.

#### 9. Demo-Daten-Feld `outcome.nogos` als „No-Go"-Chips

Briefing sagt nur „Erfolgskriterium / Zielbild". „No-Go" ist eine eigenständige Erweiterung.
→ Plausibel als negatives Pendant zum Erfolgskriterium, aber **Mini-Erfindung**. Behalten oder verwerfen — deine Entscheidung.

ist ok

#### 10. Lagebild als Hero-Card mit linkem Akzentbalken

Briefing: „Lagetext-Block" als Pattern in Lage-Komponenten. **Konform.**



---

### Empfohlene Korrekturen in dieser Runde

**Pflicht (Erfindungen entfernen):**

- A: Signale-Auflösung (komplett oben beschrieben)
  &nbsp;

**Empfehlung (Briefing-konform schärfen):**

**Zur Diskussion offen lassen:**

- B9: „No-Gos" — bewusst behalten 

### Betroffene Dateien

- `src/components/project/LageZone.tsx`
- `src/components/project/shared/SignalStrip.tsx` (löschen)
- `src/data/demoProject.ts` (Gaps/Deps vollständig in Handlungsbedarf spiegeln)
- `src/pages/Index.tsx` (rechtes SideGrid raus)
- `src/components/project/ProjectScreen.tsx` (Spalten-Verhältnis)