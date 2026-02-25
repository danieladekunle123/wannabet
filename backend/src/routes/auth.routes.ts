import { Router } from "express";
import { z } from "zod";
import { loginUser, registerUser } from "../services/auth.service";

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24),
  password: z.string().min(8).max(72),
});

authRouter.post("/register", async (req, res) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const result = await registerUser(body);
    res.status(201).json(result);
  } catch (err: any) {
    res
      .status(err.status ?? 400)
      .json({ message: err.message ?? "Bad request" });
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  try {
    const body = LoginSchema.parse(req.body);
    const result = await loginUser(body);
    res.json(result);
  } catch (err: any) {
    res
      .status(err.status ?? 400)
      .json({ message: err.message ?? "Bad request" });
  }
});
