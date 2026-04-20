// =============================================================================
//  IntakeSessionsPanel — rechtes Home-Panel.
//  Zeigt Intake-Sessions als persistente, klickbare Kacheln statt einzelne Files.
//  Pending-Bündel: Assets ohne dialog_session werden nach Zeitfenster gruppiert.
// =============================================================================

import { useEffect, useState, useMemo } from "react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useDialog } from "@/components/dialog/DialogProvider";
import type { Database } from "@/integrations/supabase/types";

type Session = Database["public"]["Tables"]["dialog_sessions"]["Row"];
type Asset = Database["public"]["Tables"]["assets"]["Row"];

type TileStatus = "pending" | "open" | "closed" | "empty";

interface SessionTile {
  key: string;
  sessionId?: string;
  status: TileStatus;
  count: number;
  firstName: string;
  resolved?: number;
  total?: number;
  createdAt: string;
}

const COLS = 4;
const ROWS = 5;
const LIMIT = COLS * ROWS;

const STATUS_DOT: Record<TileStatus, string> = {
  pending: "bg-amber-400 animate-pulse",
  open: "bg-primary",
  closed: "bg-emerald-500/70",
  empty: "bg-muted-foreground/40",
};

const sessionStatusToTile = (s: Session): TileStatus => {
  if (s.status === "completed" || s.status === "cancelled") return "closed";
  if ((s.resolved_boxes ?? 0) >= (s.total_boxes ?? 0) && (s.total_boxes ?? 0) > 0) return "closed";
  return "open";
};

interface Props {
  isDragActive?: boolean;
}

const IntakeSessionsPanel = ({ isDragActive }: Props) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const { openSessionFromDB } = useDialog();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
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
      if (!mounted) return;
      if (sRes.data) setSessions(sRes.data);
      if (aRes.data) setAssets(aRes.data);
    };
    load();

    const channel = supabase
      .channel("intake-sessions-panel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dialog_sessions" },
        () => load(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const tiles: SessionTile[] = useMemo(() => {
    // Welche Asset-IDs sind bereits durch eine Session als trigger_ref_id abgedeckt?
    const triggerIds = new Set(sessions.map((s) => s.trigger_ref_id).filter(Boolean));

    // Pending: Assets ohne dazugehörige Session, gruppiert in 5s-Fenstern
    const pendingAssets = assets.filter(
      (a) =>
        !triggerIds.has(a.id) &&
        (a.understanding_status === "pending" ||
          a.understanding_status === "running" ||
          a.processing_status === "pending" ||
          a.processing_status === "processing"),
    );

    const pendingGroups: SessionTile[] = [];
    const sortedPending = [...pendingAssets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    let currentGroup: Asset[] = [];
    for (const a of sortedPending) {
      if (currentGroup.length === 0) {
        currentGroup.push(a);
        continue;
      }
      const ref = new Date(currentGroup[0].created_at).getTime();
      const t = new Date(a.created_at).getTime();
      if (Math.abs(ref - t) < 5000) {
        currentGroup.push(a);
      } else {
        pendingGroups.push({
          key: `pending-${currentGroup[0].id}`,
          status: "pending",
          count: currentGroup.length,
          firstName: currentGroup[0].file_name,
          createdAt: currentGroup[0].created_at,
        });
        currentGroup = [a];
      }
    }
    if (currentGroup.length > 0) {
      pendingGroups.push({
        key: `pending-${currentGroup[0].id}`,
        status: "pending",
        count: currentGroup.length,
        firstName: currentGroup[0].file_name,
        createdAt: currentGroup[0].created_at,
      });
    }

    const sessionTiles: SessionTile[] = sessions.map((s) => {
      // Asset-Anzahl: alle Assets, die diese Session getriggert haben oder zur selben extraction gehören
      const linkedAsset = assets.find((a) => a.id === s.trigger_ref_id);
      return {
        key: `session-${s.id}`,
        sessionId: s.id,
        status: sessionStatusToTile(s),
        count: 1,
        firstName: linkedAsset?.file_name ?? s.summary ?? "Verstehens-Lauf",
        resolved: s.resolved_boxes ?? 0,
        total: s.total_boxes ?? 0,
        createdAt: s.created_at,
      };
    });

    return [...pendingGroups, ...sessionTiles]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, LIMIT);
  }, [sessions, assets]);

  const handleClick = (t: SessionTile) => {
    if (t.status === "pending" || !t.sessionId) return;
    openSessionFromDB(t.sessionId);
  };

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
          {tiles.map((t) => {
            const clickable = t.status !== "pending" && !!t.sessionId;
            const tooltip =
              t.status === "pending"
                ? `${t.firstName} · läuft`
                : t.status === "closed"
                  ? `${t.firstName} · abgeschlossen`
                  : `${t.firstName} · ${(t.total ?? 0) - (t.resolved ?? 0)} offen`;
            return (
              <button
                key={t.key}
                onClick={() => handleClick(t)}
                disabled={!clickable}
                title={tooltip}
                className={cn(
                  "relative w-14 h-14 rounded-2xl flex items-center justify-center",
                  "bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))]",
                  "transition-all duration-300 text-muted-foreground",
                  clickable
                    ? "hover:scale-105 hover:text-foreground cursor-pointer"
                    : "cursor-default",
                  t.status === "closed" && "opacity-70",
                )}
              >
                {t.count > 1 ? (
                  <span className="text-lg font-light text-foreground/80">{t.count}</span>
                ) : (
                  <Layers size={18} strokeWidth={1.5} />
                )}
                <span
                  className={cn(
                    "absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full",
                    STATUS_DOT[t.status],
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
      <span className="text-[10px] tracking-widest uppercase text-muted-foreground/40">
        Intake-Sessions
      </span>
    </div>
  );
};

export default IntakeSessionsPanel;
