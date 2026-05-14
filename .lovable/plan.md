## Was am letzten Plan vorbei lief

Der letzte Plan hat Realtime, Projektanlage, Overlay-Gating und Projekt-Lifecycle adressiert — aber gleichzeitig zentrale Verhaltens- und Logikfehler im Overlay, in den Aktionen und im Projekt-Screen unangetastet gelassen. Hier die scharf geschnittenen Mängel, gefunden beim erneuten Lesen aller relevanten Dateien.

## Kritische Bugs (echte Fehlfunktionen, kein Geschmack)

1. **„Erneut verarbeiten" ist tot.**
   `useAssetActions.reprocess` ruft `intake-trigger` auf — diese Edge Function existiert nicht. Vorhanden: `intake-process`, `intake-understand`. Jeder Klick auf „Erneut verarbeiten" failt still. Korrekter Fallback: `intake-understand` mit `{ asset_id, retry: true }` (analog zu `Index.handleRetry` und `IntakeSessionsPanel.handleRetry`).

2. **AuswahlBox commitet nicht ans Backend.**
   `Übernehmen` setzt nur `updateBoxState("bestaetigt")` lokal, ruft aber nie `commitBox(...)`. Die Entscheidung verlässt den Browser nie, kein `commit-fact`, kein `change_event`, kein `review_case.user_decision`. Genauso fehlerhaft: **AktionsBox** (nur `updateBoxState`, kein `commitBox`).

3. **KontextBox „Quelle öffnen" hat keinen onClick.**
   Reine Deko. Entweder echten Link öffnen (aus `box.payload.source_url`/`quelle`) oder Button entfernen.

4. **GapBox / KonfliktBox / AktionsBox schließen das ganze Overlay vorzeitig.**
   Nach `commitBox` rufen sie `setTimeout(closeDialog, 250)`. Wenn die Session weitere offene Boxen hat, bricht der ganze Lauf ab. Die Auto-Close-Logik im Provider regelt das bereits korrekt, sobald alle Boxen final sind — die per-Box-Closes müssen weg.

5. **ProjectScreen im `ready`-State hat keine Projektaktionen.**
   Kein Umbenennen, kein Archivieren, kein Löschen, kein Re-Ingest direkt aus dem Projekt heraus. Inline-Edit am Namen existiert nur im `empty`-State und auch dort über `contentEditable` ohne Pending/Validierung. Resultat: User muss zurück zur Entität, um simpelste Pflege zu machen.

6. **Archivierte Projekte sind unerreichbar.**
   `useProjects` filtert `status != 'archived'` raus. Es gibt keinen Archiv-View, keine Toggle „Archiv anzeigen", keinen Wiederherstellen-Pfad außerhalb des (gefilterten) Tile-Menüs. Archivieren ist effektiv eine Sackgasse.

7. **Pending-Zustände werden nicht angezeigt.**
   `useProjectActions`/`useAssetActions` exportieren `pending`, aber kein Konsument benutzt es. Doppelklicks auf „Löschen" / „Archivieren" / „Umbenennen" feuern mehrfach.

