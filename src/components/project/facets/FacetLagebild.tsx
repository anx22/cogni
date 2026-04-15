import BentoCard from "../BentoCard";
import { Activity } from "lucide-react";

interface FacetLagebildProps {
  project: {
    lagetext: string;
    stats: {
      konflikte: number;
      offenePunkte: number;
      entscheidungenOffen: number;
      themen: number;
      dokumente: number;
      stakeholder: number;
    };
  };
}

const FacetLagebild = ({ project }: FacetLagebildProps) => {
  const { stats } = project;

  return (
    <BentoCard title="Aktueller Stand" icon={<Activity className="w-4 h-4" />} className="h-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-1">
        <MiniStat label="Themen" value={stats.themen} />
        <MiniStat label="Dokumente" value={stats.dokumente} />
        <MiniStat label="Stakeholder" value={stats.stakeholder} />
        <MiniStat label="Konflikte" value={stats.konflikte} highlight />
        <MiniStat label="Offene Punkte" value={stats.offenePunkte} />
        <MiniStat label="Entscheidungen offen" value={stats.entscheidungenOffen} />
      </div>
    </BentoCard>
  );
};

const MiniStat = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className="flex flex-col gap-1">
    <span className={`text-2xl font-light ${highlight ? "text-destructive/90" : "text-foreground/90"}`}>{value}</span>
    <span className="text-xs text-muted-foreground/60">{label}</span>
  </div>
);

export default FacetLagebild;
