import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Admin E2E", () => {
  test("ban endpoint requires mod role", async ({ request }) => {
    const ts = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        email: `e2e_admin_${ts}@test.com`,
        username: `e2e_admin_${ts}`,
        password: "TestPass123!",
      },
    });
    if (!registerRes.ok()) return;
    const { token } = await registerRes.json();

    // PLAYER cannot ban
    const res = await request.post(`${BASE_URL}/users/some-user-id/ban`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { reason: "test" },
    });
    expect(res.status()).toBe(403);
  });

  test("platform config is publicly accessible", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/users/config`);
    expect(res.ok()).toBeTruthy();
  });
});
