export interface DemoProject {
  id: string;
  name: string;
  initial: string;
  lastOpenedAt?: string;
}

export const demoProjects: DemoProject[] = [
  { id: "p1", name: "Aurora Rebrand", initial: "AR", lastOpenedAt: "2025-04-17T10:00:00Z" },
  { id: "p2", name: "Hafen Nord", initial: "HN" },
  { id: "p3", name: "Kanban Migration", initial: "KM" },
  { id: "p4", name: "Lieferkette 2026", initial: "L26" },
  { id: "p5", name: "Mobile Relaunch", initial: "MR" },
  { id: "p6", name: "Onboarding Flow", initial: "OF" },
  { id: "p7", name: "Pricing Studie", initial: "PS" },
  { id: "p8", name: "Research Sprint", initial: "RS" },
  { id: "p9", name: "Vertragswerk", initial: "VW" },
  { id: "p10", name: "Workshop Q3", initial: "WQ" },
];
