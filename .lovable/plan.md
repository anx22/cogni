
## Ziel

Doku zurück auf 5 Dateien, Redesign abgehakt, Sprint-Achse auf den Weg zum Prototyp gerichtet — keine Klein-Klein-Backlogs mehr.

---

## Doku-Operationen

1. **Löschen**
   - `.lovable/plan.md`
   - `docs/redesign/REVIEW.md`
   - `docs/redesign/Cogni.zip`
   - → `docs/redesign/` enthält nur noch `prototype/*.jsx`, `prototype/tokens.css`, `prototype/data.js` und `screenshots/` als visuelle Referenz.

2. **`docs/NOW.md`** — komprimieren, Pläne neu sortieren
   - Status-Säulen: ein knapper Satz „Redesign-Pässe 1–6 durch (Sidebar, Hero, Mittelfeld, Substanz, BatchReview, FaktDrill) — UI-Sprache stimmt jetzt mit `docs/redesign/prototype` + Screenshots überein."
   - Recently completed: ein Eintrag `2026-05-24 — Redesign + Audit-Fixbatch durch`, alle bisherigen Redesign-Detaileinträge entfallen.
   - Pläne komplett umschreiben auf **drei Milestones zum Prototyp** (siehe unten). Kein Backlog-Bullet-Friedhof.

3. **`docs/DECISIONS.md`** — ein knapper Eintrag
   - `2026-05-24 — Redesign abgeschlossen + Doku-Konsolidierung`: Pässe 1–6 + Audit-Fixbatch sind drin. `.lovable/plan.md` und `REVIEW.md` gelöscht, weil Übergangstracker; visuelle Quelle bleibt `prototype/` + `screenshots/`. Stopp-Linie bestätigt (kein `src/lib/**`-Eingriff für Designwünsche). Max 8 Zeilen.

4. **`AGENTS.md`** — Sprint-Zeile auf neuen Fokus („Prototyp-Finalisierung — siehe NOW.md").

---

## Drei Milestones zum Prototyp (Vorschlag für NOW.md → Pläne)

Statt 7 Backlog-Punkte: drei Sprints, jeder mit klarem Outcome.

### M1 — Provenance & Empfehlung schließen
Konflikt-Source-Metadata und cogni-Empfehlung sind heute UI-seitig vorbereitet, aber backend-leer. Ohne sie wirkt Review wie blinder Vergleich.
- `KonfliktVM.faktA/B` von String → Objekt (Datum, Mode, Hint, Quelle)
- `commit-fact` schreibt Empfehlungstext + Begründung in Konflikt-Payload
- BatchReview und FaktDrill rendern beides ohne UI-Änderung (Felder existieren)

### M2 — Entity bleibt überall präsent
Spatial-Continuity-Geste komplettieren. Heute bricht „Entity ist immer da" ab, sobald man ein Projekt öffnet.
- Atmosphären-Streifen Realtime-Hook: Pipeline-aktiv → beschleunigt + review-warm
- Universal-Overlay (⌘+Space): Entity-Bühne über jedem Screen, Kontext-Anker
- AssetOrbit-Retry für `failed`-Chips (kleiner Polish, gehört thematisch hier rein)

### M3 — Antwort-Loops schließen
Heute readonly: Verlauf-Notiz, Feedback-Button, Impact-Pfeile. Damit wird der Prototyp ein geschlossener Kreis — alles Sichtbare ist anklickbar und schreibt zurück.
- Edge Functions `note-create` und `feedback-create`
- ImpactPipelinePanel-Pfeile öffnen die referenzierten Sessions/Items
- Readonly-Hints aus Dialog-Sessions entfernen, sobald Backend live

**Reihenfolge**: M1 → M2 → M3. M1 hebt den größten Produktwert (Review wird informiert statt blind), M2 die Botschaft (Intelligenz mit Projekten), M3 schließt die letzten toten Enden vor Prototyp-Freigabe.

---

## Was nicht passiert
- Kein Code-Eingriff in dieser Runde.
- `PRODUCT.md`, `ARCHITECTURE.md`, `qa-seam-inventar.md` unverändert.
- `docs/redesign/prototype/*` + `screenshots/` bleiben als Charakter-Quelle erhalten.

---

## Ergebnis
- `docs/`: 5 MD-Dateien + `redesign/` als reiner Bildordner.
- `.lovable/plan.md` weg.
- NOW.md trägt drei Milestones statt Bullet-Wüste.
