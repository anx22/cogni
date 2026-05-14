export type ProjectSignal = "calm" | "review" | "conflict" | "action";

export interface DemoProject {
  id: string;
  name: string;
  initial: string;
  lastOpenedAt?: string;
  lastChangedAt?: string;
  openCount?: number;
  signal?: ProjectSignal;
  // Optional secondary signal for "up to two dots"
  signal2?: ProjectSignal;
  archived?: boolean;
}

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

export const demoProjects: DemoProject[] = [
  {
    id: "p1",
    name: "Aurora Rebrand",
    initial: "AR",
    lastOpenedAt: iso(1000 * 60 * 60 * 2),
    lastChangedAt: iso(1000 * 60 * 60 * 3),
    openCount: 2,
    signal: "review",
    signal2: "action",
  },
  {
    id: "p2",
    name: "Hafen Nord Erweiterung",
    initial: "HN",
    lastChangedAt: iso(1000 * 60 * 25),
    openCount: 5,
    signal: "conflict",
    signal2: "action",
  },
  {
    id: "p3",
    name: "Kanban Migration",
    initial: "KM",
    lastChangedAt: iso(1000 * 60 * 60 * 8),
    openCount: 1,
    signal: "action",
  },
  {
    id: "p4",
    name: "Lieferkette 2026 Strategie",
    initial: "L26",
    lastChangedAt: iso(1000 * 60 * 60 * 26),
    signal: "calm",
  },
  {
    id: "p5",
    name: "Mobile Relaunch",
    initial: "MR",
    lastChangedAt: iso(1000 * 60 * 60 * 24 * 3),
    openCount: 3,
    signal: "review",
  },
  {
    id: "p6",
    name: "Onboarding Flow",
    initial: "OF",
    lastChangedAt: iso(1000 * 60 * 60 * 24 * 5),
    signal: "calm",
  },
  {
    id: "p7",
    name: "Pricing Studie Q2",
    initial: "PS",
    lastChangedAt: iso(1000 * 60 * 60 * 24 * 10),
    openCount: 1,
    signal: "action",
  },
  {
    id: "p8",
    name: "Research Sprint",
    initial: "RS",
    lastChangedAt: iso(1000 * 60 * 60 * 24 * 14),
    signal: "calm",
  },
  {
    id: "p9",
    name: "Vertragswerk Neufassung",
    initial: "VW",
    lastChangedAt: iso(1000 * 60 * 60 * 24 * 21),
    openCount: 2,
    signal: "conflict",
  },
  {
    id: "p10",
    name: "Workshop Q3 Vorbereitung",
    initial: "WQ",
    lastChangedAt: iso(1000 * 60 * 60 * 24 * 30),
    signal: "calm",
  },
];
