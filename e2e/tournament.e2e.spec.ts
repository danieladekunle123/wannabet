import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Tournament E2E", () => {
  test("tournaments listing is public", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/tournaments`);
    expect(res.ok()).toBeTruthy();
  });

  test("tournament events listing is public", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/events/tournaments`);
    expect(res.ok()).toBeTruthy();
  });

  test("tournament creation requires auth", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/tournaments`, {
      data: {
        name: "E2E Test",
        game: "Valorant",
        format: "single_elimination",
      },
    });
    expect(res.status()).toBe(401);
  });
});
