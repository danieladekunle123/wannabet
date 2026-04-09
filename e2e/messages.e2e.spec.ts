import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Messages E2E", () => {
  test("conversations list requires auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/messages/conversations`);
    expect(res.status()).toBe(401);
  });

  test("sending message requires auth", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/messages`, {
      data: { conversationId: "fake", content: "hello" },
    });
    expect(res.status()).toBe(401);
  });
});
