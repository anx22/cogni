import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { IntakePayload } from "./detectInputType";
import type { Database } from "@/integrations/supabase/types";
import { devlog } from "@/lib/devlog/devlog";
import { sanitizeStorageName } from "./sanitizeStorageName";
import { pollAolRun, pollAolRunByAsset, type AolRunSnapshot } from "@/lib/pipeline/pollAolRun";
import { submitNote } from "./submitNote";

/**
 * Beobachtet einen Pipeline-Lauf (entweder per run_id oder per asset_id) und
 * spiegelt den Fortschritt in den Entity-State / Toast. Wird fire-and-forget
 * gestartet, damit der Aufruf von `intake()` nicht blockiert.
 */
function trackPipeline(
  source: { runId?: string | null; assetId?: string | null },
  setEntityState?: (s: "idle" | "hover" | "processing" | "review-ready" | "failed") => void,
) {
  const onUpdate = (snap: AolRunSnapshot) => {
    devlog.edge("pipeline progress", {
      runId: snap.id,
      status: snap.status,
      node: snap.current_node,
    });
  };
  const promise = source.runId
    ? pollAolRun(source.runId, { onUpdate })
    : source.assetId
      ? pollAolRunByAsset(source.assetId, { onUpdate })
      : Promise.resolve({ status: "aborted" as const, snapshot: null });

  promise.then((res) => {
    devlog.edge("pipeline terminal", { status: res.status, runId: res.snapshot?.id });
    if (res.status === "failed") {
      const msg = res.snapshot?.error?.message ?? "Verstehen fehlgeschlagen";
      toast.error("Verstehen fehlgeschlagen", { description: msg.slice(0, 160) });
      setEntityState?.("failed");
    } else if (res.status === "timeout") {
      toast.warning("Verstehen läuft länger als erwartet", {
        description: "Die Box erscheint, sobald die Pipeline fertig ist.",
      });
    }
    // 'completed' wird via Realtime auf dialog_sessions in Index.tsx
    // zu 'review-ready' — hier nichts zusätzlich tun.
  });
}

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed";
type AssetType = Database["public"]["Enums"]["asset_type"];

interface UseIntakeOptions {
  setEntityState?: (s: EntityState) => void;
  setLastImpact?: (s: string) => void;
  onIntake?: (payload: IntakePayload) => void;
  /**
   * Wenn gesetzt, wird das Asset direkt diesem Projekt zugeordnet.
   * → intake-trigger überspringt die Zuordnungsbox (mode='explicit').
   */
  projectId?: string | null;
}

function fileTypeFromName(name: string): AssetType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "pptx" || ext === "ppt") return "pptx";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (ext === "eml" || ext === "msg") return "eml";
  return "other";
}

export function useIntake(options: UseIntakeOptions = {}) {
  const { setEntityState, setLastImpact, onIntake, projectId } = options;

  const intake = useCallback(
    async (payload: IntakePayload) => {
      devlog.intake("intake() called", {
        type: payload.type,
        files: payload.files?.map((f) => ({ name: f.name, size: f.size })),
        url: payload.url,
        textPreview: payload.text?.slice(0, 80),
      });

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        devlog.warn("intake", "intake aborted — no user");
        toast.error("Bitte zuerst anmelden");
        return;
      }

      setEntityState?.("processing");

      try {
        if (payload.type === "file" && payload.files?.length) {
          for (const file of payload.files) {
            const assetId = crypto.randomUUID();
            const safeName = sanitizeStorageName(file.name);
            const path = `${user.id}/${assetId}/${safeName}`;
            devlog.intake(`upload start: ${file.name}`, {
              assetId,
              path,
              safeName,
              size: file.size,
            });

            const { error: upErr } = await supabase.storage.from("intake-files").upload(path, file);
            if (upErr) {
              devlog.error(`storage upload failed: ${file.name}`, upErr);
              const msg = /invalid key/i.test(upErr.message)
                ? `Upload abgelehnt: Dateiname „${file.name}" enthält ungültige Zeichen`
                : `Upload fehlgeschlagen: ${upErr.message}`;
              throw new Error(msg);
            }
            devlog.intake(`upload done: ${file.name}`, { assetId });

            const { error: insErr } = await supabase.from("assets").insert({
              id: assetId,
              user_id: user.id,
              file_name: file.name,
              file_type: fileTypeFromName(file.name),
              file_size: file.size,
              storage_path: path,
              processing_status: "pending",
              project_id: projectId ?? null,
              metadata: { original_name: file.name },
            });
            if (insErr) {
              devlog.error("assets insert failed", insErr);
              throw insErr;
            }
            devlog.db("assets insert ok", { assetId, file_name: file.name });

            // Async parsing — kein await blockiert UI. Polling auf den
            // späteren aol_runs-Eintrag (intake-process triggert intake-trigger
            // intern, das den Run anlegt).
            devlog.edge("invoke intake-process", { assetId });
            supabase.functions
              .invoke("intake-process", { body: { asset_id: assetId } })
              .then((res) => {
                if (res.error) devlog.error("intake-process invoke error", res.error);
                else devlog.edge("intake-process responded", res.data);
              });
            trackPipeline({ assetId }, setEntityState);
          }
          const label = `${payload.files.length} ${payload.files.length === 1 ? "Datei" : "Dateien"}`;
          toast(`${label} aufgenommen`, { description: "wird verarbeitet" });
          setLastImpact?.(`${label} aufgenommen`);
        } else if (payload.type === "url" && payload.url) {
          const { data, error } = await supabase
            .from("assets")
            .insert({
              user_id: user.id,
              file_name: payload.url,
              file_type: "other",
              processing_status: "completed",
              understanding_status: "pending",
              project_id: projectId ?? null,
              metadata: { kind: "url", url: payload.url },
            })
            .select("id")
            .single();
          if (error) {
            devlog.error("link insert failed", error);
            throw error;
          }
          devlog.db("link inserted", { url: payload.url, id: data.id });
          toast("Link aufgenommen", { description: "wird verstanden" });
          setLastImpact?.("Link aufgenommen");
          devlog.edge("invoke intake-trigger (link)", { assetId: data.id });
          supabase.functions
            .invoke("intake-trigger", { body: { asset_id: data.id } })
            .then((res) => {
              if (res.error) {
                devlog.error("intake-trigger error", res.error);
                return;
              }
              devlog.edge("intake-trigger responded", res.data);
              const runId = (res.data as { run_id?: string } | null)?.run_id ?? null;
              trackPipeline({ runId, assetId: data.id }, setEntityState);
            });
        } else if (payload.type === "text" && payload.text) {
          const result = await submitNote(payload.text, { projectId: projectId ?? null });
          if (!result) throw new Error("Notiz konnte nicht gespeichert werden");
          toast("Notiz aufgenommen", { description: "wird verstanden" });
          setLastImpact?.("Notiz aufgenommen");
          trackPipeline({ runId: result.runId, assetId: result.assetId }, setEntityState);
        }

        onIntake?.(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Fehler";
        devlog.error(`intake failed: ${msg}`, err);
        toast.error(msg);
        setEntityState?.("failed");
        return;
      }

      // Kein blinder Timeout mehr — der Zustand wird ab jetzt aus
      // Realtime-Events (assets/dialog_sessions) in Index.tsx gesteuert.
    },
    [setEntityState, setLastImpact, onIntake, projectId],
  );

  return { intake };
}
