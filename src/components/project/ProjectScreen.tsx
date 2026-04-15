import { useState } from "react";
import { demoProject } from "@/data/demoProject";
import ProjectHeader from "./ProjectHeader";
import FacetTimeline from "./facets/FacetTimeline";
import FacetEntscheidungen from "./facets/FacetEntscheidungen";
import FacetOffenePunkte from "./facets/FacetOffenePunkte";
import FacetThemen from "./facets/FacetThemen";
import FacetDokumente from "./facets/FacetDokumente";
import FacetStakeholder from "./facets/FacetStakeholder";
import FacetFeedback from "./facets/FacetFeedback";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ProjectScreenProps {
  onBack: () => void;
}

const ProjectScreen = ({ onBack }: ProjectScreenProps) => {
  const p = demoProject;

  return (
    <div className="min-h-screen bg-background animate-[fade-in_0.5s_ease-out]">
      {/* Back to entity */}
      <button
        onClick={onBack}
        className="fixed top-6 left-8 z-50 text-xs text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors tracking-widest uppercase"
      >
        ← Entität
      </button>

      {/* Project Header with conditional conflict banner */}
      <ProjectHeader project={p} />

      {/* Tab System */}
      <div className="px-8 md:px-12 lg:px-16 xl:px-20 pb-20">
        <Tabs defaultValue="intelligence" className="w-full">
          <TabsList className="bg-transparent border-b border-border/40 rounded-none h-auto p-0 mb-8 gap-0 w-full justify-start">
            <TabsTrigger
              value="intelligence"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground/60 data-[state=active]:text-foreground/90 uppercase text-xs tracking-[0.15em] px-6 py-3 transition-all"
            >
              Intelligence
            </TabsTrigger>
            <TabsTrigger
              value="substanz"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground/60 data-[state=active]:text-foreground/90 uppercase text-xs tracking-[0.15em] px-6 py-3 transition-all"
            >
              Substanz
            </TabsTrigger>
            <TabsTrigger
              value="kontext"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent text-muted-foreground/60 data-[state=active]:text-foreground/90 uppercase text-xs tracking-[0.15em] px-6 py-3 transition-all"
            >
              Kontext
            </TabsTrigger>
          </TabsList>

          {/* INTELLIGENCE */}
          <TabsContent value="intelligence" className="mt-0 space-y-6">
            {/* Lagebild as inline briefing */}
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6">
              <p className="text-sm text-foreground/85 leading-relaxed">{p.lagetext}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FacetTimeline timeline={p.timeline} />
              <FacetEntscheidungen entscheidungen={p.entscheidungen} />
            </div>

            <FacetOffenePunkte offenePunkte={p.offenePunkte} aufgaben={p.aufgaben} />
          </TabsContent>

          {/* SUBSTANZ */}
          <TabsContent value="substanz" className="mt-0 space-y-6">
            <FacetThemen themen={p.themen} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FacetDokumente dokumente={p.dokumente} />
              <FacetFeedback feedback={p.feedback} korrekturen={p.korrekturen} />
            </div>
          </TabsContent>

          {/* KONTEXT */}
          <TabsContent value="kontext" className="mt-0 space-y-6">
            <FacetStakeholder stakeholder={p.stakeholder} />

            {/* Project Meta */}
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6">
              <h2 className="text-sm font-medium tracking-wide text-foreground/90 uppercase mb-4">Projektdaten</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetaItem label="Status" value="Aktiv" />
                <MetaItem label="Budget" value="210.000 EUR" />
                <MetaItem label="Nächster Termin" value={p.stats.naechsterTermin} />
                <MetaItem label="Letzte Änderung" value={p.stats.letzteAenderung} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const MetaItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground/50 mb-1">{label}</p>
    <p className="text-sm text-foreground/85 font-medium">{value}</p>
  </div>
);

export default ProjectScreen;
