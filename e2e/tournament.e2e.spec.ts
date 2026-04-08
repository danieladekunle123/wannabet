import { test, expect } from "@playwright/test";

test("user can join a tournament", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.goto("/tournaments");
  await page.click("text=Join Tournament");
  await expect(page.locator("text=Joined successfully")).toBeVisible();
});
