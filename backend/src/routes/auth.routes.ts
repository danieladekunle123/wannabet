import { Router } from "express";
import { z } from "zod";
import { loginUser, registerUser } from "../services/auth.service";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

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

authRouter.post("/google", async (req, res) => {
  const { code, redirectUri, mode } = req.body as {
    code?: string;
    redirectUri?: string;
    mode?: "signin" | "signup";
  };

  if (!code) {
    return res.status(400).json({ message: "Missing auth code" });
  }

  const finalRedirectUri = (
    redirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    ""
  ).trim();
  if (!finalRedirectUri) {
    return res
      .status(500)
      .json({ message: "Google redirect URI is not configured" });
  }

  try {
    // 1️⃣ Exchange auth code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: finalRedirectUri,
      grant_type: "authorization_code",
    });

    const { access_token } = tokenRes.data;

    // 2️⃣ Fetch Google profile
    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const { email, id: googleId, name, picture } = userRes.data;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    // 3️⃣ Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (mode === "signin" && !user) {
      return res
        .status(404)
        .json({
          message:
            "No account found for this Google account. Please sign up first.",
        });
    }

    if (mode === "signup" && user) {
      return res
        .status(409)
        .json({
          message:
            "This Google account is already registered. Please sign in instead.",
        });
    }

    if (!user) {
      const baseUsername = (name || email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const uniqueUsername = `${baseUsername}_${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

      user = await prisma.user.create({
        data: {
          email,
          username: uniqueUsername,
          googleId,
          avatarUrl: picture,
          profileImageUrl: picture,
          wallet: { create: { balance: 0 } },
          profile: {
            create: {
              displayName: name || uniqueUsername,
              bio: "",
              country: null,
              level: 1,
              trustScore: 100,
            },
          },
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId,
          ...(picture && !user.profileImageUrl
            ? {
                avatarUrl: picture,
                profileImageUrl: picture,
              }
            : {}),
        },
      });
    }

    // 4️⃣ Issue JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({ token });
  } catch (err: any) {
    const details = err.response?.data;
    console.error("Google auth error:", details || err);
    const upstreamMessage = details?.error_description || details?.error;
    res
      .status(400)
      .json({ message: upstreamMessage || "Google authentication failed" });
  }
});
