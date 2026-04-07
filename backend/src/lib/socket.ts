import { Server } from "socket.io";

let io: Server | null = null;

export function setIo(server: Server) {
  io = server;
}

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

/** Broadcast an event update to all connected clients */
export function emitEventUpdate(eventId: string) {
  if (!io) return;
  io.emit("event:updated", { eventId });
}
