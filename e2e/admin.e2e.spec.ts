import { test, expect } from "@playwright/test";

test("admin can ban a user and resolve dispute", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "AdminPass123!");
  await page.click('button[type="submit"]');
  await page.goto("/admin");
  await page.click("text=Ban User");
  await page.fill('input[name="userId"]', "user123");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=User banned")).toBeVisible();
  await page.click("text=Resolve Dispute");
  await page.fill('input[name="disputeId"]', "dispute123");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Dispute resolved")).toBeVisible();
});
