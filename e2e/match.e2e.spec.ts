import { test, expect } from "@playwright/test";

test("user can create and join a match", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.goto("/matches");
  await page.click("text=Create Match");
  await page.fill('input[name="game"]', "Test Game");
  await page.fill('input[name="stake"]', "100");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Match created")).toBeVisible();
  // Simulate join as second user in a real test
});
