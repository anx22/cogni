import { test, expect } from "@playwright/test";
import { login } from "./_helpers";

test("Pfad 1 — Login bringt User auf die Entität", async ({ page }) => {
  await login(page);
  // Entität ist erkennbar an einem Mic/Drop-Hint.
  await expect(page.getByRole("button", { name: /aufnahme|note|notiz|mic/i }).first()).toBeVisible({
    timeout: 5_000,
  });
});
