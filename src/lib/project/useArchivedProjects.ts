import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeTables } from "@/lib/realtime/useRealtimeTables";

export interface ArchivedProject {
  id: string;
  name: string;
  archivedAt: string;
}

/**
 * Schlanke Liste archivierter Projekte — nur id/name/updated_at, keine
 * Signal-Counts (die Archiv-Ansicht braucht keinen Lebenszustand).
 * Lädt erst, wenn `enabled` true ist (Lazy-Expand in der Sidebar).
 */
export function useArchivedProjects(enabled: boolean): {
  projects: ArchivedProject[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !enabled) return;
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("id, name, updated_at")
      .eq("user_id", userId)
      .eq("status", "archived")
      .order("updated_at", { ascending: false });
    setProjects((data ?? []).map((r) => ({ id: r.id, name: r.name, archivedAt: r.updated_at })));
    setLoading(false);
  }, [userId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTables(
    userId && enabled ? `archived-projects-${userId}` : null,
    userId && enabled ? [{ table: "projects", filter: `user_id=eq.${userId}` }] : [],
    { onTrigger: load, debounceMs: 300 },
  );

  return { projects, loading, reload: load };
}
