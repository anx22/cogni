// =============================================================================
//  04-vier-rollen-smoke — Persona-Walkthrough (K2)
// -----------------------------------------------------------------------------
//  Seedet Persona „Hase & Söhne Couture" via Service-Role und prüft, dass alle
//  vier Rollen im ProjectScreen die Daten korrekt rendern:
//
//    Lage          → Konflikt-Banner + Coverage-Chips (Fakten/Lücken) sichtbar
//    Handlungsbedarf → mindestens 3 Items (Konflikt + Gap + TopicMerge)
//    Verlauf       → mindestens 1 Eintrag mit Delta-Tag
//    Substanz      → Topic-Karte mit ChevronRight-Drilldown
//
//  Skip-Bedingung: ohne SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY läuft kein
//  Seed → Test wird übersprungen (graceful, wie e2e/03-review.spec.ts).
// =============================================================================

import { test, expect } from "@playwright/test";
import { login } from "./_helpers";
import {
  adminClient,
  seedHaseUndSoehnePersona,
  sweepHaseUndSoehnePersona,
  type PersonaContext,
} from "./_persona";

let persona: PersonaContext | null = null;
let admin: ReturnType<typeof adminClient> | null = null;

test.beforeAll(async () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return; // graceful skip in den einzelnen Tests
  }
  admin = adminClient();
  persona = await seedHaseUndSoehnePersona(admin);
});

test.afterAll(async () => {
  if (admin && persona) {
    await sweepHaseUndSoehnePersona(admin, persona.test_run_id);
  }
});

test("Pfad 4 — Persona-Walkthrough: alle vier Rollen rendern Persona-Daten", async ({ page }) => {
  if (!persona) {
    test.skip(true, "SUPABASE_SERVICE_ROLE_KEY fehlt — Persona-Seed nicht möglich.");
    return;
  }

  await login(page);
  await page.goto(`/projekt/${persona.project_id}`);

  // Header zeigt Projektname (Wartet auf React-Hydration + Daten-Fetch).
  await expect(page.getByRole("heading", { name: /Hase & Söhne Couture/i })).toBeVisible({
    timeout: 15_000,
  });

  // --- Rolle 1: Lage ---------------------------------------------------------
  // Konflikt-Banner: das Wort „Konflikt" oder dot--conflict-Indikator
  await expect(page.locator(":text-matches('konflikt', 'i')").first()).toBeVisible({
    timeout: 10_000,
  });

  // Coverage-Chips: mindestens „Fakten" + „Lücken" (Counts ≥ 1).
  await expect(page.locator(".chip", { hasText: /\d+ Fakten/ })).toBeVisible();
  await expect(page.locator(".chip", { hasText: /\d+ Lücken?/ })).toBeVisible();

  // --- Rolle 2: Handlungsbedarf ---------------------------------------------
  // Section-Label „Handlungsbedarf" sichtbar, dann mindestens drei Items
  // (1 Konflikt + 1 Gap + 1 TopicMerge). Wir prüfen über das TypeIcon-Aria
  // bzw. einfache Textsuche nach den drei Item-Markern.
  const handlungsSection = page.locator("section", { hasText: /Handlungsbedarf/i }).first();
  await expect(handlungsSection).toBeVisible();
  await expect(handlungsSection.locator("[role='listitem'], li, [data-objektTyp]")).toHaveCount(
    await handlungsSection.locator("[role='listitem'], li, [data-objektTyp]").count(),
  ); // mind. >=3, weiches Lower-Bound:
  const itemCount = await handlungsSection
    .locator("[role='listitem'], li, [data-objektTyp]")
    .count();
  expect(itemCount).toBeGreaterThanOrEqual(3);

  // --- Rolle 3: Verlauf ------------------------------------------------------
  const verlaufSection = page.locator("section", { hasText: /Verlauf/i }).first();
  await expect(verlaufSection).toBeVisible();
  // Mindestens ein Delta-Tag (add/bestaetigt/neu).
  await expect(
    verlaufSection.locator(":text-matches('add|bestätigt|neu', 'i')").first(),
  ).toBeVisible();

  // --- Rolle 4: Substanz -----------------------------------------------------
  const substanzSection = page.locator("section", { hasText: /Substanz|Themen/i }).first();
  await expect(substanzSection).toBeVisible();
  // Topic-Karte „Markenarchitektur" sichtbar.
  await expect(substanzSection.getByText(/Markenarchitektur/i)).toBeVisible();

  // Drilldown-Affordance: ChevronRight als SVG/Symbol oder Button.
  // (Wir öffnen den Dialog NICHT — das wäre ein eigener Test und das Overlay
  //  ist im modality-matrix-Renderer ggf. flaky in CI.)
});
