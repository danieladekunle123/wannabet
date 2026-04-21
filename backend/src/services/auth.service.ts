import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { getUserRegion } from "./ipinfoService";
import { sendVerificationEmail } from "./emailService";

export async function registerUser(input: {
  email: string;
  username: string;
  password: string;
  ip?: string | null;
}) {
  const existingEmail = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingEmail) {
    const err: any = new Error("An account with this email already exists.");
    err.status = 409;
    throw err;
  }

  const existingUsername = await prisma.user.findFirst({
    where: {
      username: {
        equals: input.username,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existingUsername) {
    const err: any = new Error("This username is already taken.");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  let detectedCountry: string | null = null;
  let detectedRegion: string | null = null;
  let detectedContinent: string | null = null;

  try {
    const detection = await getUserRegion(input.ip);
    detectedCountry = detection.country;
    detectedRegion = detection.region || detection.matchmakingRegion;
    detectedContinent = detection.continent;
  } catch {
    // Region detection should not block signup.
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      isVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      wallet: {
        create: {
          balance: 0,
        },
      },
      profile: {
        create: {
          displayName: input.username,
          bio: "",
          country: detectedCountry,
          region: detectedRegion,
          continent: detectedContinent,
          level: 1,
          trustScore: 100,
        } as any,
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
    },
  });

  // Send verification email (non-blocking)
  sendVerificationEmail(input.email, emailVerificationToken).catch((err) =>
    console.error("[auth] Failed to send verification email:", err),
  );

  return {
    message:
      "Account created. Please check your email to verify your account before logging in.",
    user: { id: user.id, email: user.email, username: user.username },
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    const err: any = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    const err: any = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  if (!user.isVerified) {
    const err: any = new Error(
      "Please verify your email before logging in. Check your inbox for the verification link.",
    );
    err.status = 403;
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    },
  };
}

export async function loginOrRegisterGoogleUser({
  email,
  username,
  googleId,
  avatarUrl,
}: {
  email: string;
  username: string;
  googleId: string;
  avatarUrl?: string;
}) {
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username,
        googleId,
        avatarUrl,
        profileImageUrl: avatarUrl,
        wallet: { create: {} },
        profile: {
          create: {
            displayName: username,
            bio: "",
            country: null,
            level: 1,
            trustScore: 100,
          },
        },
      },
    });
  } else if (avatarUrl && !user.profileImageUrl) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId || googleId,
        avatarUrl,
        profileImageUrl: avatarUrl,
      },
    });
  }

  const token = signJwt({ userId: user.id });

  return { token, user };
}
