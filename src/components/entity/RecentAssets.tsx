import { useEffect, useState } from "react";
import { FileText, Link as LinkIcon, StickyNote, Image as ImageIcon, File } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import HoverActionsMenu from "@/components/shared/HoverActionsMenu";
import ConfirmDestructive from "@/components/shared/ConfirmDestructive";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAssetActions } from "@/lib/object-actions/useObjectActions";

type Asset = Database["public"]["Tables"]["assets"]["Row"];

const ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  pptx: FileText,
  image: ImageIcon,
  eml: FileText,
  note: StickyNote,
  other: File,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted-foreground/40",
  processing: "bg-primary animate-pulse",
  completed: "bg-emerald-500/70",
  failed: "bg-red-500/70",
};

interface Props {
  isDragActive?: boolean;
}

const COLS = 4;
const ROWS = 5;
const LIMIT = COLS * ROWS;

const RecentAssets = ({ isDragActive }: Props) => {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      if (mounted && data) setAssets(data);
    };
    load();

    const channel = supabase
      .channel("assets-recent")
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClick = async (a: Asset) => {
    const meta = (a.metadata as Record<string, unknown>) ?? {};

    // AOL-Run-Status nachladen (falls vorhanden) — gibt dem User echte
    // Sichtbarkeit auf den LangGraph-Pipeline-Zustand pro Asset.
    const { data: run } = await supabase
      .from("aol_runs")
      .select("status, current_node, error, ended_at")
      .eq("asset_id", a.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const aolBits = run
      ? [
          `AOL: ${run.status}${run.current_node ? ` · ${run.current_node}` : ""}`,
          run.error ? `Fehler: ${(run.error as { message?: string })?.message ?? "unbekannt"}` : null,
        ].filter(Boolean).join("\n")
      : null;

    if (meta.kind === "url") {
      toast(`Link · ${meta.url ?? a.file_name}`, aolBits ? { description: aolBits } : undefined);
    } else if (meta.kind === "note") {
      toast("Notiz", {
        description: `${String(meta.text ?? "").slice(0, 140)}${aolBits ? `\n\n${aolBits}` : ""}`,
      });
    } else {
      toast(a.file_name, {
        description: `Status: ${a.processing_status}${aolBits ? `\n${aolBits}` : ""}`,
      });
    }
  };

  const isUrl = (a: Asset) => (a.metadata as Record<string, unknown>)?.kind === "url";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 animate-float-in [animation-delay:350ms] opacity-0 [animation-fill-mode:forwards]",
        isDragActive && "pointer-events-none opacity-30 transition-opacity duration-300",
      )}
    >
      <div
        className="rounded-3xl p-6 backdrop-blur-sm bg-[hsl(var(--surface-1)/0.3)]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.08) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <div
          className="grid gap-x-3 gap-y-4"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 3.5rem)`,
            gridTemplateRows: `repeat(${ROWS}, 4.5rem)`,
          }}
        >
          {assets.map((a) => {
            const Icon = isUrl(a) ? LinkIcon : ICONS[a.file_type] ?? File;
            return <AssetTile key={a.id} asset={a} Icon={Icon} onClick={() => handleClick(a)} />;
          })}
        </div>
      </div>
      <span className="text-[10px] tracking-widest uppercase text-muted-foreground/40">
        Letzte Inputs
      </span>
    </div>
  );
};

export default RecentAssets;

interface AssetTileProps {
  asset: Asset;
  Icon: typeof FileText;
  onClick: () => void;
}

const AssetTile = ({ asset, Icon, onClick }: AssetTileProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const actions = useAssetActions();

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        title={asset.file_name}
        className={cn(
          "relative w-14 h-14 rounded-2xl flex items-center justify-center",
          "bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))]",
          "transition-all duration-300 hover:scale-105 text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon size={18} strokeWidth={1.5} />
        <span
          className={cn(
            "absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full",
            STATUS_COLORS[asset.processing_status] ?? "bg-muted-foreground/40",
          )}
        />
      </button>
      <div className="absolute -top-1 -right-1">
        <HoverActionsMenu label={`Aktionen für ${asset.file_name}`}>
          <DropdownMenuItem onClick={() => actions.reprocess(asset.id)}>
            Erneut verarbeiten
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-rose-400 focus:text-rose-300"
            onClick={() => setConfirmDelete(true)}
          >
            Löschen…
          </DropdownMenuItem>
        </HoverActionsMenu>
      </div>
      <ConfirmDestructive
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`„${asset.file_name}" löschen?`}
        description="Die Datei und alle daraus extrahierten Vorschläge werden entfernt. Bereits übernommene Fakten bleiben bestehen — sie verlieren nur ihre Quelle."
        onConfirm={() => actions.remove(asset.id)}
      />
    </div>
  );
};
