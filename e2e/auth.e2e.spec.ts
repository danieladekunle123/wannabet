import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Authentication E2E", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/wannabet/i);
  });

  test("login page renders form fields", async ({ page }) => {
    await page.goto("/");
    // The SPA should show login/signup inputs
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="email" i]',
    );
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
  });

  test("API health endpoint is accessible", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health`);
    expect(res.ok()).toBeTruthy();
  });

  test("API rejects invalid login", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: "nonexistent@example.com", password: "wrong" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
