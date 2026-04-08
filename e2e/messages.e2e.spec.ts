import { test, expect } from "@playwright/test";

test("user can send a message", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.goto("/messages");
  await page.fill('textarea[name="message"]', "Hello world!");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Hello world!")).toBeVisible();
});
