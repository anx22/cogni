## Befund aus dem hochgeladenen Stundenlog

Die frühere Aussage „verbuggte Graphiti-Version“ war nicht validiert und ist nach Log-Abgleich sehr wahrscheinlich falsch.

Validierter Root-Cause:

- Graphiti `add_episode` behandelt eine mitgesendete `uuid` **nicht** als neue Episode-ID.
- In `graphiti_core/graphiti.py` steht:

```text
episode = await EpisodicNode.get_by_uuid(self.driver, uuid) if uuid is not None else EpisodicNode(...)
```

- Bedeutet: Wenn wir bei `/messages` eine UUID mitsenden, versucht Graphiti eine bereits existierende Episode mit genau dieser UUID zu laden.
- Weil diese Episode in Neo4j noch nicht existiert, wirft Graphiti:

```text
graphiti_core.errors.NodeNotFoundError: node 4d6b2d5a-4ba8-4bf6-9fe9-e1ad7692f084 not found
```

- Das steht im hochgeladenen Log um `2026-05-13T23:23:52Z` im Deployment `964c597b...`.
- Unser Code sendet aktuell genau diese UUID mit:
  - `supabase/functions/_shared/graphiti.ts` erzeugt `const uuid = input.uuid ?? crypto.randomUUID()`
  - sendet sie in `messages[0].uuid`
  - schreibt dieselbe UUID als `canonical_facts.graphiti_uuid`
- Das ist das falsche Wiring.

## Korrekturplan

### 1. Graphiti-Client korrigieren

In `supabase/functions/_shared/graphiti.ts`:

- `addMessage` darf bei neuen Episoden **keine** `uuid` an `/messages` senden.
- Die Funktion soll künftig nur noch `queued: true` zurückgeben.
- Kommentare anpassen: Der alte Kommentar „Aufrufer muss UUID selbst generieren“ ist falsch für die aktuelle Graphiti-Version.

### 2. Mirror-Logik korrigieren

In `supabase/functions/commit-fact/index.ts`:

- `mirrorToGraphiti` soll nach erfolgreichem Queueing **nicht mehr blind `graphiti_uuid` setzen**.
- Stattdessen:
  - `graphiti_sync_status = queued` bzw. im vorhandenen Provenance-Feld notieren, falls keine Statusspalte existiert.
  - `graphiti_uuid` bleibt `null`, solange Graphiti asynchron keine echte Episode-ID zurückliefert.
- Wenn die bestehende Tabelle keine passende Statusspalte hat, verwenden wir vorerst `provenance.graphiti = { queued: true, queued_at, mode: 'async_no_episode_uuid' }`.

### 3. Test-/Diagnose-Action korrigieren

In `supabase/functions/railway-admin/index.ts`:

- `test-mirror` darf ebenfalls keine UUID mehr in `/messages` senden.
- Der Test darf nicht mehr behaupten, dass `graphiti_uuid` korrekt zurückgeschrieben wurde.
- Der Test soll stattdessen prüfen:
  - `/messages` returned 202
  - nach Wartezeit erscheinen Episodic Nodes in Neo4j
  - `episodes/{group_id}` liefert Einträge

### 4. Validierung nach Änderung

Nach Implementierung:

1. Edge Functions deployen.
2. Einen isolierten `/messages`-Test ohne UUID senden.
3. Neo4j direkt prüfen:

```text
MATCH (n) RETURN labels(n), count(*)
MATCH (e:Episodic) RETURN e.uuid, e.name, e.group_id ORDER BY e.created_at DESC LIMIT 10
```

4. Graphiti `/episodes/{project_id}` prüfen.
5. Wenn Episoden erscheinen, Wave B Reuse-Check erneut starten.

## Wichtige Konsequenz

`graphiti_uuid` kann nicht mehr deterministisch vorab gesetzt werden, weil der Graphiti-Server beim asynchronen `/messages`-Endpoint keine Episode-ID zurückgibt und selbst generiert.

Für echte Rückverknüpfung brauchen wir danach eine von zwei sauberen Optionen:

1. **Correlation über Inhalt/Source Description**: Canonical-Fact-ID in `source_description` oder Body schreiben und Episode später per Neo4j query matchen.
2. **Eigener synchroner Write-Pfad**: AOL-Service/Sidecar ruft `graphiti.add_episode(uuid=None)` direkt auf und gibt die erzeugte Episode-ID zurück.

Für Wave B reicht zunächst Option 1: Graphiti muss überhaupt Episoden/Entities erzeugen; die exakte Rückverknüpfung kann danach gehärtet werden.