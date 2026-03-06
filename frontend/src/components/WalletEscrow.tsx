import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Shield, ArrowUpRight, ArrowDownLeft, Clock, Check, X, TrendingUp, ArrowLeft } from 'lucide-react';
import { InfoDialog } from './InfoDialog';

interface WalletEscrowProps {
  onNavigate?: (tab: string) => void;
}

export function WalletEscrow({ onNavigate }: WalletEscrowProps) {

  const [balance, setBalance] = useState<number>(0);
  const [escrow, setEscrow] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [escrowMatches, setEscrowMatches] = useState<any[]>([]);
  const { refreshUser } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const w = await api.getMyWallet();
        if (!mounted) return;
        setBalance(w.wallet.balance ?? 0);
        setEscrow(w.wallet.escrow ?? 0);

        const ledger = await api.getMyLedger();
        if (!mounted) return;
        const mapped = (ledger.entries || []).map((e: any) => ({
          id: e.id,
          type: e.type.toLowerCase(),
          amount: Math.abs(e.amount),
          rawAmount: e.amount,
          date: new Date(e.createdAt).toLocaleString(),
          status: e.type === 'WITHDRAW' ? 'processing' : 'completed',
        }));
        setTransactions(mapped);

        // derive simple escrow matches from ESCROW_LOCK entries
        const escrowItems = (ledger.entries || []).filter((e: any) => e.type === 'ESCROW_LOCK').map((e: any, idx: number) => ({
          id: e.id,
          game: 'Match #' + (idx + 1),
          amount: e.amount,
          opponent: '',
          status: 'active',
          time: 'Pending',
        }));
        setEscrowMatches(escrowItems);
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [refreshUser]);

  // compute total earnings from either user or transactions
  const { user } = useAuth();
  const computedTotalEarnings = transactions.reduce((sum, t) => {
    const tt = (t.type || '').toString().toLowerCase();
    if ((tt === 'payout' || tt === 'win' || tt === 'escrow_release') && (t.rawAmount || 0) > 0) {
      return sum + Number(t.rawAmount || 0);
    }
    return sum;
  }, 0);

  const totalEarningsToShow = user?.totalEarnings ?? computedTotalEarnings;

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.('settings')}
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
              "Escrow prevents disputes - funds can't be taken back once match starts"
            ]}
          />
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 hover-lift bg-gradient-to-br from-emerald-600/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-emerald-400">${balance.toLocaleString()}</span>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">In Escrow</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-amber-400">${escrow.toLocaleString()}</span>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-primary">${totalEarningsToShow.toLocaleString()}</span>
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
              onClick={() => onNavigate?.('deposit-funds')}
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
            <CardDescription>
              Transfer winnings to your account
            </CardDescription>
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
              onClick={() => onNavigate?.('withdraw-funds')}
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
                      <h4 className="font-medium text-foreground">{match.game}</h4>
                      <Badge className={`text-xs ${
                        match.status === 'active' 
                          ? 'bg-emerald-600 text-white animate-pulse' 
                          : 'bg-amber-600 text-white'
                      }`}>
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
                    <div className="text-xl font-bold text-amber-400">${match.amount}</div>
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
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View all your recent transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'win' ? 'bg-emerald-600/20' :
                    transaction.type === 'deposit' ? 'bg-blue-600/20' :
                    transaction.type === 'loss' ? 'bg-red-600/20' :
                    'bg-amber-600/20'
                  }`}>
                    {transaction.type === 'win' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                    {transaction.type === 'deposit' && <ArrowDownLeft className="h-4 w-4 text-blue-400" />}
                    {transaction.type === 'loss' && <X className="h-4 w-4 text-red-400" />}
                    {transaction.type === 'withdraw' && <ArrowUpRight className="h-4 w-4 text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {transaction.type === 'win' && `Win: ${transaction.game}`}
                      {transaction.type === 'deposit' && `Deposit via ${transaction.method}`}
                      {transaction.type === 'loss' && `Loss: ${transaction.game}`}
                      {transaction.type === 'withdraw' && `Withdrawal to ${transaction.method}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    transaction.type === 'win' || transaction.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {transaction.type === 'win' || transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                  </div>
                  <Badge className={`text-xs ${
                    transaction.status === 'completed' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-amber-600 text-white'
                  }`}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}