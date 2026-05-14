// =============================================================================
//  useProject — dünner Composition-Hook.
// -----------------------------------------------------------------------------
//  Ehemals 514 LOC God-Hook. Jetzt:
//    1. useProjectData()       — lädt Roh-Arrays + Realtime
//    2. buildProjectViewModel  — pure Mapping-Funktion (testbar)
//    3. dieser Hook            — orchestriert beides, gibt altes Interface
// =============================================================================

import { useMemo } from "react";
import type { ProjectViewModel } from "./types";
import { useProjectData } from "./useProjectData";
import { buildProjectViewModel } from "./projectViewModel";

type Status = "loading" | "ready" | "empty" | "error";

interface UseProjectResult {
  status: Status;
  project: ProjectViewModel | null;
  error: string | null;
  /** True wenn das Projekt gelöscht wurde oder nicht (mehr) existiert. */
  vanished: boolean;
}

export function useProject(projectId: string | null | undefined): UseProjectResult {
  const { status: dataStatus, raw, error, vanished } = useProjectData(projectId);

  const composed = useMemo(() => (raw ? buildProjectViewModel(raw) : null), [raw]);

  let status: Status;
  if (dataStatus === "loading") status = "loading";
  else if (dataStatus === "error") status = "error";
  else if (composed?.isEmpty) status = "empty";
  else status = "ready";

  return {
    status,
    project: composed?.vm ?? null,
    error,
    vanished,
  };
}
