// =============================================================================
//  useProjectData — dünner Daten-Hook.
// -----------------------------------------------------------------------------
//  Lädt 16 Tabellen für ein Projekt + Realtime-Subscription. Liefert nur
//  Roh-Arrays. Kein Mapping. Trennung von Daten und Darstellung (siehe
//  projectViewModel.ts).
// =============================================================================

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeTables, type RealtimeListener } from "@/lib/realtime/useRealtimeTables";
import type { RawProjectData } from "./projectViewModel";

export type DataStatus = "loading" | "ready" | "error";

export interface UseProjectDataResult {
  status: DataStatus;
  raw: RawProjectData | null;
  error: string | null;
  vanished: boolean;
  reload: () => void;
}

export function useProjectData(projectId: string | null | undefined): UseProjectDataResult {
  const { session } = useAuth();
  const [status, setStatus] = useState<DataStatus>("loading");
  const [raw, setRaw] = useState<RawProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vanished, setVanished] = useState(false);

  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!projectId || !userId) return;
    setStatus("loading");
    setError(null);

    try {
      const [
        projectRes,
        snapshotRes,
        outcomeRes,
        deadlinesRes,
        canonicalRes,
        contradictionsRes,
        gapsRes,
        depsRes,
        decisionsRes,
        tasksRes,
        openPointsRes,
        feedbackRes,
        eventsRes,
        topicsRes,
        assetsRes,
        stakeholderRes,
        mergeCandidatesRes,
      ] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
        supabase
          .from("project_state_snapshots")
          .select("summary, created_at, snapshot")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("outcome_signals")
          .select("*")
          .eq("project_id", projectId)
          .order("updated_at", { ascending: false })
          .limit(1),
        supabase
          .from("deadlines")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date", { ascending: true }),
        supabase.from("canonical_facts").select("*").eq("project_id", projectId),
        supabase
          .from("contradictions")
          .select("*")
          .eq("project_id", projectId)
          .eq("resolved", false),
        supabase.from("gap_signals").select("*").eq("project_id", projectId).eq("status", "open"),
        supabase.from("dependencies").select("*").eq("project_id", projectId).eq("resolved", false),
        supabase.from("decisions").select("*").eq("project_id", projectId),
        supabase.from("tasks").select("*").eq("project_id", projectId),
        supabase.from("open_points").select("*").eq("project_id", projectId).eq("status", "open"),
        supabase.from("feedback").select("*").eq("project_id", projectId),
        supabase
          .from("change_events")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("topics").select("*").eq("project_id", projectId).is("merged_into", null),
        supabase
          .from("assets")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
        supabase
          .from("project_stakeholder_links")
          .select("id, role, person_id, organization_id, persons(name, role), organizations(name)")
          .eq("project_id", projectId),
        supabase
          .from("topic_merge_candidates")
          .select(
            "*, source:source_topic_id(id, name, description), target:target_topic_id(id, name, description)",
          )
          .eq("project_id", projectId)
          .eq("status", "open"),
      ]);

      if (projectRes.error || !projectRes.data) {
        setVanished(true);
        setStatus("error");
        setError(projectRes.error?.message ?? "Projekt nicht gefunden");
        setRaw(null);
        return;
      }
      if (projectRes.data.status === "archived") {
        setVanished(true);
        setStatus("error");
        setError("Projekt ist archiviert");
        setRaw(null);
        return;
      }
      setVanished(false);

      setRaw({
        project: projectRes.data,
        snapshot: snapshotRes.data?.[0] ?? null,
        outcome: outcomeRes.data?.[0] ?? null,
        deadlines: deadlinesRes.data ?? [],
        canonical: canonicalRes.data ?? [],
        contradictions: contradictionsRes.data ?? [],
        gaps: gapsRes.data ?? [],
        deps: depsRes.data ?? [],
        decisions: decisionsRes.data ?? [],
        tasks: tasksRes.data ?? [],
        openPoints: openPointsRes.data ?? [],
        feedbackRows: feedbackRes.data ?? [],
        events: eventsRes.data ?? [],
        topics: topicsRes.data ?? [],
        assets: assetsRes.data ?? [],
        stakeholders: stakeholderRes.data ?? [],
        topicMergeCandidates: mergeCandidatesRes.data ?? [],
      });
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }, [projectId, userId]);

  // Initial Load
  useEffect(() => {
    load();
  }, [load]);

  // Realtime: invalidiert auf jede relevante Änderung → Reload (debounced).
  const realtimeListeners = useMemo<RealtimeListener[]>(() => {
    if (!projectId) return [];
    const projectTables = [
      "canonical_facts",
      "change_events",
      "tasks",
      "decisions",
      "deadlines",
      "gap_signals",
      "dependencies",
      "contradictions",
      "assets",
      "outcome_signals",
      "topics",
      "project_stakeholder_links",
      "open_points",
      "feedback",
      "project_state_snapshots",
      "topic_merge_candidates",
    ];
    return [
      ...projectTables.map((table) => ({ table, filter: `project_id=eq.${projectId}` })),
      // Projekt selbst (Rename, Status-Wechsel, Delete) live verfolgen.
      { table: "projects", filter: `id=eq.${projectId}` },
    ];
  }, [projectId]);

  useRealtimeTables(projectId && userId ? `project-${projectId}` : null, realtimeListeners, {
    onTrigger: load,
    debounceMs: 250,
  });

  return { status, raw, error, vanished, reload: load };
}
