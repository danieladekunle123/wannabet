import { test, expect } from "@playwright/test";
import path from "path";

test("user can upload a file", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "testuser@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.goto("/upload");
  const filePath = path.resolve(__dirname, "../frontend/src/assets/test.png");
  await page.setInputFiles('input[type="file"]', filePath);
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Upload successful")).toBeVisible();
});
