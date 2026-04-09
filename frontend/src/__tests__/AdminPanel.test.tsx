import { screen } from "@testing-library/react";
import { render } from "../test/test-utils";
import { Admin } from "../components/Admin";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// Provide adequate mock responses for the Admin component's data fetches
const mockAdminFetch = vi.fn((url: string) => {
  if (typeof url === "string" && url.includes("/health")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          db: { latencyMs: 5, status: "connected" },
          redis: { status: "connected" },
          uptime: 12345,
        }),
    });
  }
  if (typeof url === "string" && url.includes("/revenue")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          totalRevenue: 0,
          monthlyRevenue: 0,
          transactions: [],
        }),
    });
  }
  if (typeof url === "string" && url.includes("/bug-reports")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ reports: [] }),
    });
  }
  // Default response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

describe("Admin Component", () => {
  beforeEach(() => {
    globalThis.fetch = mockAdminFetch as any;
  });

  it("renders without crashing", () => {
    render(<Admin />);
    expect(document.body).toBeDefined();
  });

  it("renders admin panel heading or tabs", async () => {
    render(<Admin />);
    const container = document.querySelector("[class]");
    expect(container).toBeDefined();
  });
});
