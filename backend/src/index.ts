import express from "express";
import cors from "cors";
import { env } from "./lib/env";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { walletRouter } from "./routes/wallet.routes";
import { matchRouter } from "./routes/match.routes";
import { tournamentRouter } from "./routes/tournament.routes";

const app = express();

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
app.use("/wallet", walletRouter);
app.use("/matches", matchRouter);
app.use("/tournaments", tournamentRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/users", userRouter);

app.get("/", (_req, res) => {
  res.send("WannaBet API is running. Try GET /health");
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
