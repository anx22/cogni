import { AlertTriangle } from "lucide-react";

interface Konflikt {
  id: string;
  title: string;
  beschreibung: string;
}

const ConflictBanner = ({ konflikte }: { konflikte: Konflikt[] }) => {
  if (konflikte.length === 0) return null;

  return (
    <div className="rounded-xl border border-destructive/50 bg-destructive/10 shadow-card px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-destructive font-medium mb-1.5">
            {konflikte.length} {konflikte.length === 1 ? "Konflikt blockiert" : "Konflikte blockieren"}
          </p>
          <ul className="space-y-1">
            {konflikte.map((k) => (
              <li key={k.id} className="text-sm text-foreground/95 leading-snug">
                <span className="font-medium">{k.title}</span>
                <span className="text-muted-foreground"> · {k.beschreibung}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConflictBanner;
