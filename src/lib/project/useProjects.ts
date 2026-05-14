import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

export function useProjects() {
  const { session } = useAuth();
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: rows } = await supabase
      .from("projects")
      .select("id, name, updated_at, status")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    if (!rows) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const ids = rows.map((r) => r.id);
    if (ids.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

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

    const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    const conflictMap = new Map<string, number>();
    const gapMap = new Map<string, number>();
    const taskMap = new Map<string, number>();
    const decisionMap = new Map<string, number>();
    const deadlineMap = new Map<string, boolean>();

    conflicts.data?.forEach((r) => r.project_id && inc(conflictMap, r.project_id));
    gaps.data?.forEach((r) => r.project_id && inc(gapMap, r.project_id));
    tasks.data?.forEach((r) => {
      if (r.project_id && r.status !== "done" && r.status !== "completed") inc(taskMap, r.project_id);
    });
    decisions.data?.forEach((r) => {
      if (r.project_id && r.status === "draft") inc(decisionMap, r.project_id);
    });
    const now = Date.now();
    const soon = now + 7 * 86400000;
    deadlines.data?.forEach((r) => {
      if (!r.project_id) return;
      const t = new Date(r.due_date).getTime();
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
      };
    });

    setProjects(mapped);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: jede projects-Änderung → Reload (gefiltert per user_id)
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => load(), 300);
    };
    const channel = supabase
      .channel(`projects-list-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects", filter: `user_id=eq.${userId}` },
        trigger,
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return { projects, loading };
}
