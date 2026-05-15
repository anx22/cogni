import { test, expect } from "@playwright/test";
import { login } from "./_helpers";

test("Pfad 3 — Review-Overlay öffnet sich für vorhandenes Asset", async ({ page }) => {
  await login(page);

  // Erste Asset-Kachel öffnen (Asset-Orbit oder IntakeSessionsPanel).
  const firstAsset = page.locator('[data-testid="asset-tile"]').first();
  if (await firstAsset.count()) {
    await firstAsset.click();
  } else {
    test.skip(true, "Kein Asset zum Reviewen vorhanden — Pfad 2 muss vorlaufen.");
  }

  // Review-Overlay sichtbar.
  await expect(page.getByText(/review|prüf|bestätigen|verwerfen/i).first()).toBeVisible({
    timeout: 10_000,
  });
});
