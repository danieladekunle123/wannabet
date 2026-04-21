import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "../lib/api";
import { useAuth } from "./AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  ArrowDownLeft,
  Shield,
  Check,
  AlertCircle,
  Info,
  Lock,
  TrendingUp,
  Zap,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface DepositFundsProps {
  onNavigate?: (tab: string) => void;
}

// ─── Inner form — needs to be inside <Elements> ───────────────────────────────
function StripeDepositForm({
  amountCents,
  amountDollars,
  currentBalance,
  onSuccess,
  onBack,
}: {
  amountCents: number;
  amountDollars: number;
  currentBalance: number;
  onSuccess: (intentId: string) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { currency, rates } = useCurrency();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const fee = amountDollars * 0.02;
  const totalCharge = amountDollars + fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setCardError(null);

    try {
      // 1) Create PaymentIntent on backend (amount in cents)
      const { clientSecret, id: intentId } =
        await api.createPaymentIntent(amountCents);

      if (!clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      // 2) Confirm card payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not mounted");

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card: cardElement },
        },
      );

      if (error) {
        setCardError(error.message ?? "Payment failed");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // 3) Confirm on backend (credits wallet — works without Stripe CLI)
        await api.confirmStripePayment(intentId);
        onSuccess(intentId);
      } else {
        setCardError(`Unexpected status: ${paymentIntent?.status}`);
      }
    } catch (err: any) {
      setCardError(err?.message ?? "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Card Details
          </CardTitle>
          <CardDescription>
            Powered by Stripe — your card info is never sent to our servers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stripe Card Element */}
          <div className="space-y-2">
            <Label>Card information</Label>
            <div className="border border-input rounded-md px-3 py-3 bg-input-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "hsl(var(--foreground))",
                      backgroundColor: "transparent",
                      "::placeholder": {
                        color: "hsl(var(--muted-foreground))",
                      },
                    },
                    invalid: { color: "hsl(var(--destructive))" },
                  },
                  hidePostalCode: false,
                }}
              />
            </div>
            {cardError && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {cardError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Payments are currently in Stripe test mode � no real charges will
              be made.
            </p>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit amount</span>
              <span className="font-medium">
                {formatCurrencyFromEur(amountDollars, currency, rates)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing fee (2%)</span>
              <span className="font-medium">
                {formatCurrencyFromEur(fee, currency, rates)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total charged</span>
              <span className="font-bold text-primary">
                {formatCurrencyFromEur(totalCharge, currency, rates)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposited to wallet</span>
              <span className="font-bold text-emerald-400">
                {formatCurrencyFromEur(amountDollars, currency, rates)}
              </span>
            </div>
          </div>

          <Card className="bg-blue-600/5 border-blue-600/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Payment secured by Stripe. We never store your card details.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={processing}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={!stripe || processing}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto sm:min-w-[200px]"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Pay {formatCurrencyFromEur(totalCharge, currency, rates)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Outer Shell ──────────────────────────────────────────────────────────────
export function DepositFunds({ onNavigate }: DepositFundsProps) {
  const [step, setStep] = useState(1); // 1: Amount  2: Card  3: Success
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [completedIntentId, setCompletedIntentId] = useState<string | null>(
    null,
  );
  const [snapshotBalance, setSnapshotBalance] = useState(0);

  const { user, refreshUser } = useAuth();
  const { currency, rates } = useCurrency();
  // balance stored in cents, display in dollars
  const currentBalanceCents = user?.wallet?.balance ?? 0;
  const currentBalanceDollars = currentBalanceCents / 100;

  const quickAmounts = [50, 100, 250, 500, 1000, 2500]; // dollars

  const amountDollars = parseFloat(amount || "0");
  const amountCents = Math.round(amountDollars * 100); // convert to cents for Stripe

  const minAmount = 10; // dollars
  const maxAmount = 10000; // dollars

  const amountOverLimit = amountDollars > maxAmount;
  const amountUnderMin = amount !== "" && amountDollars < minAmount;
  const canProceedStep1 =
    amount !== "" && amountDollars >= minAmount && !amountOverLimit;

  const handleAmountSelect = (value: string) => {
    setAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount(value);
  };

  const progressPercentage = (step / 3) * 100;

  const handlePaymentSuccess = async (intentId: string) => {
    setCompletedIntentId(intentId);
    setSnapshotBalance(currentBalanceCents);
    await refreshUser();
    setStep(3);
  };

  return (
    <div className="space-y-6 animate-fadeInUp max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            step === 1 ? onNavigate?.("wallet-escrow") : setStep(step - 1)
          }
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2">
            <ArrowDownLeft className="h-6 w-6 text-primary" />
            Deposit Funds
          </h1>
          <p className="text-muted-foreground mt-1">
            Add funds to your WannaBet? wallet
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Balance:{" "}
          {formatCurrencyFromEur(currentBalanceDollars, currency, rates)}
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Step {step} of 3</span>
              <span className="text-primary font-medium">
                {progressPercentage.toFixed(0)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="grid grid-cols-3 gap-2 mt-4">
              {["Amount", "Payment", "Complete"].map((label, idx) => (
                <div key={label} className="text-center">
                  <div
                    className={`text-xs font-medium ${
                      idx + 1 <= step ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Step 1: Choose Amount ── */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeInUp">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Choose Deposit Amount
              </CardTitle>
              <CardDescription>
                Select or enter the amount you want to deposit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Amounts */}
              <div className="space-y-3">
                <Label>Quick Amounts</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {quickAmounts.map((amt) => (
                    <Button
                      key={amt}
                      variant={amount === String(amt) ? "default" : "outline"}
                      onClick={() => handleAmountSelect(String(amt))}
                      className={`relative ${
                        amount === String(amt)
                          ? "bg-primary text-primary-foreground"
                          : "border-primary/30 hover:border-primary hover:bg-primary/10"
                      }`}
                    >
                      {amount === String(amt) && (
                        <Check className="h-3 w-3 absolute top-1 right-1" />
                      )}
                      {formatCurrencyFromEur(amt, currency, rates)}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Amount */}
              <div className="space-y-3">
                <Label htmlFor="customAmount">Custom Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="customAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={`pl-10 text-lg h-12 bg-input-background ${
                      amountOverLimit || amountUnderMin
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                </div>
                {amountOverLimit && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Maximum deposit is{" "}
                    {formatCurrencyFromEur(maxAmount, currency, rates)}
                  </p>
                )}
                {amountUnderMin && !amountOverLimit && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Minimum deposit is{" "}
                    {formatCurrencyFromEur(minAmount, currency, rates)}
                  </p>
                )}
                {!amountOverLimit && !amountUnderMin && (
                  <p className="text-xs text-muted-foreground">
                    Minimum: {formatCurrencyFromEur(minAmount, currency, rates)}{" "}
                    � Maximum:{" "}
                    {formatCurrencyFromEur(maxAmount, currency, rates)}
                  </p>
                )}
              </div>

              {/* Preview */}
              {canProceedStep1 && (
                <Card className="bg-gradient-to-br from-emerald-600/10 to-transparent border-emerald-600/30 animate-fadeInUp">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Deposit Amount
                        </p>
                        <p className="text-3xl font-bold text-emerald-400">
                          {formatCurrencyFromEur(
                            amountDollars,
                            currency,
                            rates,
                          )}
                        </p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-emerald-400 opacity-50" />
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Balance</p>
                        <p className="font-medium">
                          {formatCurrencyFromEur(
                            currentBalanceDollars,
                            currency,
                            rates,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">After Deposit</p>
                        <p className="font-medium text-emerald-400">
                          {formatCurrencyFromEur(
                            currentBalanceDollars + amountDollars,
                            currency,
                            rates,
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-blue-600/30 bg-blue-600/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Secure Transactions</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      All deposits are encrypted and protected with bank-level
                      security via Stripe
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-600/30 bg-amber-600/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">
                      Instant Availability
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Funds credited immediately after Stripe confirms payment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto sm:min-w-[200px]"
            >
              Continue to Payment
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Stripe Card Form ── */}
      {step === 2 && (
        <Elements stripe={stripePromise}>
          <StripeDepositForm
            amountCents={amountCents}
            amountDollars={amountDollars}
            currentBalance={currentBalanceDollars}
            onSuccess={handlePaymentSuccess}
            onBack={() => setStep(1)}
          />
        </Elements>
      )}

      {/* ── Step 3: Success ── */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeInUp">
          <Card className="border-emerald-600/30 bg-gradient-to-br from-emerald-600/10 to-transparent">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-600/20 mb-6 animate-scaleIn">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Deposit Successful!</h2>
              <p className="text-muted-foreground mb-8">
                Your funds have been added to your wallet
              </p>

              <div className="max-w-md mx-auto space-y-6">
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Deposited to wallet
                      </span>
                      <span className="font-bold text-emerald-400">
                        +{formatCurrencyFromEur(amountDollars, currency, rates)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Processing fee (2%)
                      </span>
                      <span className="font-medium">
                        {formatCurrencyFromEur(
                          amountDollars * 0.02,
                          currency,
                          rates,
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">New Balance</span>
                      <span className="text-xl font-bold text-emerald-400">
                        {formatCurrencyFromEur(
                          snapshotBalance / 100 + amountDollars,
                          currency,
                          rates,
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {completedIntentId && (
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Transaction ID</p>
                    <code className="text-xs bg-muted px-3 py-1 rounded break-all">
                      {completedIntentId}
                    </code>
                  </div>
                )}

                <Card className="bg-blue-600/5 border-blue-600/30">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h4 className="font-medium text-sm">What's Next?</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Funds are available immediately for wagering.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate?.("wallet-escrow")}
              className="w-full sm:w-auto sm:min-w-[200px]"
            >
              View Wallet
            </Button>
            <Button
              size="lg"
              onClick={() => onNavigate?.("lobbies")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto sm:min-w-[200px]"
            >
              Start Playing
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
