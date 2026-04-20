import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { IntakePayload } from "./detectInputType";
import type { Database } from "@/integrations/supabase/types";
import { devlog } from "@/lib/devlog/devlog";

type EntityState = "idle" | "hover" | "processing" | "review-ready" | "failed";
type AssetType = Database["public"]["Enums"]["asset_type"];

interface UseIntakeOptions {
  setEntityState?: (s: EntityState) => void;
  setLastImpact?: (s: string) => void;
  onIntake?: (payload: IntakePayload) => void;
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
  const { setEntityState, setLastImpact, onIntake } = options;

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
            const path = `${user.id}/${assetId}/${file.name}`;
            devlog.intake(`upload start: ${file.name}`, { assetId, path, size: file.size });

            const { error: upErr } = await supabase.storage
              .from("intake-files")
              .upload(path, file);
            if (upErr) {
              devlog.error(`storage upload failed: ${file.name}`, upErr);
              throw upErr;
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
            });
            if (insErr) {
              devlog.error("assets insert failed", insErr);
              throw insErr;
            }
            devlog.db("assets insert ok", { assetId, file_name: file.name });

            // Async parsing — kein await blockiert UI
            devlog.edge("invoke intake-process", { assetId });
            supabase.functions
              .invoke("intake-process", { body: { asset_id: assetId } })
              .then((res) => {
                if (res.error) devlog.error("intake-process invoke error", res.error);
                else devlog.edge("intake-process responded", res.data);
              });
          }
          const label = `${payload.files.length} ${payload.files.length === 1 ? "Datei" : "Dateien"}`;
          toast(`${label} aufgenommen`, { description: "wird verarbeitet" });
          setLastImpact?.(`${label} aufgenommen`);
        } else if (payload.type === "url" && payload.url) {
          const { error } = await supabase.from("assets").insert({
            user_id: user.id,
            file_name: payload.url,
            file_type: "other",
            processing_status: "completed",
            metadata: { kind: "url", url: payload.url },
          });
          if (error) {
            devlog.error("link insert failed", error);
            throw error;
          }
          devlog.db("link inserted", { url: payload.url });
          toast("Link aufgenommen");
          setLastImpact?.("Link aufgenommen");
        } else if (payload.type === "text" && payload.text) {
          const preview = payload.text.slice(0, 60);
          const { error } = await supabase.from("assets").insert({
            user_id: user.id,
            file_name: preview,
            file_type: "note",
            processing_status: "completed",
            metadata: { kind: "note", text: payload.text },
          });
          if (error) {
            devlog.error("note insert failed", error);
            throw error;
          }
          devlog.db("note inserted", { length: payload.text.length });
          toast("Notiz aufgenommen");
          setLastImpact?.("Notiz aufgenommen");
        }

        onIntake?.(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Fehler";
        devlog.error(`intake failed: ${msg}`, err);
        toast.error(msg);
        setEntityState?.("failed");
        return;
      }

      window.setTimeout(() => setEntityState?.("idle"), 1200);
    },
    [setEntityState, setLastImpact, onIntake],
  );

  return { intake };
}
