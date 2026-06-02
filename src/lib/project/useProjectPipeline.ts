import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTables } from "@/lib/realtime/useRealtimeTables";

/**
 * Liefert `isProcessing=true` solange für dieses Projekt ein Asset
 * gerade in der Pipeline läuft (parsing/understanding).
 */
export function useProjectPipeline(projectId: string | null): { isProcessing: boolean } {
  const [isProcessing, setIsProcessing] = useState(false);

  const check = useCallback(async () => {
    if (!projectId) {
      setIsProcessing(false);
      return;
    }
    const { data } = await supabase
      .from("assets")
      .select("id")
      .eq("project_id", projectId)
      .or("processing_status.eq.processing,understanding_status.eq.running")
      .limit(1);
    setIsProcessing((data?.length ?? 0) > 0);
  }, [projectId]);

  useEffect(() => {
    check();
  }, [check]);

  useRealtimeTables(
    projectId ? `project-pipeline-${projectId}` : null,
    projectId ? [{ table: "assets", filter: `project_id=eq.${projectId}` }] : [],
    { onTrigger: check, debounceMs: 1000 },
  );

  return { isProcessing };
}
