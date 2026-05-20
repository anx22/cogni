import type { DeltaTyp } from "@/lib/project/types";

const styles: Record<DeltaTyp, { label: string; className: string }> = {
  neu: { label: "neu", className: "bg-primary/15 text-primary/90 border-primary/25" },
  ersetzt: { label: "ersetzt", className: "bg-amber-500/15 text-amber-300/90 border-amber-500/25" },
  bestaetigt: {
    label: "bestätigt",
    className: "bg-emerald-500/15 text-emerald-300/90 border-emerald-500/25",
  },
  widersprochen: {
    label: "widersprochen",
    className: "bg-destructive/15 text-destructive/90 border-destructive/25",
  },
  unclear: { label: "unklar", className: "bg-muted/40 text-muted-foreground border-border" },
};

const DeltaTag = ({ delta }: { delta: DeltaTyp }) => {
  const s = styles[delta];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wider font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
};

export default DeltaTag;
