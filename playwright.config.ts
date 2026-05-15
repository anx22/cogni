import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright-Smokes — drei Pfade, die nicht durch Vitest-Hook-Mocks abgedeckt sind.
 * Kein Bestandteil von `bun test` — läuft nur über `bun playwright test`.
 *
 * Voraussetzung: dev-Server unter http://localhost:8080 + ein Test-User mit
 *   E-Mail `PLAYWRIGHT_USER_EMAIL` / Passwort `PLAYWRIGHT_USER_PASSWORD`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: "bun run dev",
        url: "http://localhost:8080",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