8. **DialogOverlay zeigt nicht, zu welchem Projekt der Dialog gehört.**
   Header zeigt `session.context` (z. B. „Verstehen") und `anlass` — aber nie den Projektnamen, auch nicht nach erfolgter Zuordnung. User verliert Anker bei mehreren parallelen Sessions.

## Vergessene Basics

9. **Kein Mobile/Tablet-Fallback.**
   `SideGrid` ist `hidden lg:block`, `IntakeSessionsPanel` ist `hidden xl:block`. Unter xl gibt es keine Projektliste, unter lg überhaupt keine Navigation. Auf Tablet/Phone ist die App unbedienbar — keine Schublade, kein Drawer, nichts.

10. **Kein Projekt-Wechsler innerhalb von ProjectScreen.**
    Nur „← Entität". Zwischen zwei Projekten zu springen erfordert immer den Umweg über die Entität.

11. **Fehlerzustand im Projektpanel ist unsichtbar.**
    `useProjects` liefert jetzt `error`, aber `SideGrid` zeigt nur `isEmpty`. Bei tatsächlichem Lade-Fehler sieht der User „Erstes Projekt anlegen" — irreführend.

12. **Inline-Rename am Tile ist fragil.**
    Verlässt sich auf `onBlur`. Klick aufs Aktionsmenü kann den Blur-Commit verschlucken; kein Pending-State; Escape funktioniert, aber Doppel-Submit per Enter+Blur ist möglich.

13. **AccountDrawer ist halb leer.**
    Nur Logout. Keine Anzeige des aktuellen Projektkontexts, keine offenen Sessions, kein „Datenexport" (im Footer angekündigt, nicht umgesetzt).

14. **InputOverlay weiß nichts vom Kontext.**
    Auf der Entität-Seite gibt es keine Anzeige „du legst gerade global ab → Zuordnung kommt im Overlay". Auf einer Projektseite kein Hinweis „diese Notiz/dieser Link wird direkt diesem Projekt zugeordnet". Komplett unsichtbarer Modus-Wechsel.

15. **Keine Tastaturbedienung für die Projektliste insgesamt.**
    Pfeiltasten innerhalb einer Seite funktionieren, aber Page-Wechsel (Pos1/Ende, PgUp/PgDn) und Enter-zum-Öffnen sind nicht verkabelt.

16. **`onChanged?.()` an `ProjectTile` ist toter Code.**
    Wird im `SideGrid` nie übergeben. Realtime deckt es ab — aber Prop dann auch entfernen oder konsequent benutzen.

## Plan

### A. Bug-Fix-Block (muss vor allem anderen)

A1. `useAssetActions.reprocess` → `intake-understand` mit `{ asset_id, retry: true }`. Optional zusätzlich `parsed: false` resetten, falls Pipeline das braucht.

A2. AuswahlBox + AktionsBox: echtes `commitBox(box.id, "confirm", payload)` rufen, lokales `updateBoxState` rausziehen (übernimmt der Provider). KontextBox: `Quelle öffnen` entweder mit `onClick={() => window.open(box.payload.source_url, "_blank")}` oder Button entfernen, wenn keine URL existiert.

A3. KonfliktBox / GapBox / AktionsBox: `setTimeout(closeDialog, 250)` entfernen. Auto-Close des Providers übernimmt das, sobald alle Boxen final sind.

A4. `useObjectActions`: konsumierende Komponenten (`ProjectTile`, `RecentAssets`, `IntakeSessionsPanel`) müssen `pending` lesen und Buttons währenddessen disabled rendern.

### B. Overlay-Anker und Kontextklarheit

B1. `DialogOverlay`-Header zusätzlich Projektname zeigen, sobald entweder `session.project_id` gesetzt ist oder eine Zuordnungsbox bestätigt wurde. Quelle: `dialog_sessions.project_id` → bei Load mitliefern und im Header verlinken auf `/projekt/:id`.

B2. `InputOverlay` zeigt einen kleinen Kontext-Hinweis oben:
- auf `/`: „Wird global aufgenommen — Zuordnung kommt gleich"
- auf `/projekt/:id`: „Wird direkt zu „<Projektname>" hinzugefügt"

### C. ProjectScreen vollwertig machen

C1. Header bekommt ein dezentes Aktionsmenü (gleiches Pattern wie `HoverActionsMenu` am Tile): Umbenennen, Archivieren, Löschen, „Erneut verstehen" (für letztes Asset), „Snapshot anzeigen". Pending-Zustände sichtbar.

C2. Inline-Rename am Titel auch im `ready`-State, nicht nur `empty`. Konsistent über `useProjectActions.rename`, nicht roh per `supabase.from(...)`.

C3. Bei Projekt-Wechsel: schmaler Project-Switcher (Combobox, ⌘K) im Header, der `useProjects` als Quelle nutzt.

### D. Archiv und Lifecycle

D1. `useProjects` bekommt einen Toggle `includeArchived`. SideGrid zeigt eine kleine Toggle-Pille „Archiv anzeigen" (Default aus). Archivierte Tiles bleiben erkennbar (aktuell schon `archived` opacity).

D2. Archivieren mit Undo-Toast (sonner action) für 5 s.

D3. Löschen: bei aktivem Projekt (Route-Match) zuerst zur Entität navigieren, dann löschen — sonst rendert ProjectScreen kurz ins Leere bevor `vanished` greift.

### E. Fehlerzustand sichtbar machen

E1. `SideGrid` rendert bei `error` einen klar erkennbaren Zustand mit „Erneut versuchen", der `reload()` aus `useProjects` aufruft.

E2. `useProjects.error` wird in `Index` nicht geschluckt — kleines Toast einmalig pro Fehler-ID, nicht pro Render.

### F. Mobile/Tablet (Pflicht-Basis)

F1. Unter `lg`: AccountDrawer-Header zusätzlich mit Burger-Icon links, das einen `Sheet` mit Projektliste (ProjectTile-Vertikal) und Intake-Sessions öffnet. Inhalt = `SideGrid`-Inhalt + `IntakeSessionsPanel`-Inhalt, untereinander.

F2. Entity Orb skaliert; Drop-Zonen funktionieren weiterhin.

### G. Tastatur

G1. ProjectTile: Enter/Space öffnet, bereits vorhanden. PgUp/PgDn wechselt Page in `SideGrid`. Pos1/Ende springt zum ersten/letzten Tile.

G2. Globaler ⌘/Ctrl+K öffnet einen Quick-Switcher (Projekte + offene Intake-Sessions).

### H. Cleanup

H1. `onChanged?.()` Prop aus `ProjectTile` raus, alle Aufrufer angepasst (Realtime deckt ab).

H2. `RecentAssets` — Query optional auf aktuelle `userId` filtern (RLS reicht, aber Performance/Cache-Klarheit).

## Reihenfolge

A → B → C → D → E → F → G → H. A ist ein Korrektheitsblock, ohne den keine Aussage über „funktioniert" möglich ist. B/C heben die Bedienbarkeit auf den im letzten Plan bereits gemeinten Stand. D/E/F/G/H sind die echten Basics, die der letzte Plan einfach übersprungen hat.

## Nicht im Scope

- Keine Architekturänderung der Overlay-Pipeline.
- Keine neue Sidebar / kein Dashboard.
- Kein Umbau Graphiti/RAG.
- Keine Änderung an `client.ts` oder generierten Typen.

## Dateien (erwartet)

- `src/lib/object-actions/useObjectActions.ts` (A1, A4)
- `src/components/dialog/boxes/AuswahlBox.tsx`, `AktionsBox.tsx`, `KontextBox.tsx`, `GapBox.tsx`, `KonfliktBox.tsx` (A2, A3)
- `src/components/dialog/DialogOverlay.tsx`, `src/lib/dialog/loadSession.ts` (B1)
- `src/components/entity/InputOverlay.tsx` (B2)
- `src/components/project/ProjectScreen.tsx`, `LageZone.tsx` (C1, C2)
- neuer `ProjectSwitcher.tsx` (C3, G2)
- `src/lib/project/useProjects.ts`, `src/components/entity/SideGrid.tsx` (D1, E1)
- `src/components/entity/ProjectTile.tsx`, `src/components/entity/RecentAssets.tsx`, `src/components/entity/IntakeSessionsPanel.tsx` (A4, H1)
- `src/pages/Index.tsx` (E2, F1)
- neuer `MobileNavSheet.tsx` (F1)
- `src/components/entity/AccountDrawer.tsx` (Header-Burger, optional)
