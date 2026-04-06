import { Router } from "express";
import { stripe, createPaymentIntent } from "../services/stripeService";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import type { Request, Response } from "express";

export const stripeRouter = Router();

// POST /stripe/payment-intent
// Authenticated — creates a PaymentIntent for a wallet deposit.
// Body: { amount: number }  — amount in CENTS
stripeRouter.post("/payment-intent", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const rawAmount = Number(req.body?.amount);

    if (
      !Number.isInteger(rawAmount) ||
      rawAmount < 50 ||
      rawAmount > 1_000_000
    ) {
      return res.status(400).json({
        message: "Amount must be an integer in cents between 50 and 1,000,000",
      });
    }

    const intent = await createPaymentIntent(userId, rawAmount);
    return res.json({ clientSecret: intent.client_secret, id: intent.id });
  } catch (err: any) {
    console.error("payment-intent error", err);
    return res.status(500).json({ message: err.message ?? "Internal error" });
  }
});

// POST /stripe/webhook
// Raw body required — Stripe signature verification.
// This route must be mounted BEFORE express.json() middleware.
stripeRouter.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  let event: import("stripe").Stripe.Event;

  // If a webhook secret is configured, verify the signature.
  // Without it (local dev without Stripe CLI), skip verification.
  if (webhookSecret && webhookSecret !== "whsec_placeholder" && sig) {
    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody ?? req.body,
        sig,
        webhookSecret,
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ message: "Invalid webhook signature" });
    }
  } else {
    // No secret configured — parse the event directly (dev/test only)
    event = req.body as import("stripe").Stripe.Event;
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as import("stripe").Stripe.PaymentIntent;
    await handlePaymentIntentSucceeded(intent);
  }

  return res.json({ received: true });
});

// POST /stripe/confirm-payment
// Backup endpoint for local dev (no Stripe CLI).
// Verifies a PaymentIntent server-side and credits wallet if succeeded & not already credited.
stripeRouter.post("/confirm-payment", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { paymentIntentId } = req.body as { paymentIntentId?: string };

    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId required" });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Security: ensure this PI belongs to the authenticated user
    if (intent.metadata?.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (intent.status !== "succeeded") {
      return res
        .status(400)
        .json({ message: `Payment not succeeded (status: ${intent.status})` });
    }

    // Check idempotency — was this PI already credited?
    const alreadyCredited = await prisma.ledgerEntry.findFirst({
      where: { stripePaymentIntentId: intent.id },
    });
    if (alreadyCredited) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: { id: true, balance: true, escrow: true },
      });
      return res.json({ alreadyCredited: true, wallet });
    }

    const wallet = await creditWalletForPaymentIntent(intent);
    return res.json({ credited: true, wallet });
  } catch (err: any) {
    console.error("confirm-payment error", err);
    return res.status(500).json({ message: err.message ?? "Internal error" });
  }
});

// ─── Internal helper ──────────────────────────────────────────────────────────

async function handlePaymentIntentSucceeded(
  intent: import("stripe").Stripe.PaymentIntent,
): Promise<void> {
  // Idempotency: skip if already credited
  const existing = await prisma.ledgerEntry.findFirst({
    where: { stripePaymentIntentId: intent.id },
  });
  if (existing) return;

  await creditWalletForPaymentIntent(intent);
}

async function creditWalletForPaymentIntent(
  intent: import("stripe").Stripe.PaymentIntent,
) {
  const userId = intent.metadata?.userId;
  if (!userId) {
    console.error("PaymentIntent has no userId in metadata:", intent.id);
    return null;
  }

  const wallet = await prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: 0, escrow: 0 },
    update: {},
    select: { id: true, balance: true, escrow: true },
  });

  const amountCents = intent.amount; // already in cents

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amountCents } },
      select: { id: true, balance: true, escrow: true },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: "deposit",
        amount: amountCents,
        stripePaymentIntentId: intent.id,
      },
    });

    return updated;
  });

  return result;
}
