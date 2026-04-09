import { uploadFile } from "../services/uploadService";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ─── Test the upload service (pure logic, no component rendering needed) ────

describe("Upload Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects disallowed file types", async () => {
    const file = new File(["test"], "test.exe", {
      type: "application/x-msdownload",
    });
    await expect(uploadFile(file, "profile")).rejects.toThrow(
      /file type not allowed/i,
    );
  });

  it("rejects oversized images", async () => {
    // Create a file > 5 MB
    const bigContent = new Uint8Array(6 * 1024 * 1024);
    const file = new File([bigContent], "big.png", { type: "image/png" });
    await expect(uploadFile(file, "profile")).rejects.toThrow(/too large/i);
  });

  it("allows valid image types", async () => {
    const file = new File(["pixel"], "test.png", { type: "image/png" });
    // Mock fetch: first call returns presigned URL, second call is the S3 PUT
    let callCount = 0;
    globalThis.fetch = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              uploadUrl: "https://s3.example.com/upload",
              fileUrl: "https://s3.example.com/test.png",
            }),
        } as Response);
      }
      return Promise.resolve({ ok: true } as Response);
    });
    const url = await uploadFile(file, "profile");
    expect(url).toBe("https://s3.example.com/test.png");
  });
});
