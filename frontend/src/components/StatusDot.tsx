import React from "react";
import { usePresence, type UserStatus } from "../context/PresenceContext";

const statusColors: Record<UserStatus, string> = {
  online: "bg-emerald-500",
  idle: "bg-yellow-400",
  dnd: "bg-red-500",
  offline: "bg-gray-400",
};

const statusLabels: Record<UserStatus, string> = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Offline",
};

interface StatusDotProps {
  userId: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function StatusDot({
  userId,
  size = "sm",
  showLabel = false,
  className = "",
}: StatusDotProps) {
  const { getStatus } = usePresence();
  const status = getStatus(userId);

  const sizeClass = { sm: "w-2 h-2", md: "w-2.5 h-2.5", lg: "w-3 h-3" }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      <span
        className={`${sizeClass} rounded-full shrink-0 ${statusColors[status]}`}
        title={statusLabels[status]}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {statusLabels[status]}
        </span>
      )}
    </span>
  );
}

/** Returns just the hex/tailwind color string for inline use */
export function useStatusColor(userId: string): string {
  const { getStatus } = usePresence();
  return statusColors[getStatus(userId)];
}
