import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { IntakePayload } from "./detectInputType";
import type { Database } from "@/integrations/supabase/types";

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
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        toast.error("Bitte zuerst anmelden");
        return;
      }

      setEntityState?.("processing");

      try {
        if (payload.type === "file" && payload.files?.length) {
          for (const file of payload.files) {
            const assetId = crypto.randomUUID();
            const path = `${user.id}/${assetId}/${file.name}`;

            const { error: upErr } = await supabase.storage
              .from("intake-files")
              .upload(path, file);
            if (upErr) throw upErr;

            const { error: insErr } = await supabase.from("assets").insert({
              id: assetId,
              user_id: user.id,
              file_name: file.name,
              file_type: fileTypeFromName(file.name),
              file_size: file.size,
              storage_path: path,
              processing_status: "pending",
            });
            if (insErr) throw insErr;

            // Async parsing — kein await blockiert UI
            supabase.functions.invoke("intake-process", { body: { asset_id: assetId } });
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
          if (error) throw error;
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
          if (error) throw error;
          toast("Notiz aufgenommen");
          setLastImpact?.("Notiz aufgenommen");
        }

        onIntake?.(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Fehler";
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
