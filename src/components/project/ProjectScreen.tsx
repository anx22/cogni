import { useState } from "react";
import { demoProject } from "@/data/demoProject";
import ProjectHeader from "./ProjectHeader";
import FacetLagebild from "./facets/FacetLagebild";
import FacetAenderungen from "./facets/FacetAenderungen";
import FacetKonflikte from "./facets/FacetKonflikte";
import FacetThemen from "./facets/FacetThemen";
import FacetTimeline from "./facets/FacetTimeline";
import FacetEntscheidungen from "./facets/FacetEntscheidungen";
import FacetOffenePunkte from "./facets/FacetOffenePunkte";
import FacetDokumente from "./facets/FacetDokumente";
import FacetStakeholder from "./facets/FacetStakeholder";
import FacetFeedback from "./facets/FacetFeedback";

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

      {/* Project Header */}
      <ProjectHeader project={p} />

      {/* Bento Grid */}
      <div className="px-8 md:px-12 lg:px-16 xl:px-20 pb-20">
        {/* Row 1: Lagebild (wide) + Konflikte */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="lg:col-span-2">
            <FacetLagebild project={p} />
          </div>
          <div className="lg:col-span-1">
            <FacetKonflikte konflikte={p.konflikte} />
          </div>
        </div>

        {/* Row 2: Änderungen + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <FacetAenderungen aenderungen={p.aenderungen} />
          <FacetTimeline timeline={p.timeline} />
        </div>

        {/* Row 3: Themen (full width) */}
        <div className="mb-5">
          <FacetThemen themen={p.themen} />
        </div>

        {/* Row 4: Entscheidungen + Offene Punkte & Aufgaben */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <FacetEntscheidungen entscheidungen={p.entscheidungen} />
          <FacetOffenePunkte offenePunkte={p.offenePunkte} aufgaben={p.aufgaben} />
        </div>

        {/* Row 5: Dokumente + Stakeholder + Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FacetDokumente dokumente={p.dokumente} />
          <FacetStakeholder stakeholder={p.stakeholder} />
          <FacetFeedback feedback={p.feedback} korrekturen={p.korrekturen} />
        </div>
      </div>
    </div>
  );
};

export default ProjectScreen;
