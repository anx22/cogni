import { useEffect, useRef } from "react";
import { CheckIcon, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { KonfliktVM } from "@/lib/project/types";

interface Props {
  konflikt: KonfliktVM;
  anchor: DOMRect;
  onClose: () => void;
  onOpenDrill: () => void;
}

const KonfliktPopover = ({ konflikt, anchor, onClose, onOpenDrill }: Props) => {
  const emp = konflikt.empfehlung!;
  const winner = emp.gewinner === "A" ? konflikt.faktA : konflikt.faktB;
  const other = emp.gewinner === "A" ? konflikt.faktB : konflikt.faktA;
  const panelRef = useRef<HTMLDivElement>(null);

  // Position below the anchor row, clamped to viewport
  const top = Math.min(anchor.bottom + 8, window.innerHeight - 280);
  const left = Math.max(16, Math.min(anchor.left, window.innerWidth - 460));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleAccept = async () => {
    try {
      const { error } = await supabase
        .from("contradictions")
        .update({ resolved: true })
        .eq("id", konflikt.id);
      if (error) throw error;
      toast.success("Widerspruch aufgelöst", {
        description: winner.inhalt,
      });
      onClose();
    } catch {
      toast.error("Konnte Widerspruch nicht auflösen");
    }
  };

  return (
    <>
      {/* backdrop */}
      <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={onClose} aria-hidden />

      {/* panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top,
          left,
          width: 440,
          zIndex: 300,
          background: "var(--surface-1)",
          border: "1px solid var(--hair-2)",
          boxShadow: "var(--shadow-pop)",
          borderRadius: 18,
          padding: "22px 24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* header */}
        <div className="flex items-start justify-between" style={{ gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-4)",
                letterSpacing: ".07em",
                marginBottom: 6,
              }}
            >
              COGNI EMPFIEHLT
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-.012em",
                lineHeight: 1.25,
              }}
            >
              {winner.inhalt}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              border: "1px solid var(--hair)",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              color: "var(--ink-4)",
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* reasoning */}
        <div
          style={{
            fontSize: 12.5,
            color: "var(--ink-3)",
            lineHeight: 1.5,
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--surface-2)",
            border: "1px solid var(--hair)",
          }}
        >
          {emp.begruendung}
        </div>

        {/* the other fact */}
        <div style={{ fontSize: 12, color: "var(--ink-4)" }}>
          <span style={{ marginRight: 6 }}>vs.</span>
          <span style={{ color: "var(--ink-3)" }}>{other.inhalt}</span>
          {other.datum && (
            <span className="mono" style={{ marginLeft: 8, fontSize: 11 }}>
              {other.datum}
            </span>
          )}
        </div>

        {/* actions */}
        <div className="flex" style={{ gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center"
            style={{
              flex: 1,
              height: 38,
              borderRadius: 10,
              background: "var(--sig-action)",
              border: "none",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              gap: 6,
              justifyContent: "center",
            }}
          >
            <CheckIcon size={14} />
            Übernehmen
          </button>
          <button
            type="button"
            onClick={onOpenDrill}
            className="flex items-center"
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid var(--hair-2)",
              background: "transparent",
              color: "var(--ink-2)",
              fontSize: 13,
              cursor: "pointer",
              gap: 4,
            }}
          >
            Details
            <ChevronRight size={12} />
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid var(--hair)",
              background: "transparent",
              color: "var(--ink-4)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Offen lassen
          </button>
        </div>
      </div>
    </>
  );
};

export default KonfliktPopover;
