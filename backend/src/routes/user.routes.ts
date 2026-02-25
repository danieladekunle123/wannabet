import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const userRouter = Router();

userRouter.get("/me", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      wallet: {
        select: {
          id: true,
          balance: true,
          escrow: true,
        },
      },
    },
  });

  res.json({ user });
});
