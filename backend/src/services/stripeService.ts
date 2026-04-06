import Stripe from "stripe";
import { env } from "../lib/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

/**
 * Create a Stripe PaymentIntent for a wallet deposit.
 * @param userId  used as metadata for webhook reconciliation
 * @param amountCents  amount in cents (integer)
 */
export async function createPaymentIntent(
  userId: string,
  amountCents: number,
): Promise<Stripe.PaymentIntent> {
  if (!Number.isInteger(amountCents) || amountCents < 50) {
    throw new Error("Amount must be an integer in cents and at least $0.50");
  }
  if (amountCents > 1_000_000) {
    throw new Error("Amount exceeds maximum deposit limit");
  }

  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { userId },
  });
}
