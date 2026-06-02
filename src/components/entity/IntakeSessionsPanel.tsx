// =============================================================================
//  IntakeSessionsPanel — rechtes Home-Panel.
//  Vertikale Liste im ProjectTile-Look, inline scrollbar, Typ-Icons je Asset.
//  + Failed-Tiles mit Retry (C2), + HoverCard Asset-Preview (C3)
// =============================================================================

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  StickyNote,
  Link as LinkIcon,
  Image as ImageIcon,
  Mic,
  Mail,
  FileText,
  Presentation,
  File,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealtimeTables } from "@/lib/realtime/useRealtimeTables";
import { useDialog } from "@/components/dialog/DialogProvider";
import { formatRelative } from "@/lib/format/relativeTime";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { retryIntake } from "@/lib/intake/retryIntake";

type Session = Database["public"]["Tables"]["dialog_sessions"]["Row"];
type Asset = Database["public"]["Tables"]["assets"]["Row"];

type TileStatus = "pending" | "open" | "closed" | "rejected" | "empty" | "failed";

interface SessionTile {
  key: string;
  sessionId?: string;
  assetId?: string;
  status: TileStatus;
  count: number;
  firstName: string;
  fileType?: string;
  fileSize?: number | null;
  resolved?: number;
  total?: number;
  createdAt: string;
  projectId?: string | null;
}

const LIMIT = 30;

const STATUS_BADGE: Record<TileStatus, { label: string; className: string }> = {
  pending: {
    label: "läuft",
    className: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
  },
  open: {
    label: "offen",
    className: "bg-primary/15 text-primary ring-1 ring-primary/30 animate-pulse",
  },
  closed: {
    label: "fertig",
    className: "bg-emerald-500/15 text-emerald-300/90 ring-1 ring-emerald-400/25",
  },
  rejected: {
    label: "ignoriert",
    className: "bg-foreground/5 text-muted-foreground/60 ring-1 ring-foreground/10",
  },
  empty: {
    label: "leer",
    className: "bg-foreground/5 text-muted-foreground/50 ring-1 ring-foreground/10",
  },
  failed: {
    label: "fehlgeschlagen",
    className: "bg-destructive/15 text-destructive ring-1 ring-destructive/30",
  },
};

const iconForType = (t?: string): LucideIcon => {
  switch (t) {
    case "note":
      return StickyNote;
    case "url":
    case "link":
      return LinkIcon;
    case "image":
      return ImageIcon;
    case "audio":
      return Mic;
    case "eml":
    case "email":
      return Mail;
    case "pdf":
    case "doc":
    case "docx":
      return FileText;
    case "pptx":
      return Presentation;
    default:
      return File;
  }
};

const formatSize = (bytes: number | null | undefined) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const sessionStatusToTile = (s: Session): TileStatus => {
  if (s.status === "cancelled") return "rejected";
  if (s.status === "completed") return "closed";
  if ((s.resolved_boxes ?? 0) >= (s.total_boxes ?? 0) && (s.total_boxes ?? 0) > 0) return "closed";
  return "open";
};

const FAILED_STATUSES = ["failed", "rate_limited", "payment_required"];

interface Props {
  isDragActive?: boolean;
}

