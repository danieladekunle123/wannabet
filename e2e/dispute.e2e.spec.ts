import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Dispute E2E", () => {
  test("dispute list requires mod role", async ({ request }) => {
    const ts = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        email: `e2e_disp_${ts}@test.com`,
        username: `e2e_disp_${ts}`,
        password: "TestPass123!",
      },
    });
    if (!registerRes.ok()) return;
    const { token } = await registerRes.json();

    // PLAYER should be denied dispute listing
    const res = await request.get(`${BASE_URL}/disputes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test("dispute stats requires mod role", async ({ request }) => {
    const ts = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        email: `e2e_dstat_${ts}@test.com`,
        username: `e2e_dstat_${ts}`,
        password: "TestPass123!",
      },
    });
    if (!registerRes.ok()) return;
    const { token } = await registerRes.json();

    const res = await request.get(`${BASE_URL}/disputes/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
