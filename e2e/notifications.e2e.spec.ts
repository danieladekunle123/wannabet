import { test, expect } from "@playwright/test";

test("user receives a notification", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.goto("/notifications");
  await expect(page.locator("text=Test notification")).toBeVisible();
});