const IntakeSessionsPanel = (_props: Props) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const { openSessionFromDB } = useDialog();

  const load = useCallback(async () => {
    const [sRes, aRes] = await Promise.all([
      supabase
        .from("dialog_sessions")
        .select("*")
        .eq("trigger_type", "intake")
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIMIT * 2),
    ]);
    if (sRes.data) setSessions(sRes.data);
    if (aRes.data) setAssets(aRes.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTables("intake-sessions-panel", [{ table: "dialog_sessions" }, { table: "assets" }], {
    onTrigger: load,
  });

  const handleRetry = useCallback((assetId: string) => retryIntake(assetId), []);

  const tiles: SessionTile[] = useMemo(() => {
    const triggerIds = new Set(sessions.map((s) => s.trigger_ref_id).filter(Boolean));

    // Pending assets (not yet in a session, still processing)
    const pendingAssets = assets.filter(
      (a) =>
        !triggerIds.has(a.id) &&
        !FAILED_STATUSES.includes(a.understanding_status) &&
        (a.understanding_status === "pending" ||
          a.understanding_status === "running" ||
          a.processing_status === "pending" ||
          a.processing_status === "processing"),
    );

    // Failed assets (no session, failed status)
    const failedAssets = assets.filter(
      (a) => !triggerIds.has(a.id) && FAILED_STATUSES.includes(a.understanding_status),
    );

    const pendingGroups: SessionTile[] = [];
    const sortedPending = [...pendingAssets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    let currentGroup: Asset[] = [];
    const flush = () => {
      if (currentGroup.length === 0) return;
      pendingGroups.push({
        key: `pending-${currentGroup[0].id}`,
        status: "pending",
        count: currentGroup.length,
        firstName: currentGroup[0].file_name,
        fileType: currentGroup[0].file_type,
        createdAt: currentGroup[0].created_at,
      });
    };
    for (const a of sortedPending) {
      if (currentGroup.length === 0) {
        currentGroup.push(a);
        continue;
      }
      const ref = new Date(currentGroup[0].created_at).getTime();
      const t = new Date(a.created_at).getTime();
      if (Math.abs(ref - t) < 5000) currentGroup.push(a);
      else {
        flush();
        currentGroup = [a];
      }
    }
    flush();

    const failedTiles: SessionTile[] = failedAssets.map((a) => ({
      key: `failed-${a.id}`,
      assetId: a.id,
      status: "failed" as const,
      count: 1,
      firstName: a.file_name,
      fileType: a.file_type,
      fileSize: a.file_size,
      createdAt: a.created_at,
      projectId: a.project_id,
    }));

    const sessionTiles: SessionTile[] = sessions.map((s) => {
      const linkedAsset = assets.find((a) => a.id === s.trigger_ref_id);
      return {
        key: `session-${s.id}`,
        sessionId: s.id,
        assetId: linkedAsset?.id,
        status: sessionStatusToTile(s),
        count: 1,
        firstName: linkedAsset?.file_name ?? s.summary ?? "Verstehens-Lauf",
        fileType: linkedAsset?.file_type,
        fileSize: linkedAsset?.file_size,
        resolved: s.resolved_boxes ?? 0,
        total: s.total_boxes ?? 0,
        createdAt: s.created_at,
        projectId: linkedAsset?.project_id,
      };
    });

    return [...pendingGroups, ...failedTiles, ...sessionTiles]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, LIMIT);
  }, [sessions, assets]);

  const handleClick = (t: SessionTile) => {
    if (t.status === "failed" && t.assetId) {
      handleRetry(t.assetId);
      return;
    }
    if (t.status === "pending" || !t.sessionId) return;
    openSessionFromDB(t.sessionId);
  };

  return (
    <div className="flex flex-col items-center gap-3 animate-float-in [animation-delay:350ms] opacity-0 [animation-fill-mode:forwards]">
      <div
        className="rounded-3xl p-7 backdrop-blur-sm bg-[hsl(var(--surface-1)/0.3)]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.08) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {tiles.length === 0 ? (
          <div className="w-[180px] h-[76px] flex items-center justify-center text-[10px] text-muted-foreground/40 tracking-wide">
            Noch nichts da
          </div>
        ) : (
          <ScrollArea className="h-[324px] w-[192px] pr-3">
            <div className="flex flex-col gap-3">
              {tiles.map((t) => {
                const clickable =
                  t.status === "failed" || (t.status !== "pending" && !!t.sessionId);
                const Icon = iconForType(t.fileType);
                const open = (t.total ?? 0) - (t.resolved ?? 0);
                const meta = [
                  formatRelative(t.createdAt),
                  t.status === "open" && open > 0 ? `${open} offen` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const badge = STATUS_BADGE[t.status];

                const tileContent = (
                  <button
                    key={t.key}
                    onClick={() => handleClick(t)}
                    disabled={!clickable}
                    title={t.firstName}
                    aria-label={t.firstName}
                    className={cn(
                      "group relative w-[180px] min-h-[76px] rounded-2xl px-3 py-2.5",
                      "flex items-center gap-3 text-left",
                      "bg-[hsl(var(--surface-2))]",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_-4px_rgba(0,0,0,0.4)]",
                      "transition-all duration-300 ease-out",
                      "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
                      clickable
                        ? "hover:bg-[hsl(var(--surface-3))] hover:-translate-y-0.5 cursor-pointer"
                        : "cursor-default",
                      (t.status === "closed" || t.status === "rejected") && "opacity-75",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                        "bg-[hsl(var(--surface-1))]",
                        t.status === "failed"
                          ? "text-destructive/80 group-hover:text-destructive"
                          : "text-primary/80 group-hover:text-primary",
                        "transition-colors",
                      )}
                      aria-hidden
                    >
                      {t.status === "failed" ? (
                        <RefreshCw size={13} strokeWidth={1.5} />
                      ) : t.count > 1 ? (
                        <span className="text-[11px] font-medium tracking-wide">{t.count}</span>
                      ) : (
                        <Icon size={14} strokeWidth={1.5} />
                      )}
                    </span>

                    <span className="flex flex-col min-w-0 flex-1 gap-1">
                      <span className="text-[13px] font-medium text-foreground/90 truncate leading-tight">
                        {t.firstName}
                      </span>
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={cn(
                            "shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-medium tracking-wide uppercase",
                            badge.className,
                          )}
                        >
                          {badge.label}
                        </span>
                        {meta && (
                          <span className="text-[10px] text-muted-foreground/50 truncate leading-tight">
                            {meta}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );

                // HoverCard for completed/failed tiles with asset info
                if (t.status !== "pending" && (t.fileSize || t.fileType)) {
                  return (
                    <HoverCard key={t.key} openDelay={400}>
                      <HoverCardTrigger asChild>{tileContent}</HoverCardTrigger>
                      <HoverCardContent
                        side="left"
                        className="w-56 bg-[hsl(var(--surface-2))] border-border/30 p-3"
                      >
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-foreground/90 truncate">
                            {t.firstName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                            {t.fileType && <span className="uppercase">{t.fileType}</span>}
                            {t.fileSize && <span>{formatSize(t.fileSize)}</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground/50">
                            {formatRelative(t.createdAt)}
                          </p>
                          {t.status === "failed" && (
                            <p className="text-[10px] text-destructive/80 mt-1">
                              Klick zum erneuten Versuch
                            </p>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                }

                return tileContent;
              })}
            </div>
          </ScrollArea>
        )}
      </div>
      <span className="text-[10px] tracking-widest uppercase text-muted-foreground/40">Intake</span>
    </div>
  );
};

export default IntakeSessionsPanel;
