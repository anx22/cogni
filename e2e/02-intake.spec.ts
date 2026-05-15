import { test, expect } from "@playwright/test";
import { login } from "./_helpers";

test("Pfad 2 — Notiz-Drop landet als Asset im Intake-Strom", async ({ page }) => {
  await login(page);

  // Composer öffnen, Notiz-Modus, Text + Submit.
  const composer = page.getByPlaceholder(/notiz|gedanke|text/i).first();
  await composer.fill("Smoke-Notiz: Bauleitung bestätigt Termin am 12.06.");
  await page.keyboard.press("Mod+Enter").catch(() => page.keyboard.press("Control+Enter"));

  // Erfolg = Asset taucht im Intake-Panel auf (Name oder "Note"-Label).
  await expect(page.getByText(/smoke-notiz|note|notiz/i).first()).toBeVisible({ timeout: 15_000 });
});
