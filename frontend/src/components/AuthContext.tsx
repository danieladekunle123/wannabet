import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const API_URL = "http://localhost:4000";

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

export type User = {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  profileImageUrl?: string | null;
  hasCompletedOnboarding?: boolean;
  createdAt: string;
  wallet?: {
    balance: number;
    escrow: number;
  };
  profile?: {
    displayName?: string | null;
    bio?: string | null;
    country?: string | null;
    region?: string | null;
    continent?: string | null;
    trustScore?: number | null;
  };
  role?: "PLAYER" | "MODERATOR" | "ADMIN";
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  const isAuthenticated = !!user;

  async function refreshUser(jwt?: string) {
    const tokenToUse = jwt || token;
    if (!tokenToUse) return;
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokenToUse}` },
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    // If the server returns no user (e.g. deleted account with stale token), force logout.
    if (!data.user) {
      logout();
      return;
    }
    const normalizedUser = {
      ...data.user,
      profileImageUrl:
        data.user?.profileImageUrl ?? data.user?.avatarUrl ?? null,
    };
    // compute total earnings from ledger if available
    try {
      const ledger = await api.getMyLedger();
      const entries = ledger.entries || [];
      const total = entries.reduce((sum: number, e: any) => {
        const t = (e.type || "").toString().toLowerCase();
        // count payouts/releases/wins as earnings
        if (
          (t === "payout" || t === "escrow_release" || t === "win") &&
          (e.amount || 0) > 0
        ) {
          return sum + Number(e.amount || 0);
        }
        return sum;
      }, 0);
      setUser({
        ...normalizedUser,
        totalEarnings: total,
        role: normalizedUser?.role,
      });
    } catch (err) {
      // fallback to user without earnings
      setUser({ ...normalizedUser, role: normalizedUser?.role });
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
    await refreshUser(data.token);
  }

  async function signup(email: string, username: string, password: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Signup failed");
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
    await refreshUser(data.token);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  async function completeOnboarding() {
    const tokenToUse = token || localStorage.getItem("token");
    if (!tokenToUse) return;

    const res = await fetch(`${API_URL}/users/me/onboarding`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenToUse}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    // User no longer exists in DB (stale token) — force logout.
    if (res.status === 404) {
      logout();
      return;
    }

    if (!res.ok) {
      throw new Error(data?.message || "Failed to complete onboarding");
    }

    await refreshUser(tokenToUse);
  }

  useEffect(() => {
    if (token) {
      refreshUser(token).catch(() => logout());
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshUser,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
