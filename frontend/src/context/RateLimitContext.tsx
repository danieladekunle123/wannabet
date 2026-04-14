import { createContext, useContext, useState, useCallback } from "react";

type RateLimitContextType = {
  isRateLimited: boolean;
  retryAfter: number | null;
  setRateLimited: (limited: boolean, retryAfter?: number) => void;
};

const RateLimitContext = createContext<RateLimitContextType>({
  isRateLimited: false,
  retryAfter: null,
  setRateLimited: () => {},
});

/** Global event bus so non-React code (apiFetch) can trigger the overlay */
type RateLimitListener = (limited: boolean, retryAfter?: number) => void;
const listeners = new Set<RateLimitListener>();

export function onRateLimitChange(fn: RateLimitListener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function notifyRateLimit(limited: boolean, retryAfter?: number) {
  listeners.forEach((fn) => fn(limited, retryAfter));
}

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfterState] = useState<number | null>(null);

  const setRateLimited = useCallback((limited: boolean, retry?: number) => {
    setIsRateLimited(limited);
    setRetryAfterState(retry ?? null);
  }, []);

  // Subscribe to the global event bus
  useState(() => {
    const unsub = onRateLimitChange((limited, retry) => {
      setIsRateLimited(limited);
      setRetryAfterState(retry ?? null);
    });
    return unsub;
  });

  return (
    <RateLimitContext.Provider value={{ isRateLimited, retryAfter, setRateLimited }}>
      {children}
    </RateLimitContext.Provider>
  );
}

export function useRateLimit() {
  return useContext(RateLimitContext);
}
