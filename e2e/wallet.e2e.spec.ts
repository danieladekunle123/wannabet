import { test, expect } from "@playwright/test";

test("user can view wallet and deposit", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.goto("/wallet");
  await expect(page.locator("text=Balance")).toBeVisible();
  await page.click("text=Deposit");
  await page.fill('input[name="amount"]', "1000");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Deposit successful")).toBeVisible();
});
