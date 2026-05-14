import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { countBy } from "@/lib/utils";
import { toTimestamp } from "@/lib/format/dateFormatters";
import type { DemoProject, ProjectSignal } from "@/data/demoProjects";

const initialOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase() || "·";

interface Counts {
  conflicts: number;
  gaps: number;
  openTasks: number;
  draftDecisions: number;
  upcomingDeadline: boolean;
}

const deriveSignal = (c: Counts): { signal: ProjectSignal; signal2?: ProjectSignal } => {
  const sigs: ProjectSignal[] = [];
  if (c.conflicts > 0) sigs.push("conflict");
  if (c.draftDecisions > 0 || c.upcomingDeadline) sigs.push("review");
  if (c.openTasks > 0 || c.gaps > 0) sigs.push("action");
  if (sigs.length === 0) return { signal: "calm" };
  return { signal: sigs[0], signal2: sigs[1] };
};

export interface UseProjectsResult {
  projects: DemoProject[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export interface UseProjectsOptions {
  includeArchived?: boolean;
}

export function useProjects(options?: UseProjectsOptions): UseProjectsResult {
  const { session } = useAuth();
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.user?.id;
  const includeArchived = options?.includeArchived ?? false;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    let q = supabase
      .from("projects")
      .select("id, name, updated_at, status")
      .eq("user_id", userId);
    if (!includeArchived) q = q.neq("status", "archived");
    const { data: rows, error: pErr } = await q.order("updated_at", { ascending: false });

    if (pErr) {
      setError(pErr.message);
      setProjects([]);
      setLoading(false);
      return;
    }
    if (!rows || rows.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const ids = rows.map((r) => r.id);
    const [conflicts, gaps, tasks, decisions, deadlines] = await Promise.all([
      supabase
        .from("contradictions")
        .select("project_id")
        .eq("user_id", userId)
        .eq("resolved", false)
        .in("project_id", ids),
      supabase
        .from("gap_signals")
        .select("project_id")
        .eq("user_id", userId)
        .eq("status", "open")
        .in("project_id", ids),
      supabase
        .from("tasks")
        .select("project_id, status")
        .eq("user_id", userId)
        .in("project_id", ids),
      supabase
        .from("decisions")
        .select("project_id, status")
        .eq("user_id", userId)
        .in("project_id", ids),
      supabase
        .from("deadlines")
        .select("project_id, due_date")
        .eq("user_id", userId)
        .in("project_id", ids),
    ]);

    const conflictMap = countBy(conflicts.data, (r) => r.project_id);
    const gapMap = countBy(gaps.data, (r) => r.project_id);
    const taskMap = countBy(tasks.data, (r) =>
      r.status !== "done" && r.status !== "completed" ? r.project_id : undefined,
    );
    const decisionMap = countBy(decisions.data, (r) =>
      r.status === "draft" ? r.project_id : undefined,
    );

    const now = Date.now();
    const soon = now + 7 * 86400000;
    const deadlineMap = new Map<string, boolean>();
    deadlines.data?.forEach((r) => {
      if (!r.project_id) return;
      const t = toTimestamp(r.due_date);
      if (t > now && t < soon) deadlineMap.set(r.project_id, true);
    });

    const mapped: DemoProject[] = rows.map((r) => {
      const counts: Counts = {
        conflicts: conflictMap.get(r.id) ?? 0,
        gaps: gapMap.get(r.id) ?? 0,
        openTasks: taskMap.get(r.id) ?? 0,
        draftDecisions: decisionMap.get(r.id) ?? 0,
        upcomingDeadline: deadlineMap.get(r.id) ?? false,
      };
      const { signal, signal2 } = deriveSignal(counts);
      const openCount = counts.openTasks + counts.draftDecisions + counts.gaps;
      return {
        id: r.id,
        name: r.name,
        initial: initialOf(r.name),
        lastChangedAt: r.updated_at,
        openCount: openCount > 0 ? openCount : undefined,
        signal,
        signal2,
        archived: r.status === "archived",
      };
    });

    setProjects(mapped);
    setLoading(false);
  }, [userId, includeArchived]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: projects + signaltragende Tabellen → debounced Reload
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
  useRealtimeTables(
    userId ? `projects-list-${userId}` : null,
    userId
      ? [
          { table: "projects", filter: `user_id=eq.${userId}` },
          { table: "tasks", filter: `user_id=eq.${userId}` },
          { table: "decisions", filter: `user_id=eq.${userId}` },
          { table: "deadlines", filter: `user_id=eq.${userId}` },
          { table: "gap_signals", filter: `user_id=eq.${userId}` },
          { table: "contradictions", filter: `user_id=eq.${userId}` },
        ]
      : [],
    { onTrigger: load, debounceMs: 250 },
  );

  return { projects, loading, error, reload: load };
}

