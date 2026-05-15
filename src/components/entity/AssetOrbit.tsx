import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Link as LinkIcon, StickyNote, Image as ImageIcon, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeTables } from "@/lib/realtime/useRealtimeTables";
import { useDialog } from "@/components/dialog/DialogProvider";
import { formatRelative } from "@/lib/format/relativeTime";

type ChipStatus = "parsing" | "understanding" | "review-ready" | "failed";

interface Chip {
  id: string;
  assetId: string;
  label: string;
  fileType: string;
  status: ChipStatus;
  createdAt: string;
  sessionId: string | null;
  ageRing: 0 | 1;
}

const ICON: Record<string, typeof FileText> = {
  pdf: FileText, docx: FileText, pptx: FileText,
  image: ImageIcon, eml: FileText, note: StickyNote, other: File,
};

const ORBIT_ARC = 1.25 * Math.PI;
const ORBIT_START = -Math.PI / 2 - ORBIT_ARC / 2;
const RING_RADIUS = [250, 290];
const MAX = 8;

const deriveStatus = (a: {
  processing_status?: string | null;
  understanding_status?: string | null;
}, hasOpenSession: boolean): ChipStatus | null => {
  if (hasOpenSession) return "review-ready";
  const us = a.understanding_status ?? "";
  if (["failed", "rate_limited", "payment_required"].includes(us)) return "failed";
  if (us === "running") return "understanding";
  if (a.processing_status === "processing" || a.processing_status === "pending") return "parsing";
  return null;
};

const AssetOrbit = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { openSessionFromDB } = useDialog();
  const [chips, setChips] = useState<Chip[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const { data: assets } = await supabase
      .from("assets")
      .select("id, file_name, file_type, processing_status, understanding_status, created_at, metadata")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!assets?.length) { setChips([]); return; }

    const ids = assets.map((a) => a.id);
    const { data: sessions } = await supabase
      .from("dialog_sessions")
      .select("id, trigger_ref_id, status")
      .eq("user_id", userId)
      .eq("trigger_type", "intake")
      .eq("status", "open")
      .in("trigger_ref_id", ids);
    const openByAsset = new Map<string, string>();
    sessions?.forEach((s) => {
      if (s.trigger_ref_id && s.id) openByAsset.set(s.trigger_ref_id, s.id);
    });

    const next: Chip[] = [];
    for (const a of assets) {
      const sessionId = openByAsset.get(a.id) ?? null;
      const status = deriveStatus(a, !!sessionId);
      if (!status) continue;
      const meta = (a.metadata as Record<string, unknown>) ?? {};
      const isUrl = meta.kind === "url";
      let label: string;
      if (isUrl) {
        const raw = String(meta.url ?? a.file_name);
        try { label = new URL(raw).hostname.replace(/^www\./, ""); }
        catch { label = raw; }
      } else {
        label = a.file_name;
      }
      next.push({
        id: a.id,
        assetId: a.id,
        label,
        fileType: isUrl ? "link" : a.file_type,
        status,
        createdAt: a.created_at,
        sessionId,
        ageRing: next.length < 4 ? 0 : 1,
      });
      if (next.length >= MAX) break;
    }
    setChips(next);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useRealtimeTables(
    userId ? `asset-orbit-${userId}` : null,
    userId
      ? [
          { table: "assets", filter: `user_id=eq.${userId}` },
          { table: "dialog_sessions", filter: `user_id=eq.${userId}` },
        ]
      : [],
    { onTrigger: load },
  );

  const positioned = useMemo(() => {
    const total = Math.max(chips.length, 1);
    return chips.map((c, i) => {
      const angle = ORBIT_START + ((i + 0.5) / total) * ORBIT_ARC;
      const r = RING_RADIUS[c.ageRing];
      return { ...c, x: Math.cos(angle) * r, y: Math.sin(angle) * r, opacity: 1 - c.ageRing * 0.45 };
    });
  }, [chips]);

  const handleClick = (c: Chip) => {
    if (c.status === "review-ready" && c.sessionId) {
      openSessionFromDB(c.sessionId);
    }
  };

  if (!chips.length) return null;

  return (
    <div className="hidden md:block pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2">
        {positioned.map((c) => {
          const Icon = c.fileType === "link" ? LinkIcon : (ICON[c.fileType] ?? File);
          const interactive = c.status === "review-ready";
          const borderClass =
            c.status === "parsing" ? "border-dashed border-[color:var(--ink-3)] text-[color:var(--ink-3)]"
            : c.status === "understanding" ? "border-[color:var(--ink-3)] text-[color:var(--ink-2)]"
            : c.status === "review-ready" ? "border-[color:var(--sig-review)] text-[color:var(--ink)] shadow-[0_0_24px_-6px_var(--sig-review)]"
            : "border-[color:var(--sig-conflict,#c54141)] text-[color:var(--ink-2)]";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleClick(c)}
              disabled={!interactive}
              title={c.label}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full border bg-[color:var(--surface-1)]/80 backdrop-blur-md text-[11px] tracking-wide transition-all ${borderClass} ${interactive ? "pointer-events-auto cursor-pointer hover:scale-105" : ""}`}
              style={{ transform: `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px))`, opacity: c.opacity }}
            >
              {c.status === "understanding" ? (
                <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon size={12} strokeWidth={1.5} />
              )}
              <span className="max-w-[14ch] truncate">{c.label}</span>
              <span className="opacity-50">· {formatRelative(c.createdAt)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AssetOrbit;
