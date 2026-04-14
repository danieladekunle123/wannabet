import React, { useEffect, useState } from "react";
import { LoadingPage } from "./LoadingPage";
import { useRateLimit } from "../context/RateLimitContext";

export function RateLimitOverlay() {
  const { isRateLimited, retryAfter } = useRateLimit();
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isRateLimited) {
      setCountdown(0);
      return;
    }

    const secs = retryAfter ?? 30;
    setCountdown(secs);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRateLimited, retryAfter]);

  if (!isRateLimited) return null;

  return (
    <LoadingPage
      messages={[
        "Hang tight — too many requests right now...",
        `Retrying automatically in ${countdown}s...`,
        "We're cooling things down for you...",
        "Almost ready to get back in action...",
      ]}
      autoRotate
      duration={3000}
    />
  );
}
