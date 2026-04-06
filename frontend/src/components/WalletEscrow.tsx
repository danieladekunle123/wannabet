import React, { useEffect, useState } from "react";
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
import { Badge } from "./ui/badge";
import {
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Check,
  X,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { InfoDialog } from "./InfoDialog";

interface WalletEscrowProps {
  onNavigate?: (tab: string) => void;
}

export function WalletEscrow({ onNavigate }: WalletEscrowProps) {
  const [balance, setBalance] = useState<number>(0);
  const [escrow, setEscrow] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [escrowMatches, setEscrowMatches] = useState<any[]>([]);
  const [txPage, setTxPage] = useState(0);
  const TX_PER_PAGE = 10;
  const { refreshUser } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const w = await api.getMyWallet();
        if (!mounted) return;
        // balance & escrow are stored in cents — convert to dollars for display
        setBalance((w.wallet.balance ?? 0) / 100);
        setEscrow((w.wallet.escrow ?? 0) / 100);

        const ledger = await api.getMyLedger();
        if (!mounted) return;
        const mapped = (ledger.entries || []).map((e: any) => ({
          id: e.id,
          type: (e.type ?? "").toLowerCase(),
          amount: Math.abs(e.amount) / 100, // cents → dollars
          rawAmount: e.amount,
          date: new Date(e.createdAt).toLocaleString(),
          status:
            (e.type ?? "").toLowerCase() === "withdrawal"
              ? "processing"
              : "completed",
          matchId: e.matchId,
          tournamentId: e.tournamentId,
        }));
        setTransactions(mapped);

        // derive simple escrow matches from escrow_lock entries
        const escrowItems = (ledger.entries || [])
          .filter((e: any) => (e.type ?? "").toLowerCase() === "escrow_lock")
          .map((e: any, idx: number) => ({
            id: e.id,
            game: e.matchId
              ? `Match #${idx + 1}`
              : e.tournamentId
                ? `Tournament #${idx + 1}`
                : `Escrow #${idx + 1}`,
            amount: e.amount / 100, // cents → dollars
            opponent: "",
            status: "active",
            time: new Date(e.createdAt).toLocaleString(),
          }));
        setEscrowMatches(escrowItems);
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  // compute total earnings from either user or transactions
  const { user } = useAuth();
  const { currency, rates } = useCurrency();
  const computedTotalEarnings = transactions.reduce((sum, t) => {
    const tt = (t.type || "").toString().toLowerCase();
    // payout entries with positive raw amount = winnings
    if ((tt === "payout" || tt === "refund") && (t.rawAmount || 0) > 0) {
      return sum + t.amount; // already in dollars
    }
    return sum;
  }, 0);

  const totalEarningsToShow =
    user?.totalEarnings != null
      ? user.totalEarnings / 100
      : computedTotalEarnings;

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.("settings")}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="mb-2">Wallet & Escrow</h1>
            <p className="text-muted-foreground">
              Manage your funds and view transaction history
            </p>
          </div>
          <InfoDialog
            title="About Wallet & Escrow"
            description="Your wallet holds your available balance for gaming. When you join a match or tournament, funds are moved to escrow (locked) until the match completes. This protects both players from backing out or disputes."
            tips={[
              "Available Balance: Funds you can use to join new matches",
              "Escrow Balance: Funds locked in active matches - released when match completes",
              "All transactions are protected and can be reviewed in your history",
              "Deposit funds before joining matches to ensure quick entry",
              "Withdraw your winnings anytime to your preferred payment method",
              "Escrow prevents disputes - funds can't be taken back once match starts",
            ]}
          />
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 hover-lift bg-gradient-to-br from-emerald-600/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-emerald-400">
                {formatCurrencyFromEur(balance, currency, rates)}
              </span>
              <Badge className="bg-emerald-600 text-white text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ready to use for wagers
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover-lift bg-gradient-to-br from-amber-600/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Escrow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-amber-400">
                {formatCurrencyFromEur(escrow, currency, rates)}
              </span>
              <Badge className="bg-amber-600 text-white text-xs animate-pulse">
                <Shield className="h-3 w-3 mr-1" />
                Secured
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              3 active matches
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover-lift bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-primary">
                {formatCurrencyFromEur(totalEarningsToShow, currency, rates)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All-time winnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Deposit/Withdraw */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-600/30 hover-lift bg-gradient-to-br from-emerald-600/10 to-transparent cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ArrowDownLeft className="h-5 w-5 mr-2 text-emerald-400" />
                Deposit Funds
              </span>
            </CardTitle>
            <CardDescription>
              Add money to your wallet instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Instant credit card deposits</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Multiple payment methods</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Bank-level security</span>
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white group-hover:shadow-lg transition-all"
              onClick={() => onNavigate?.("deposit-funds")}
            >
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Start Deposit
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/30 hover-lift bg-gradient-to-br from-primary/10 to-transparent cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ArrowUpRight className="h-5 w-5 mr-2 text-primary" />
                Withdraw Funds
              </span>
            </CardTitle>
            <CardDescription>Transfer winnings to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>Fast PayPal withdrawals</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>Direct bank transfers</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure verification</span>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group-hover:shadow-lg transition-all"
              onClick={() => onNavigate?.("withdraw-funds")}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Start Withdrawal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Escrow */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-amber-400" />
            Active Escrow
          </CardTitle>
          <CardDescription>
            Funds held in escrow for ongoing matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {escrowMatches.map((match, index) => (
              <div
                key={match.id}
                className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-foreground">
                        {match.game}
                      </h4>
                      <Badge
                        className={`text-xs ${
                          match.status === "active"
                            ? "bg-emerald-600 text-white animate-pulse"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {match.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {match.opponent || match.event}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{match.time}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-400">
                      {formatCurrencyFromEur(match.amount, currency, rates)}
                    </div>
                    <p className="text-xs text-muted-foreground">In escrow</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your recent transactions
              </CardDescription>
            </div>
            {transactions.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {transactions.length} total
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions
              .slice(txPage * TX_PER_PAGE, (txPage + 1) * TX_PER_PAGE)
              .map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === "win"
                          ? "bg-emerald-600/20"
                          : transaction.type === "deposit"
                            ? "bg-blue-600/20"
                            : transaction.type === "loss"
                              ? "bg-red-600/20"
                              : "bg-amber-600/20"
                      }`}
                    >
                      {transaction.type === "payout" &&
                        transaction.rawAmount > 0 && (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        )}
                      {transaction.type === "payout" &&
                        transaction.rawAmount < 0 && (
                          <X className="h-4 w-4 text-red-400" />
                        )}
                      {transaction.type === "deposit" && (
                        <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                      )}
                      {transaction.type === "withdrawal" && (
                        <ArrowUpRight className="h-4 w-4 text-amber-400" />
                      )}
                      {transaction.type === "escrow_lock" && (
                        <Shield className="h-4 w-4 text-amber-400" />
                      )}
                      {transaction.type === "refund" && (
                        <Check className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {transaction.type === "payout" &&
                          transaction.rawAmount > 0 &&
                          "Payout (Win)"}
                        {transaction.type === "payout" &&
                          transaction.rawAmount < 0 &&
                          "Match Loss"}
                        {transaction.type === "deposit" && "Deposit"}
                        {transaction.type === "withdrawal" && "Withdrawal"}
                        {transaction.type === "escrow_lock" && "Escrow Locked"}
                        {transaction.type === "refund" && "Escrow Refund"}
                        {![
                          "payout",
                          "deposit",
                          "withdrawal",
                          "escrow_lock",
                          "refund",
                        ].includes(transaction.type) && transaction.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        transaction.rawAmount > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {transaction.rawAmount > 0 ? "+" : "-"}
                      {formatCurrencyFromEur(
                        transaction.amount,
                        currency,
                        rates,
                      )}
                    </div>
                    <Badge
                      className={`text-xs ${
                        transaction.status === "completed"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No transactions yet.
              </p>
            )}
          </div>
          {/* Pagination */}
          {transactions.length > TX_PER_PAGE && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTxPage((p) => Math.max(0, p - 1))}
                disabled={txPage === 0}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {txPage + 1} of{" "}
                {Math.ceil(transactions.length / TX_PER_PAGE)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setTxPage((p) =>
                    Math.min(
                      Math.ceil(transactions.length / TX_PER_PAGE) - 1,
                      p + 1,
                    ),
                  )
                }
                disabled={(txPage + 1) * TX_PER_PAGE >= transactions.length}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
