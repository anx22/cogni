// =============================================================================
//  PROJECT SCORING (lexikalisch)
// -----------------------------------------------------------------------------
//  Schmale, präzise Heuristik um Roh-Text auf vorhandene Projekte zu mappen.
//  Bewusst kein Embedding, kein NLP — nur Wort-Matches mit klaren Gewichten.
//
//  Regeln (siehe agentConfig.ts):
//    +3 Treffer auf Projektname (ganzes Wort, case-insensitive)
//    +2 Treffer auf Stakeholder-Namen (verknüpft via project_stakeholder_links)
//    +2 Treffer auf Themennamen (topics im Projekt)
//    +1 Treffer auf Org-Domain (in URL/Mail-Header)
//
//  Liefert pro Projekt einen Score + die "reasons" für die Live-Stimme.
// =============================================================================

export interface ProjectContext {
  id: string;
  name: string;
  description?: string | null;
  topics: string[];
  stakeholders: string[]; // normalisierte Namen
  org_domains: string[]; // z.B. "example.com"
}

export interface ScoreResult {
  project_id: string;
  score: number;
  reasons: string[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordHit(haystack: string, needle: string): boolean {
  const n = normalize(needle).trim();
  if (!n || n.length < 2) return false;
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(n)}([^\\p{L}\\p{N}]|$)`, "iu");
  return re.test(haystack);
}

export function scoreProjects(text: string, projects: ProjectContext[]): ScoreResult[] {
  const hay = normalize(text);
  const results: ScoreResult[] = [];

  for (const p of projects) {
    let score = 0;
    const reasons: string[] = [];

    if (wordHit(hay, p.name)) {
      score += 3;
      reasons.push(`Projektname „${p.name}" erwähnt`);
    }

    let stakeHits = 0;
    for (const s of p.stakeholders) {
      if (wordHit(hay, s)) {
        stakeHits++;
        if (stakeHits <= 2) reasons.push(`Stakeholder „${s}"`);
      }
    }
    score += stakeHits * 2;

    let topicHits = 0;
    for (const t of p.topics) {
      if (wordHit(hay, t)) {
        topicHits++;
        if (topicHits <= 2) reasons.push(`Thema „${t}"`);
      }
    }
    score += topicHits * 2;

    let domainHits = 0;
    for (const d of p.org_domains) {
      if (d && hay.includes(normalize(d))) {
        domainHits++;
        if (domainHits <= 1) reasons.push(`Domain „${d}"`);
      }
    }
    score += domainHits;

    if (score > 0) {
      results.push({ project_id: p.id, score, reasons });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// Hilfs-Loader: holt alle Projekte des Users mit Themen/Stakeholdern/Domains.
// Ein Round-Trip pro Tabelle, keine Joins — bleibt einfach lesbar.
export async function loadProjectContexts(admin: any, user_id: string): Promise<ProjectContext[]> {
  const { data: projects } = await admin
    .from("projects")
    .select("id, name, description")
    .eq("user_id", user_id);
  if (!projects?.length) return [];

  const ids = projects.map((p: any) => p.id);

  const [{ data: topics }, { data: links }] = await Promise.all([
    admin.from("topics").select("project_id, name").in("project_id", ids),
    admin
      .from("project_stakeholder_links")
      .select("project_id, person:persons(name), organization:organizations(name, domain)")
      .in("project_id", ids),
  ]);

  const byProject: Record<string, ProjectContext> = {};
  for (const p of projects) {
    byProject[p.id] = {
      id: p.id,
      name: p.name,
      description: p.description,
      topics: [],
      stakeholders: [],
      org_domains: [],
    };
  }
  for (const t of topics ?? []) {
    if (byProject[t.project_id]) byProject[t.project_id].topics.push(t.name);
  }
  for (const l of links ?? []) {
    const ctx = byProject[l.project_id];
    if (!ctx) continue;
    const personName = l.person?.name;
    const orgName = l.organization?.name;
    const orgDomain = l.organization?.domain;
    if (personName) ctx.stakeholders.push(personName);
    if (orgName) ctx.stakeholders.push(orgName);
    if (orgDomain) ctx.org_domains.push(orgDomain);
  }
  return Object.values(byProject);
}
