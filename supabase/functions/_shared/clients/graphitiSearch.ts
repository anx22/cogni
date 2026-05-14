// =============================================================================
//  _shared/clients/graphitiSearch.ts
// -----------------------------------------------------------------------------
//  Dünner, projektscoped Wrapper um Graphiti `/search`. Zweck: B-W1 Linker
//  bekommt eine semantische Evidenz-Schicht über dem reinen Title-Match.
//
//  Returnt eine normalisierte Liste { fact, uuid, name }, weil das alles ist,
//  was Graphiti-/search aktuell semantisch liefert (siehe SearchResult.facts).
//  Source-Description-Mapping zurück auf canonical_fact.id ist NICHT Teil von
//  /search — das übernimmt der Linker, indem er Hits gegen den existing-Array
//  matcht (Token-Overlap / Substring).
//
//  Fehlertoleranz: Wenn Graphiti nicht konfiguriert oder unerreichbar ist,
//  wird `null` zurückgegeben — der Caller fällt dann auf Title-Match zurück.
// =============================================================================

import {
  GraphitiHttpError,
  GraphitiUnavailableError,
  isGraphitiConfigured,
  search as graphitiSearch,
} from "../graphiti.ts";

export interface GraphitiHit {
  fact: string;
  uuid: string;
  name?: string;
}

export interface SearchEntitiesArgs {
  project_id: string;
  query: string;
  k?: number;
}

export type SearchEntitiesFn = (args: SearchEntitiesArgs) => Promise<GraphitiHit[] | null>;

export const searchEntities: SearchEntitiesFn = async (
  { project_id, query, k = 5 },
) => {
  if (!isGraphitiConfigured()) return null;
  const trimmed = (query ?? "").trim();
  if (!trimmed) return [];
  try {
    const res = await graphitiSearch({
      query: trimmed,
      project_ids: [project_id],
      max_facts: Math.min(Math.max(k, 1), 25),
    });
    const facts = Array.isArray(res?.facts) ? res.facts : [];
    return facts
      .map((f) => ({
        fact: typeof f.fact === "string" ? f.fact : "",
        uuid: typeof f.uuid === "string" ? f.uuid : "",
        name: typeof f.name === "string" ? f.name : undefined,
      }))
      .filter((f) => f.fact && f.uuid);
  } catch (e) {
    if (e instanceof GraphitiUnavailableError || e instanceof GraphitiHttpError) {
      return null;
    }
    return null;
  }
};
