# Plan: LangSmith Prompt Hub als Tuning-Ebene

## Ziel

Prompts (heute hardcoded in `agentConfig.ts`) leben künftig in **LangSmith Prompt Hub**. Du editierst sie online, versionierst sie dort, und die App zieht die jeweils aktive Version — ohne Deploy. Bei Ausfall fällt der Code auf die eingebaute Default-Version zurück (kein Single Point of Failure).

## Was bleibt wie es ist

- AOL-Service auf Railway, Lovable AI Gateway, Graphiti, Unstructured: **unverändert**.
- Bestehende Modell-Calls in `agentClient.ts` (Extract / Assignment): Logik bleibt, nur die System-Prompt-Quelle ändert sich.
- LangSmith-Tracing (Free-Tier): bleibt unverändert.

## Was sich ändert

### 1. Zwei Prompts in LangSmith Prompt Hub anlegen

Manuell einmalig im LangSmith UI (oder automatisiert per API beim ersten Run):  
AUtomatisiert!

- `produktintelligenz/extract-facts` — Inhalt = aktueller `AGENT_SYSTEM_PROMPT`
- `produktintelligenz/suggest-assignment` — Inhalt = aktueller `ASSIGNMENT_SYSTEM_PROMPT`

Beide als **Chat-Prompts** mit optionalen Variablen (`{graph_hint}` etc.), damit das Verschmelzen mit Kontext im Hub gepflegt werden kann.

### 2. Neuer Shared-Loader: `_shared/promptHub.ts`

Eine zentrale Funktion:

```text
getPrompt(name, { variables, fallback }) → { system: string, version: string }
```

Verhalten:

- 1. Lookup im **In-Memory-Cache** (TTL 5 Min). Wenn Treffer → zurück.
- 2. GET `https://api.smith.langchain.com/commits/{owner}/{name}/latest` mit `LANGSMITH_API_KEY`.
- 3. Variablen (`{graph_hint}`, …) per simplem `String.replace` substituieren.
- 4. Bei HTTP-Fehler / Timeout (>2s) → `fallback`-String zurückgeben, Warning loggen, **niemals werfen**.
- 5. `version` (Commit-Hash) zurückgeben → in LangSmith-Trace als Tag mitschicken, damit man im Trace sieht, welche Prompt-Version lief.

### 3. `agentClient.ts` umstellen

- `AGENT_SYSTEM_PROMPT` und `ASSIGNMENT_SYSTEM_PROMPT` bleiben in `agentConfig.ts` als **Fallback-Defaults**.
- `callExtractFacts` / `callSuggestAssignment` ziehen die System-Message via `getPrompt(...)` und setzen den `version`-Hash als `metadata.prompt_version` im LangSmith-Trace-Header.

### 4. Auch im AOL-Service (Python) nutzbar machen

Der Hub ist für Python (`langchain.hub.pull`) sogar leichter. Damit Welle B später dieselbe Tuning-Ebene hat:

- `aol-service/app/prompts.py` — analoger Loader mit Cache + Fallback
- Verwendung optional, erst wenn Welle B Prompts schreibt.

### 5. Secret-Check

`LANGSMITH_API_KEY` ist bereits gesetzt (railway-admin nutzt ihn). Kein neuer Secret-Eintrag nötig.

## Was du danach kannst

- Im LangSmith UI Prompts editieren → sofort live (max. 5 Min Cache).
- Versionsverlauf, Diff, Rollback per Klick.
- A/B-Tests pro Prompt-Version (LangSmith Native).
- Im Trace siehst du: welche Prompt-Version + welcher Input + welche Latency + welche Kosten.

## Was es **nicht** kann (Erwartungsmanagement)

- **Tool/Function-Schemas** (z. B. die JSON-Schemas für `extract_facts`) bleiben im Code. Hub managt nur Text. Das ist okay — Schemas ändern sich selten, Prompts ständig.
- LangSmith Free = 5k Traces/Monat. Prompt-Hub-Pulls zählen **nicht** als Traces. Kein Kostenrisiko.

## Risiken & Mitigation


| Risiko                                          | Mitigation                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| LangSmith down → App down                       | Fallback auf Code-Default, nie werfen                                        |
| Cache zu lang → Edits sichtbar verzögert        | TTL 5 Min; manueller `/cache-bust`-Endpoint im railway-admin                 |
| Falsche Variable im Hub-Prompt → Runtime-Fehler | `getPrompt` validiert: alle `{var}` müssen substituiert sein, sonst Fallback |


## Schritte

1. `_shared/promptHub.ts` schreiben (Loader + Cache + Fallback + Version-Tag).
2. `agentClient.ts`: System-Prompts via Loader holen, Version in Trace-Metadata.
3. `agentConfig.ts`: Bestehende Konstanten als `_FALLBACK` umbenennen, exportieren.
4. Manuell in LangSmith UI: zwei Prompts mit identischem Inhalt anlegen.
5. Smoke-Test: ein Asset durchschicken, Trace prüfen → `prompt_version` muss auftauchen.
6. (Optional, Welle B) `aol-service/app/prompts.py` analog.

## Aufwand

~30–60 Min Code + 5 Min UI-Setup. Kein neues Secret. Keine Schema-Migration. Keine neuen Kosten.