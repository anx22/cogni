import BentoCard from "../BentoCard";
import { FileText } from "lucide-react";

interface Dokument {
  id: string;
  name: string;
  typ: string;
  version: number;
  datum: string;
  thema: string | null;
}

const typIcon: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  pptx: "📊",
  eml: "✉️",
  image: "🖼",
};

const FacetDokumente = ({ dokumente }: { dokumente: Dokument[] }) => {
  return (
    <BentoCard title="Dokumente" icon={<FileText className="w-4 h-4" />} badge={dokumente.length} expandable defaultExpanded>
      <div className="space-y-2.5">
        {dokumente.map((d) => (
          <div key={d.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-background/60 transition-colors cursor-pointer group">
            <span className="text-base mt-0.5">{typIcon[d.typ] || "📄"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/80 group-hover:text-foreground transition-colors truncate">{d.name}</p>
              <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground/40">
                <span>v{d.version}</span>
                <span>{d.datum}</span>
                {d.thema && <span className="text-primary/50">{d.thema}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};

export default FacetDokumente;
