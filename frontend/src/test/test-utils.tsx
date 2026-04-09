import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";

// ─── Mock AuthContext ─────────────────────────────────────────────────────────
const defaultAuth = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    username: "testuser",
    role: "PLAYER",
    createdAt: new Date().toISOString(),
    wallet: { balance: 10000, escrow: 0 },
    profile: { trustScore: 87, displayName: "Test User" },
  },
  token: "test-jwt-token",
  isAuthenticated: true,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  completeOnboarding: vi.fn(),
};

// ─── Mock CurrencyContext ────────────────────────────────────────────────────
const defaultCurrency = {
  currency: "EUR" as const,
  setCurrency: vi.fn(),
  rates: { EUR: 1, USD: 1.08, GBP: 0.86 },
};

// ─── Mock PresenceContext ───────────────────────────────────────────────────
const defaultPresence = {
  getStatus: vi.fn(() => "offline" as const),
  getLastSeen: vi.fn(() => null),
  setManualStatus: vi.fn(),
  watchUsers: vi.fn(),
  isUserOnline: vi.fn(() => false),
  onlineUsers: new Set<string>(),
  socket: null,
};

// ─── Mock ThemeContext ──────────────────────────────────────────────────────
const defaultTheme = {
  mode: "dark" as const,
  color: "blue" as const,
  setMode: vi.fn(),
  setColor: vi.fn(),
  toggleMode: vi.fn(),
};

// ─── Create mock context modules ────────────────────────────────────────────
vi.mock("../components/AuthContext", () => ({
  useAuth: () => defaultAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../context/CurrencyContext", () => ({
  useCurrency: () => defaultCurrency,
  CurrencyProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../context/PresenceContext", () => ({
  usePresence: () => defaultPresence,
  PresenceProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../components/ThemeContext", () => ({
  useTheme: () => defaultTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Custom render that wraps in providers ──────────────────────────────────
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { ...options });
}

export {
  customRender as render,
  defaultAuth,
  defaultCurrency,
  defaultPresence,
  defaultTheme,
};
