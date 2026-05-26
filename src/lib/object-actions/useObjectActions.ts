import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Result = { ok: true; data?: unknown } | { ok: false; error: string };

async function callFn(name: string, body: Record<string, unknown>): Promise<Result> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) return { ok: false, error: error.message };
  if (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) {
    return { ok: false, error: String((data as { error: unknown }).error) };
  }
  return { ok: true, data };
}

export function useProjectActions() {
  const [pending, setPending] = useState(false);

  const rename = useCallback(async (id: string, name: string) => {
    if (!name.trim()) return;
    setPending(true);
    const { error } = await supabase.from("projects").update({ name: name.trim() }).eq("id", id);
    setPending(false);
    if (error) {
      toast.error("Umbenennen fehlgeschlagen", { description: error.message });
      return false;
    }
    toast.success("Projekt umbenannt");
    return true;
  }, []);

  const unarchive = useCallback(async (id: string) => {
    const { error } = await supabase.from("projects").update({ status: "active" }).eq("id", id);
    if (error) {
      toast.error("Wiederherstellen fehlgeschlagen", { description: error.message });
      return false;
    }
    toast.success("Projekt wiederhergestellt");
    return true;
  }, []);

  const archive = useCallback(
    async (id: string) => {
      setPending(true);
      const { error } = await supabase.from("projects").update({ status: "archived" }).eq("id", id);
      setPending(false);
      if (error) {
        toast.error("Archivieren fehlgeschlagen", { description: error.message });
        return false;
      }
      toast.success("Projekt archiviert", {
        action: {
          label: "Rückgängig",
          onClick: () => {
            void unarchive(id);
          },
        },
      });
      return true;
    },
    [unarchive],
  );

  const remove = useCallback(async (id: string) => {
    setPending(true);
    const r = await callFn("project-delete", { project_id: id });
    setPending(false);
    if (r.ok === false) {
      toast.error("Löschen fehlgeschlagen", { description: r.error });
      return false;
    }
    toast.success("Projekt gelöscht");
    return true;
  }, []);

  return { rename, archive, unarchive, remove, pending };
}

export function useAssetActions() {
  const [pending, setPending] = useState(false);

  const remove = useCallback(async (id: string) => {
    setPending(true);
    const r = await callFn("asset-delete", { asset_id: id });
    setPending(false);
    if (r.ok === false) {
      toast.error("Löschen fehlgeschlagen", { description: r.error });
      return false;
    }
    toast.success("Datei gelöscht");
    return true;
  }, []);

  const reprocess = useCallback(async (id: string) => {
    setPending(true);
    const r = await callFn("intake-understand", { asset_id: id, retry: true });
    setPending(false);
    if (r.ok === false) {
      toast.error("Erneute Verarbeitung fehlgeschlagen", { description: r.error });
      return false;
    }
    toast.success("Erneute Verarbeitung gestartet");
    return true;
  }, []);

  return { remove, reprocess, pending };
}

export function useFactActions() {
  const retract = useCallback(async (factId: string, reason?: string) => {
    const { data: fact } = await supabase
      .from("canonical_facts")
      .select("id, project_id, content")
      .eq("id", factId)
      .maybeSingle();
    if (!fact) {
      toast.error("Faktum nicht gefunden");
      return false;
    }
    const { data: u } = await supabase.auth.getUser();
    const userId = u?.user?.id;
    if (!userId) return false;

    const { error: uErr } = await supabase
      .from("canonical_facts")
      .update({ valid_until: new Date().toISOString() })
      .eq("id", factId);
    if (uErr) {
      toast.error("Zurückziehen fehlgeschlagen", { description: uErr.message });
      return false;
    }
    await supabase.from("change_events").insert({
      user_id: userId,
      project_id: fact.project_id,
      canonical_fact_id: factId,
      event_type: "discard",
      previous_value: fact.content,
      new_value: reason ? { reason } : null,
    });
    toast.success("Faktum zurückgezogen");
    return true;
  }, []);

  return { retract };
}
