import { Router } from "express";
import { z, ZodError } from "zod";
import { loginUser, registerUser } from "../services/auth.service";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { getUserRegion } from "../services/ipinfoService";
import { resolveClientIp } from "../lib/clientIp";
import { getConfig } from "../lib/platformConfig";
import { checkRateLimit } from "../services/redis";
import { sendVerificationEmail } from "../services/emailService";

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24),
  password: z.string().min(8).max(72),
});

authRouter.post("/register", async (req, res) => {
  try {
    const config = await getConfig();
    if (!config.registrationEnabled) {
      return res
        .status(403)
        .json({ message: "New registrations are currently disabled." });
    }
    const body = RegisterSchema.parse(req.body);
    const result = await registerUser({ ...body, ip: resolveClientIp(req).ip });
    res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: err.issues.map((i: any) => i.message).join(", "),
      });
    }
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
    const ip = resolveClientIp(req).ip;
    const { allowed } = await checkRateLimit(`rate:login:${ip}`, 10);
    if (!allowed) {
      res.setHeader("Retry-After", "60");
      return res
        .status(429)
        .json({ message: "Too many login attempts. Try again later." });
    }

    const body = LoginSchema.parse(req.body);
    const result = await loginUser(body);
    res.json(result);
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: err.issues.map((i: any) => i.message).join(", "),
      });
    }
    res
      .status(err.status ?? 400)
      .json({ message: err.message ?? "Bad request", ...(err.code ? { code: err.code } : {}) });
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
      return res.status(404).json({
        message:
          "No account found for this Google account. Please sign up first.",
      });
    }

    if (mode === "signup" && user) {
      return res.status(409).json({
        message:
          "This Google account is already registered. Please sign in instead.",
      });
    }

    // Block new signups when registrations are disabled
    if (mode === "signup" || !user) {
      const config = await getConfig();
      if (!config.registrationEnabled) {
        return res
          .status(403)
          .json({ message: "New registrations are currently disabled." });
      }
    }

    if (!user) {
      let detectedCountry: string | null = null;
      let detectedRegion: string | null = null;
      let detectedContinent: string | null = null;

      try {
        const detection = await getUserRegion(resolveClientIp(req).ip);
        detectedCountry = detection.country;
        detectedRegion = detection.region || detection.matchmakingRegion;
        detectedContinent = detection.continent;
      } catch {
        // Region detection should not block Google signup.
      }

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
          isVerified: true,
          wallet: { create: { balance: 0 } },
          profile: {
            create: {
              displayName: name || uniqueUsername,
              bio: "",
              country: detectedCountry,
              region: detectedRegion,
              continent: detectedContinent,
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
          isVerified: true,
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

// GET /auth/verify-email?token=...
authRouter.get("/verify-email", async (req, res) => {
  const { token } = req.query as { token?: string };

  if (!token) {
    return res.status(400).json({ message: "Missing verification token." });
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid or expired verification link." });
  }

  if (
    !user.emailVerificationExpires ||
    user.emailVerificationExpires < new Date()
  ) {
    return res.status(400).json({
      message:
        "This verification link has expired. Please request a new one.",
      code: "TOKEN_EXPIRED",
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  return res.json({ message: "Email verified successfully. You can now log in." });
});

// POST /auth/resend-verification
authRouter.post("/resend-verification", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  // Rate limit: max 3 resends per hour per IP
  const ip = resolveClientIp(req).ip;
  const { allowed } = await checkRateLimit(`rate:resend-verify:${ip}`, 3);
  if (!allowed) {
    res.setHeader("Retry-After", "3600");
    return res
      .status(429)
      .json({ message: "Too many requests. Please try again later." });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid leaking whether email exists
  if (!user || user.isVerified) {
    return res.json({
      message:
        "If that email is registered and unverified, a new link has been sent.",
    });
  }

  const newToken = crypto.randomBytes(32).toString("hex");
  const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: newToken,
      emailVerificationExpires: newExpires,
    },
  });

  sendVerificationEmail(email, newToken).catch((err) =>
    console.error("[auth] Failed to resend verification email:", err),
  );

  return res.json({
    message:
      "If that email is registered and unverified, a new link has been sent.",
  });
});
