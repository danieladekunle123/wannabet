import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  IPINFO_TOKEN: z.string().optional(),
  PANDASCORE_TOKEN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional().default(""),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().optional().default("daniel@wannabet.online"),
  FRONTEND_URL: z.string().optional().default("http://localhost:3000"),
});

export const env = EnvSchema.parse(process.env);
