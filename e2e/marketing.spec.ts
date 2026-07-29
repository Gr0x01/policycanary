import { test, expect } from "@playwright/test";

test("landing page renders hero headline", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("Understand FDA changes in terms of your exact products.")
  ).toBeVisible();
});

test("pricing page shows Monitor plan", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("$99/month").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /start free trial/i }).first()).toBeVisible();
});

test("sample report shows Marine Collagen Powder", async ({ page }) => {
  await page.goto("/sample");
  await expect(page.getByText("Marine Collagen Powder").first()).toBeVisible();
});

// Render-only check — submitting would write a fake subscriber to the live table
test("newsletter signup form renders", async ({ page }) => {
  await page.goto("/");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: /subscribe/i }) });
  await expect(form.locator('input[type="email"]')).toBeVisible();
});
