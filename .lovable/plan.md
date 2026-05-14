# Lücken-Schließung: Verwaltungs-Grundfunktionen

Beim Audit der UI gegen `docs/produkt-gesamt.md` und `docs/implementierung-aktuell.md` fehlen elementare Verwaltungswege. Sie wurden bisher nicht gebaut, weil das Produkt sich „stiller Pflege" verschrieben hatte — aber ohne Löschen / Bereinigen / Konto-Selbsthilfe ist das Tool im Alltag unbrauchbar.

## Was fehlt heute


| Bereich                                     | Status                              | Wirkung                           |
| ------------------------------------------- | ----------------------------------- | --------------------------------- |
| Projekt löschen                             | Kein Pfad in UI                     | Karteileichen, kein Reset möglich |
| Projekt umbenennen außerhalb Project-Screen | Nur inline auf `/projekt/:id`       | Kein Schnellweg vom Grid          |
| Asset löschen / erneut verarbeiten          | Nur Toast-Anzeige in `RecentAssets` | Kein Aufräumen, kein Retry-Knopf  |
| Canonical Fact zurückziehen                 | Nicht vorhanden                     | Falsch übernommene Facts bleiben  |
| Konto / Abmelden                            | Versteckter Button, kein Profil     | Schwer auffindbar                 |
| Bestätigungs-Pattern                        | Fehlt komplett                      | Riskante Aktionen ohne Schutz     |


Alles andere (Pipeline, Mirror, Graphiti, AOL) bleibt unangetastet. Das ist reine Frontend- + leichte Edge-Arbeit.

## Designhaltung

Treu zur Leitlinie: dunkel, glasartig, ruhig. Keine Sidebar, kein Klassik-Menü. Verwaltung erscheint dort, wo das Objekt gerade lebt:

- **Long-press / Rechtsklick** auf einer Kachel → kleines Glas-Popover mit „Umbenennen · Archivieren · Löschen"
- **Hover-Reveal**: dezenter `…`-Punkt oben rechts auf `ProjectTile` und `RecentAssets`-Tile, der dasselbe Popover öffnet
- **Bestätigung als Dialog-Box-Typ** (`destructive_box`), wiederverwendet aus dem bestehenden Dialog-Overlay-System — keine fremde AlertDialog-Optik

## Umfang

### A. Projekt-Verwaltung

- Popover an `ProjectTile` (Hover-`…` + Rechtsklick): Umbenennen, Archivieren, Löschen
- Inline-Rename im Popover (kleiner Input + Enter)
- Archivieren: setzt `projects.status = 'archived'`, blendet aus dem Grid aus, eigener Filter-Reiter „Archiv" als kleine Pille unter dem Grid
- Löschen: harter Delete via Edge Function `project-delete` (Service-Role), entfernt Projekt + abhängige Zeilen (assets, sources, parsed_documents, proposed_facts, canonical_facts, review_cases, dialog_sessions, snapshots, gap_signals, dependencies). Graphiti-Mirror nicht angefasst (späteres Aufräumen separat).
- Bestätigung über `destructive_box` im Dialog-Overlay

### B. Asset-Verwaltung in `RecentAssets`

- Hover-Reveal `…`: Erneut verarbeiten, Löschen, In Projekt verschieben
- „Erneut verarbeiten" ruft `intake-trigger` mit bestehender `asset_id`
- „Löschen" → `destructive_box`-Bestätigung → Edge Function `asset-delete` (Storage-Objekt + DB-Zeile + abhängige `parsed_documents`/`sources`/`proposed_facts`)

### C. Canonical Fact zurückziehen

- Im `VerlaufFeed` und `SubstanzSection` Hover-Reveal `…` mit „Zurückziehen" → setzt `valid_until = now()`, schreibt `change_event` (`event_type='retract'`), blendet im UI aus
- Bestätigung ebenfalls `destructive_box`

### D. Konto-Drawer am Entitäts-Screen

- Rechte obere Ecke: kleiner Avatar-Punkt (Initialen aus E-Mail) statt versteckter Text-Button
- Klick öffnet schmales Glas-Drawer von rechts: E-Mail, „Stiller Modus" (ein/aus, in `app_settings` user-scope), „Abmelden", Link „Datenexport (bald)"
- Ersetzt heutigen `Abmelden`-Button bei Index.tsx Zeile 340

### E. Wiederverwendbare Bausteine

- `useObjectActions(objectType, id)` Hook bündelt rename / archive / delete / retract
- `ConfirmDestructive` als dünner Wrapper um `useDialog` — öffnet `destructive_box`
- `HoverActionsMenu` Komponente für die `…`-Affordance

---

- Graphiti-seitiges Aufräumen gelöschter Facts → eigene Iteration

## Out of Scope (bewusst ausgelassen, falls nichts gegen spricht)

- Multi-Select / Bulk-Aktionen
- Papierkorb / Undo-Fenster (Archiv erfüllt erste Stufe)
- &nbsp;
- Vollständiges Settings-Center

## Technische Details

**Neue Edge Functions**

- `project-delete` — auth-required, prüft `auth.uid() = user_id`, kaskadiert Löschungen via Service-Role
- `asset-delete` — auth-required, gleiche Logik, plus Storage-Objekt
- `fact-retract` — setzt `valid_until`, schreibt `change_event`

**Neue Frontend-Module**

- `src/components/shared/HoverActionsMenu.tsx`
- `src/components/shared/ConfirmDestructive.tsx`
- `src/lib/object-actions/useObjectActions.ts`
- `src/components/dialog/boxes/DestructiveBox.tsx` (falls noch nicht da)
- `src/components/entity/AccountDrawer.tsx`

**Geänderte Dateien**

- `src/components/entity/ProjectTile.tsx` (+ Hover-Affordance, Popover-Anker)
- `src/components/entity/SideGrid.tsx` (Archiv-Filter-Pille, Rerouting)
- `src/components/entity/RecentAssets.tsx` (Hover-Affordance, Popover)
- `src/components/project/VerlaufFeed.tsx` + `SubstanzSection.tsx` (Hover-Affordance auf Fakten)
- `src/pages/Index.tsx` (AccountDrawer statt Text-Button)
- `src/components/dialog/BoxRenderer.tsx` (DestructiveBox-Eintrag)

**DB**

- Keine Schema-Änderung. `projects.status` existiert bereits, `archived` ist gültiger Textwert.
- Optional Migration später, falls wir `status` zu Enum hochziehen wollen — jetzt nicht.

## Reihenfolge

1. Edge Functions `project-delete`, `asset-delete`, `fact-retract`
2. `ConfirmDestructive` + `HoverActionsMenu` + `DestructiveBox`
3. ProjectTile/SideGrid Verwaltung + Archiv-Filter
4. RecentAssets Verwaltung
5. VerlaufFeed/SubstanzSection Retract
6. AccountDrawer

Nach jedem Schritt: kurzer manueller Smoke (anlegen → bearbeiten → löschen → reload).

## Frage vor Start

Eine Entscheidung möchte ich vor Implementierung verbindlich von dir:

**Soll „Löschen" hart sein (DB-Zeile + Storage weg) oder weich (Soft-Delete via `valid_until`/`status='deleted'`, später per Job entsorgt)?**
Ich tendiere zu **hart für Projekte/Assets** und **weich (retract) für Facts**, weil Facts Historie tragen und Projekte im Alltag wirklich verschwinden sollen. Wenn du anders denkst, sag Bescheid bevor ich starte. ja wie vorgeschl hart und weich