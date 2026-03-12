import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { setIo } from "./lib/socket";
import { env } from "./lib/env";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { walletRouter } from "./routes/wallet.routes";
import { messagesRouter } from "./routes/messages.routes";
import { matchRouter } from "./routes/match.routes";
import { tournamentRouter } from "./routes/tournament.routes";
import { searchRouter } from "./routes/search.routes";

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: [
      "http://localhost:3000", // React dev server
      "http://localhost:5173", // Vite (optional / legacy)
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/wallet", walletRouter);
app.use("/matches", matchRouter);
app.use("/tournaments", tournamentRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/messages", messagesRouter);
app.use("/search", searchRouter);

app.get("/", (_req, res) => {
  res.send("WannaBet API is running. Try GET /health");
});

const io = new IOServer(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002"],
    credentials: true,
  },
});

// socket auth middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.toString().replace(/^Bearer\s+/i, '');
    if (!token) return next(new Error('Authentication error'));
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    (socket as any).data.userId = payload.userId;
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);
  const userId = (socket as any).data.userId;
  if (userId) {
    // join personal room
    socket.join(`user:${userId}`);
  }

  socket.on("join", (room: string) => {
    socket.join(room);
  });

  socket.on("leave", (room: string) => {
    socket.leave(room);
  });

  socket.on("message", (payload) => {
    // payload: {room, message}
    if (payload?.room) {
      io.to(payload.room).emit("message", payload.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
  });
});

setIo(io);

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
