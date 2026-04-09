import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Match E2E", () => {
  test("match creation via API", async ({ request }) => {
    const ts = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        email: `e2e_match_${ts}@test.com`,
        username: `e2e_match_${ts}`,
        password: "TestPass123!",
      },
    });
    if (!registerRes.ok()) return;
    const { token } = await registerRes.json();

    const matchRes = await request.post(`${BASE_URL}/matches`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        game: "Valorant",
        stake: 0,
        matchType: "scrim",
        title: `E2E Match ${ts}`,
      },
    });
    expect([200, 201]).toContain(matchRes.status());
  });

  test("featured matches endpoint is public", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/matches/featured`);
    expect(res.ok()).toBeTruthy();
  });

  test("events listings are public", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/events/active`);
    expect(res.ok()).toBeTruthy();
  });
});
