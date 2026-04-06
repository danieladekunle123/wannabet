type UserPresence = {
  socketId: string;
  lastActive: Date;
  manualStatus: string | null; // "dnd" | null
};

const presenceMap = new Map<string, UserPresence>();

export function setPresence(
  userId: string,
  socketId: string,
  manualStatus: string | null = null,
) {
  presenceMap.set(userId, { socketId, lastActive: new Date(), manualStatus });
}

export function updateActivity(userId: string) {
  const entry = presenceMap.get(userId);
  if (entry) entry.lastActive = new Date();
}

export function removePresence(userId: string) {
  presenceMap.delete(userId);
}

export function setManualStatus(userId: string, status: string | null) {
  const entry = presenceMap.get(userId);
  if (entry) entry.manualStatus = status;
}

export function getUserStatus(
  userId: string,
): "online" | "idle" | "dnd" | "offline" {
  const entry = presenceMap.get(userId);
  if (!entry) return "offline";

  if (entry.manualStatus === "dnd") return "dnd";

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (entry.lastActive >= fiveMinutesAgo) return "online";

  return "idle";
}

export function getPresenceEntry(userId: string): UserPresence | undefined {
  return presenceMap.get(userId);
}

export function getAllPresence() {
  return presenceMap;
}
