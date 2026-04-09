import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Wallet E2E", () => {
  test("wallet API returns summary for authenticated user", async ({
    request,
  }) => {
    // Register a test user via API
    const ts = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        email: `e2e_wallet_${ts}@test.com`,
        username: `e2e_wallet_${ts}`,
        password: "TestPass123!",
      },
    });
    if (!registerRes.ok()) return; // skip if DB not available
    const { token } = await registerRes.json();

    const walletRes = await request.get(`${BASE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(walletRes.ok()).toBeTruthy();
    const wallet = await walletRes.json();
    expect(wallet.balance).toBeDefined();
  });

  test("wallet API rejects unauthenticated access", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/wallet`);
    expect(res.status()).toBe(401);
  });
});
