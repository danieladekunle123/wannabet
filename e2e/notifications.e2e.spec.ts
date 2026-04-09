import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Notifications E2E", () => {
  test("user events require auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/events/my`);
    expect(res.status()).toBe(401);
  });

  test("recommended events require auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/events/recommended`);
    expect(res.status()).toBe(401);
  });
});
