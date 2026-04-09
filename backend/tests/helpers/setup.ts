// Global test setup for backend
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { createServer } from "http";
import { Server } from "socket.io";
import { setIo } from "../../src/lib/socket";
import { closeRedisConnections } from "../../src/services/redis";

// Initialize a minimal Socket.io instance for tests that need it
const httpServer = createServer();
const io = new Server(httpServer);
setIo(io);

beforeAll(async () => {
  // e.g., connect to test DB
});
afterAll(async () => {
  io.close();
  await closeRedisConnections();
});
