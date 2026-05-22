// =============================================================================
//  e2e/_persona.ts — Persona „Hase & Söhne Couture" für Vier-Rollen-Smoke (K2)
// -----------------------------------------------------------------------------
//  Seed legt ein realistisches Projekt an, das alle 4 Rollen mit Daten füttert.
//  Marker: metadata.test_run_id + _origin="qa-fixture" → kompatibel mit
//  supabase/functions/test-data-sweep (räumt > 1h alte Fixtures).
//
//  Läuft in Node (Playwright), nicht in Deno. Nutzt @supabase/supabase-js v2
//  über Service-Role-Key direkt. Wenn ENV fehlt, wird das im Spec via
//  test.skip elegant abgefangen.
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export interface PersonaContext {
  test_run_id: string;
  user_id: string;
  project_id: string;
  decision_fact_id: string;
  topic_fact_id: string;
  topic_id: string;
}

/** Service-Role-Client für Seed/Sweep. Wirft, wenn ENV fehlt. */
export function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ENV fehlt — Persona-Seed übersprungen.",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const marker = (test_run_id: string, extra: Record<string, unknown> = {}) => ({
  test_run_id,
  _origin: "qa-fixture",
  persona: "hase-und-soehne",
  ...extra,
});

/**
 * Login-User-ID via E-Mail bestimmen. Erwartet, dass PLAYWRIGHT_USER_EMAIL
 * bereits in auth.users existiert (vom Login-Schritt im Spec angelegt/genutzt).
 */
