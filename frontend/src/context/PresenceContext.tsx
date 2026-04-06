import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../components/AuthContext";

export type UserStatus = "online" | "idle" | "dnd" | "offline";

type PresenceContextType = {
  getStatus: (userId: string) => UserStatus;
  getLastSeen: (userId: string) => string | null;
  setManualStatus: (status: UserStatus) => Promise<void>;
  watchUsers: (userIds: string[]) => void;
};

const PresenceContext = createContext<PresenceContextType>({
  getStatus: () => "offline",
  getLastSeen: () => null,
  setManualStatus: async () => {},
  watchUsers: () => {},
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});
  const [lastSeens, setLastSeens] = useState<Record<string, string | null>>({});
  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchedRef = useRef<Set<string>>(new Set());

  // Fetch presence snapshot for a list of user IDs (REST fallback + initial load)
  const fetchPresence = useCallback(async (userIds: string[]) => {
    if (!userIds.length) return;
    try {
      const res = await fetch(
        `${API_URL}/users/presence?userIds=${encodeURIComponent(userIds.join(","))}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const p: Record<string, { status: UserStatus; lastSeen: string | null }> =
        data.presence || {};
      setStatuses((prev) => {
        const next = { ...prev };
        for (const [uid, v] of Object.entries(p)) next[uid] = v.status;
        return next;
      });
      setLastSeens((prev) => {
        const next = { ...prev };
        for (const [uid, v] of Object.entries(p))
          next[uid] = v.lastSeen ?? null;
        return next;
      });
    } catch {
      // Silently fail — socket events will keep things up to date
    }
  }, []);

  // Connect socket and set up listeners
  useEffect(() => {
    if (!token || !user) return;

    const socket = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Fetch initial presence for already-watched users
      if (watchedRef.current.size > 0) {
        fetchPresence(Array.from(watchedRef.current));
      }
    });

    socket.on(
      "user:status_change",
      ({ userId, status }: { userId: string; status: UserStatus }) => {
        setStatuses((prev) => ({ ...prev, [userId]: status }));
      },
    );

    socket.on("user:offline", ({ userId }: { userId: string }) => {
      setStatuses((prev) => ({ ...prev, [userId]: "offline" }));
    });

    // Activity heartbeat every 30 s
    heartbeatRef.current = setInterval(() => {
      socket.emit("activity_ping");
    }, 30_000);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [token, user?.id, fetchPresence]);

  // Register user IDs to watch and fetch their initial presence
  const watchUsers = useCallback(
    (userIds: string[]) => {
      const fresh = userIds.filter((id) => !watchedRef.current.has(id));
      if (!fresh.length) return;
      for (const id of fresh) watchedRef.current.add(id);
      fetchPresence(fresh);
    },
    [fetchPresence],
  );

  const getStatus = useCallback(
    (userId: string): UserStatus => statuses[userId] ?? "offline",
    [statuses],
  );

  const getLastSeen = useCallback(
    (userId: string): string | null => lastSeens[userId] ?? null,
    [lastSeens],
  );

  const setManualStatus = useCallback(
    async (status: UserStatus) => {
      if (!socketRef.current || !user) return;
      socketRef.current.emit("set_status", { status });
      setStatuses((prev) => ({ ...prev, [user.id]: status }));
    },
    [user?.id],
  );

  return (
    <PresenceContext.Provider
      value={{ getStatus, getLastSeen, setManualStatus, watchUsers }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
