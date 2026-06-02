import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";
import { toast } from "sonner";

export async function retryIntake(assetId: string): Promise<void> {
  toast("Wird nochmal versucht", { description: "Analyse läuft erneut" });
  try {
    const { error } = await supabase.functions.invoke("intake-understand", {
      body: { asset_id: assetId, retry: true },
    });
    if (error) throw error;
    devlog.edge("retryIntake ok", { assetId });
  } catch (err) {
    devlog.error("retryIntake failed", err);
    toast.error("Analyse konnte nicht gestartet werden");
  }
}
