import { expect, type Page } from "@playwright/test";

/**
 * Login über das Auth-Form. Erwartet einen vorab existierenden Test-User.
 */
export async function login(page: Page) {
  const email = process.env.PLAYWRIGHT_USER_EMAIL;
  const password = process.env.PLAYWRIGHT_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "PLAYWRIGHT_USER_EMAIL/PLAYWRIGHT_USER_PASSWORD nicht gesetzt — Smoke übersprungen.",
    );
  }
  await page.goto("/auth");
  await page.getByLabel(/E-?Mail/i).fill(email);
  await page.getByLabel(/Passwort/i).fill(password);
  await page.getByRole("button", { name: /anmelden|login/i }).click();
  await expect(page).toHaveURL(/\/(index|projects?)/i, { timeout: 10_000 });
}
