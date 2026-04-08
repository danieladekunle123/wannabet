import { test, expect } from "@playwright/test";

test("user can register and login", async ({ page }) => {
  await page.goto("/login");
  await page.click("text=Register");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard|home/i);
});
