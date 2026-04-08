import { test, expect } from "@playwright/test";

test("user can create a dispute for a match", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.goto("/matches");
  await page.click("text=Report Dispute");
  await page.fill('textarea[name="reason"]', "Test dispute reason");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Dispute submitted")).toBeVisible();
});
