import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";

export async function registerUser(input: {
  email: string;
  username: string;
  password: string;
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

  const existingUsername = await prisma.user.findUnique({
    where: { username: input.username },
    select: { id: true },
  });

  if (existingUsername) {
    const err: any = new Error("This username is already taken.");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      wallet: {
        create: {
          balance: 0,
        },
      },
      profile: {
        create: {
          displayName: input.username,
          bio: "",
          country: null,
          level: 1,
          trustScore: 100,
        },
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
    },
  });

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, user };
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
