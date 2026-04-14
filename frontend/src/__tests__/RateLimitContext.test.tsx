import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "../test/test-utils";
import {
  notifyRateLimit,
  onRateLimitChange,
} from "../context/RateLimitContext";

describe("RateLimitContext — event bus", () => {
  it("notifies listeners when rate limited", () => {
    const listener = vi.fn();
    const unsub = onRateLimitChange(listener);

    notifyRateLimit(true, 30);

    expect(listener).toHaveBeenCalledWith(true, 30);

    unsub();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsub = onRateLimitChange(listener);

    unsub();
    notifyRateLimit(true, 60);

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies multiple listeners", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const unsub1 = onRateLimitChange(listener1);
    const unsub2 = onRateLimitChange(listener2);

    notifyRateLimit(true, 15);

    expect(listener1).toHaveBeenCalledWith(true, 15);
    expect(listener2).toHaveBeenCalledWith(true, 15);

    unsub1();
    unsub2();
  });

  it("can reset rate limit state", () => {
    const listener = vi.fn();
    const unsub = onRateLimitChange(listener);

    notifyRateLimit(false);

    expect(listener).toHaveBeenCalledWith(false, undefined);

    unsub();
  });
});

describe("RateLimitContext — 429 detection via apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers rate limit notification on 429 response", async () => {
    const listener = vi.fn();
    const unsub = onRateLimitChange(listener);

    // Mock fetch to return 429
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "45" }),
        text: () =>
          Promise.resolve(
            JSON.stringify({
              message: "Too many requests. Please try again later.",
            }),
          ),
      } as Response),
    );

    // Dynamically import api to use the mocked fetch
    const { default: api } = await import("../lib/api");

    try {
      await api.getMyWallet();
    } catch {
      // Expected to throw since ok:false
    }

    expect(listener).toHaveBeenCalledWith(true, 45);

    unsub();
  });
});