export async function resolveTestUserId(admin: SupabaseClient): Promise<string> {
  const email = process.env.PLAYWRIGHT_USER_EMAIL;
  if (!email) throw new Error("PLAYWRIGHT_USER_EMAIL ENV fehlt");
  // listUsers ist paginiert; bei Test-DB reicht erste Page.
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(`auth.listUsers: ${error.message}`);
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Test-User ${email} nicht in auth.users gefunden`);
  return user.id;
}

/**
 * Seedet die volle Persona. Idempotent NICHT — pro Lauf neuer test_run_id.
 * Liefert IDs zurück damit der Spec direkt navigieren kann.
 */
export async function seedHaseUndSoehnePersona(admin: SupabaseClient): Promise<PersonaContext> {
  const test_run_id = randomUUID();
  const user_id = await resolveTestUserId(admin);

  // (1) Projekt
  const { data: project, error: pErr } = await admin
    .from("projects")
    .insert({
      user_id,
      name: "Hase & Söhne Couture",
      status: "active",
      description: "QA-Fixture für Vier-Rollen-Smoke",
      metadata: marker(test_run_id),
    })
    .select("id")
    .single();
  if (pErr) throw new Error(`projects: ${pErr.message}`);
  const project_id = project.id as string;

  // (2) Asset (Quelle für die Fakten)
  const { data: asset, error: aErr } = await admin
    .from("assets")
    .insert({
      user_id,
      project_id,
      label: "Mail Frau Hase 2026-05-22.eml",
      kind: "note",
      file_type: "eml",
      metadata: marker(test_run_id),
    })
    .select("id")
    .single();
  if (aErr) throw new Error(`assets: ${aErr.message}`);

  // (3) Canonical Facts: decision + deadline + topic
  const baseProv = { source: "qa-fixture", asset_id: asset.id };
  const { data: facts, error: fErr } = await admin
    .from("canonical_facts")
    .insert([
      {
        user_id,
        project_id,
        fact_type: "decision",
        content: { decision: "Pflaume statt Salbei", rationale: "Frau Hase will Kontrast." },
        provenance: { ...baseProv, marker: marker(test_run_id) },
      },
      {
        user_id,
        project_id,
        fact_type: "deadline",
        content: { what: "Kollektion fertigstellen", due_date: "2026-06-15" },
        provenance: { ...baseProv, marker: marker(test_run_id) },
      },
      {
        user_id,
        project_id,
        fact_type: "topic",
        content: { topic: "Markenarchitektur", description: "Wie Hase & Söhne positioniert wird." },
        provenance: { ...baseProv, marker: marker(test_run_id) },
      },
    ])
    .select("id, fact_type");
  if (fErr) throw new Error(`canonical_facts: ${fErr.message}`);
  const decision_fact_id = facts.find((f) => f.fact_type === "decision")!.id as string;
  const topic_fact_id = facts.find((f) => f.fact_type === "topic")!.id as string;

  // (3b) topics-Tabelle wird normalerweise vom AFTER INSERT Trigger (Migration
  // 20260521090000_topic_merge) befüllt. Aber wir lesen hier auch die ID, um
  // den Merge-Kandidaten korrekt verlinken zu können.
  const { data: topicRow, error: tErr } = await admin
    .from("topics")
    .select("id")
    .eq("canonical_fact_id", topic_fact_id)
    .maybeSingle();
  if (tErr) throw new Error(`topics lookup: ${tErr.message}`);
  if (!topicRow) {
    throw new Error(
      "topics-Trigger hat keine Zeile geschrieben — Migration 20260521090000 deployed?",
    );
  }
  const topic_id = topicRow.id as string;

  // (4) Zweiter Topic für Merge-Kandidat
  const { data: brandFact, error: bfErr } = await admin
    .from("canonical_facts")
    .insert({
      user_id,
      project_id,
      fact_type: "topic",
      content: { topic: "Brand Architecture", description: "Englischsprachige Variante." },
      provenance: { ...baseProv, marker: marker(test_run_id) },
    })
    .select("id")
    .single();
  if (bfErr) throw new Error(`canonical_facts brand: ${bfErr.message}`);
  const { data: brandTopic } = await admin
    .from("topics")
    .select("id")
    .eq("canonical_fact_id", brandFact.id)
    .maybeSingle();
  const brand_topic_id = brandTopic?.id as string;

  // (5) Konflikt (für Lage-Banner + Handlungsbedarf-Blocker)
  const { error: cErr } = await admin.from("contradictions").insert({
    user_id,
    project_id,
    contradiction_type: "version",
    description: "Gebäudehöhe Showroom: Plan A vs Plan B",
    fact_a_id: decision_fact_id,
    fact_b_id: facts.find((f) => f.fact_type === "deadline")!.id,
    resolved: false,
    metadata: marker(test_run_id),
  });
  if (cErr) throw new Error(`contradictions: ${cErr.message}`);

  // (6) Gap-Signal (für Lage-Chip + Handlungsbedarf-Item)
  const { error: gErr } = await admin.from("gap_signals").insert({
    user_id,
    project_id,
    canonical_fact_id: decision_fact_id,
    kind: "decision_without_deadline",
    title: "Pflaume statt Salbei — bis wann?",
    impact: "Bestellung kann nicht ausgelöst werden",
    affects: "Materialeinkauf",
    metadata: marker(test_run_id),
  });
  if (gErr) throw new Error(`gap_signals: ${gErr.message}`);

  // (7) Topic-Merge-Kandidat
  const { error: mErr } = await admin.from("topic_merge_candidates").insert({
    user_id,
    project_id,
    source_topic_id: brand_topic_id,
    target_topic_id: topic_id,
    status: "open",
    metadata: marker(test_run_id),
  });
  if (mErr) throw new Error(`topic_merge_candidates: ${mErr.message}`);

  // (8) Change Event (für Verlauf)
  const { error: eErr } = await admin.from("change_events").insert({
    user_id,
    project_id,
    canonical_fact_id: decision_fact_id,
    event_type: "add",
    new_value: { title: "Pflaume statt Salbei" },
    metadata: marker(test_run_id),
  });
  if (eErr) throw new Error(`change_events: ${eErr.message}`);

  return { test_run_id, user_id, project_id, decision_fact_id, topic_fact_id, topic_id };
}

/** Räumt alle Fixture-Rows mit dem gegebenen test_run_id-Marker auf. */
export async function sweepHaseUndSoehnePersona(
  admin: SupabaseClient,
  test_run_id: string,
): Promise<Record<string, number>> {
  const tables = [
    "change_events",
    "topic_merge_candidates",
    "gap_signals",
    "contradictions",
    "topics",
    "canonical_facts",
    "assets",
    "projects",
  ];
  const results: Record<string, number> = {};
  for (const t of tables) {
    const { count, error } = await admin
      .from(t)
      .delete({ count: "exact" })
      .filter("metadata->>test_run_id", "eq", test_run_id);
    results[t] = count ?? 0;
    if (error && !/column .* does not exist/i.test(error.message)) {
      console.warn(`sweep ${t}: ${error.message}`);
    }
  }
  return results;
}
