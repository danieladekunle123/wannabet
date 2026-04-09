import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

test.describe("Upload E2E", () => {
  test("upload URL endpoint requires auth", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/upload-url`, {
      data: { fileType: "image/png", context: "profile" },
    });
    expect(res.status()).toBe(401);
  });

  test("message upload endpoint requires auth", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/messages/upload`);
    expect(res.status()).toBe(401);
  });
});
