// Global setup for frontend tests
import "@testing-library/jest-dom";
import { vi } from "vitest";

// ─── Mock import.meta.env ──────────────────────────────────────────────────
(globalThis as any).import = {
  meta: { env: { VITE_API_URL: "http://localhost:4000" } },
};

// ─── Mock fetch globally ────────────────────────────────────────────────────
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve("{}"),
  } as Response),
);

// ─── Mock localStorage ──────────────────────────────────────────────────────
const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
});

// ─── Mock socket.io-client ──────────────────────────────────────────────────
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    connected: false,
  })),
}));

// ─── Mock motion/react (framer-motion) ──────────────────────────────────────
vi.mock("motion/react", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === "string") {
          return ({ children, ...props }: any) => {
            const Component = prop as any;
            return children;
          };
        }
        return undefined;
      },
    },
  ),
  AnimatePresence: ({ children }: any) => children,
}));

// ─── Mock @react-oauth/google ──────────────────────────────────────────────
vi.mock("@react-oauth/google", () => ({
  useGoogleLogin: vi.fn(() => vi.fn()),
  GoogleOAuthProvider: ({ children }: any) => children,
}));
