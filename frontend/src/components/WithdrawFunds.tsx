import React, { useState } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { 
  ArrowLeft, 
  Wallet, 
  DollarSign, 
  ArrowUpRight,
  Shield,
  Check,
  AlertCircle,
  Info,
  Lock,
  TrendingDown,
  Clock,
  Bitcoin,
  Building2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail
} from 'lucide-react';

interface WithdrawFundsProps {
  onNavigate?: (tab: string) => void;
}

export function WithdrawFunds({ onNavigate }: WithdrawFundsProps) {
  const [step, setStep] = useState(1); // 1: Amount, 2: Withdrawal Method, 3: Verification, 4: Confirmation, 5: Success
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('paypal');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [withdrawalFee, setWithdrawalFee] = useState(0);

  const { refreshUser } = useAuth();
  const { user } = useAuth();
  const currentBalance = user?.wallet?.balance ?? 0;
  const inEscrow = user?.wallet?.escrow ?? 0;
  const availableBalance = currentBalance - inEscrow;

  const quickAmounts = [100, 250, 500, 1000, 1950]; // Max is available balance

  const withdrawalMethods = [
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Wallet,
      description: 'Fast & secure',
      fee: '2.5%',
      minAmount: 50,
      maxAmount: 5000,
      processingTime: '1-2 business days',
      recommended: true,
      popular: true,
      accountInfo: 'user@email.com'
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'ACH/Direct deposit',
      fee: '$5.00',
      minAmount: 100,
      maxAmount: 50000,
      processingTime: '3-5 business days',
      accountInfo: 'Account ending in •••• 4321'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: Bitcoin,
      description: 'BTC, ETH, USDT',
      fee: '1.5%',
      minAmount: 100,
      maxAmount: 100000,
      processingTime: '15-30 minutes',
      accountInfo: 'Not connected'
    },
    {
      id: 'check',
      name: 'Check by Mail',
      icon: FileText,
      description: 'Physical check',
      fee: '$10.00',
      minAmount: 200,
      maxAmount: 10000,
      processingTime: '7-10 business days',
      accountInfo: 'Mailed to registered address'
    }
  ];

  const selectedMethod = withdrawalMethods.find(m => m.id === withdrawalMethod);

  const calculateFee = (amt: number) => {
    if (!selectedMethod) return 0;
    if (selectedMethod.fee.includes('%')) {
      const percentage = parseFloat(selectedMethod.fee.replace('%', ''));
      return (amt * percentage) / 100;
    }
    return parseFloat(selectedMethod.fee.replace('$', ''));
  };

  const handleAmountSelect = (value: string) => {
    setAmount(value);
    setCustomAmount('');
    const fee = calculateFee(parseFloat(value));
    setWithdrawalFee(fee);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount(value);
    const fee = calculateFee(parseFloat(value) || 0);
    setWithdrawalFee(fee);
  };

  const handleWithdrawalMethodChange = (methodId: string) => {
    setWithdrawalMethod(methodId);
    const fee = calculateFee(parseFloat(amount) || 0);
    setWithdrawalFee(fee);
  };

  const totalReceived = parseFloat(amount || '0') - withdrawalFee;

  const canProceedStep1 = 
    amount && 
    parseFloat(amount) >= (selectedMethod?.minAmount || 0) &&
    parseFloat(amount) <= availableBalance;
    
  const canProceedStep2 = withdrawalMethod && agreeToTerms;
  const canProceedStep3 = verificationCode.length === 6;

  const progressPercentage = (step / 5) * 100;

  // Mock pending withdrawals
  const pendingWithdrawals = [
    {
      id: 1,
      amount: 300,
      method: 'PayPal',
      date: '2 days ago',
      status: 'processing',
      estimatedCompletion: 'Tomorrow'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeInUp max-w-4xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => step === 1 ? onNavigate?.('wallet-escrow') : setStep(step - 1)}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2">
            <ArrowUpRight className="h-6 w-6 text-primary" />
            Withdraw Funds
          </h1>
          <p className="text-muted-foreground mt-1">
            Transfer funds from your WannaBet? wallet
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Available: ${availableBalance.toLocaleString()}
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Step {step} of 5</span>
              <span className="text-primary font-medium">{progressPercentage.toFixed(0)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="grid grid-cols-5 gap-2 mt-4">
              {['Amount', 'Method', 'Verify', 'Confirm', 'Complete'].map((label, idx) => (
                <div key={label} className="text-center">
                  <div className={`text-xs font-medium ${
                    idx + 1 <= step ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Withdrawals Alert */}
      {pendingWithdrawals.length > 0 && step === 1 && (
        <Card className="border-amber-600/30 bg-amber-600/5 animate-fadeInUp">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Pending Withdrawal</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  You have ${pendingWithdrawals[0].amount} withdrawal in progress via {pendingWithdrawals[0].method}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated completion: {pendingWithdrawals[0].estimatedCompletion}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Choose Amount */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeInUp">
          {/* Balance Overview */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-xl font-bold">${currentBalance.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-amber-600/10 rounded-lg border border-amber-600/30">
                  <p className="text-xs text-muted-foreground mb-1">In Escrow</p>
                  <p className="text-xl font-bold text-amber-400">${inEscrow}</p>
                </div>
                <div className="p-4 bg-emerald-600/10 rounded-lg border border-emerald-600/30">
                  <p className="text-xs text-muted-foreground mb-1">Available</p>
                  <p className="text-xl font-bold text-emerald-400">${availableBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Withdrawal Amount
              </CardTitle>
              <CardDescription>
                Select or enter the amount you want to withdraw
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Amount Buttons */}
              <div className="space-y-3">
                <Label>Quick Amounts</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {quickAmounts.map((amt) => (
                    <Button
                      key={amt}
                      variant={amount === amt.toString() ? 'default' : 'outline'}
                      onClick={() => handleAmountSelect(amt.toString())}
                      className={`relative ${
                        amount === amt.toString() 
                          ? 'bg-primary text-primary-foreground' 
                          : 'border-primary/30 hover:border-primary hover:bg-primary/10'
                      }`}
                    >
                      {amount === amt.toString() && (
                        <Check className="h-3 w-3 absolute top-1 right-1" />
                      )}
                      ${amt}
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
                    className="pl-10 text-lg h-12 bg-input-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: ${selectedMethod?.minAmount || 50} • Maximum: ${Math.min(availableBalance, selectedMethod?.maxAmount || 5000).toLocaleString()}
                </p>
              </div>

              {/* Selected Amount Preview */}
              {amount && parseFloat(amount) <= availableBalance && (
                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30 animate-fadeInUp">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Withdrawal Amount</p>
                        <p className="text-3xl font-bold text-primary">${parseFloat(amount).toFixed(2)}</p>
                      </div>
                      <TrendingDown className="h-12 w-12 text-primary opacity-50" />
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Available Balance</p>
                        <p className="font-medium">${availableBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining Balance</p>
                        <p className="font-medium">
                          ${(availableBalance - parseFloat(amount)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warning for amount exceeding available balance */}
              {amount && parseFloat(amount) > availableBalance && (
                <Card className="border-red-600/30 bg-red-600/5 animate-fadeInUp">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-red-400">Insufficient Available Balance</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          You can only withdraw ${availableBalance.toLocaleString()}. ${inEscrow} is currently held in escrow.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Important Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-blue-600/30 bg-blue-600/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Processing Time</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Withdrawals typically take 1-5 business days depending on the method
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-600/30 bg-amber-600/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Minimum Requirement</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum withdrawal amount is $50 for most payment methods
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Withdrawal Method */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeInUp">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Select Withdrawal Method
              </CardTitle>
              <CardDescription>
                Choose where you want to receive your funds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={withdrawalMethod} onValueChange={handleWithdrawalMethodChange}>
                <div className="grid gap-3">
                  {withdrawalMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = withdrawalMethod === method.id;
                    return (
                      <div
                        key={method.id}
                        className={`relative flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover-lift ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleWithdrawalMethodChange(method.id)}
                      >
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={method.id} className="cursor-pointer">
                              {method.name}
                            </Label>
                            {method.recommended && (
                              <Badge className="bg-emerald-600 text-white text-xs">
                                Recommended
                              </Badge>
                            )}
                            {method.popular && (
                              <Badge variant="outline" className="text-xs">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">Fee: {method.fee}</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">{method.processingTime}</p>
                          </div>
                          <p className="text-xs text-primary mt-1">{method.accountInfo}</p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Account Details */}
          {selectedMethod && (
            <Card className="border-border/50 animate-fadeInUp">
              <CardHeader>
                <CardTitle className="text-base">Withdrawal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {withdrawalMethod === 'paypal' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>PayPal Email</Label>
                      <Input 
                        placeholder="your@email.com" 
                        defaultValue="user@email.com"
                        className="bg-input-background" 
                      />
                      <p className="text-xs text-muted-foreground">
                        Make sure this email matches your PayPal account
                      </p>
                    </div>
                  </div>
                )}

                {withdrawalMethod === 'bank-transfer' && (
                  <div className="space-y-4">
                    <Card className="bg-muted/30 border-border/50">
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank Name</span>
                            <span className="font-medium">Chase Bank</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Number</span>
                            <span className="font-medium">•••• •••• 4321</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Routing Number</span>
                            <span className="font-medium">•••••6789</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Button variant="outline" size="sm">
                      Change Bank Account
                    </Button>
                  </div>
                )}

                {withdrawalMethod === 'crypto' && (
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        You need to connect a cryptocurrency wallet first
                      </p>
                      <Button variant="outline" size="sm">
                        Connect Crypto Wallet
                      </Button>
                    </div>
                  </div>
                )}

                {withdrawalMethod === 'check' && (
                  <div className="space-y-4">
                    <Card className="bg-muted/30 border-border/50">
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mailing Address</span>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">John Doe</p>
                            <p className="text-muted-foreground">123 Gaming Street</p>
                            <p className="text-muted-foreground">Los Angeles, CA 90001</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Button variant="outline" size="sm">
                      Update Mailing Address
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Terms */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="terms" className="cursor-pointer text-sm">
                    I confirm the withdrawal details are correct
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Incorrect details may result in delayed or failed withdrawals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              size="lg"
              disabled={!canProceedStep2}
              onClick={() => setStep(3)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Verification */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeInUp">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Verification
              </CardTitle>
              <CardDescription>
                For your security, we need to verify this withdrawal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="bg-blue-600/5 border-blue-600/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Verification Code Sent</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        We've sent a 6-digit code to your email: user@email.com
                      </p>
                      <Button variant="link" className="text-xs px-0 h-auto mt-2">
                        Didn't receive it? Resend code
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Label htmlFor="verificationCode">Enter Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest h-14 bg-input-background"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <Card className="bg-amber-600/5 border-amber-600/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Security Notice</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Never share your verification code with anyone. WannaBet? staff will never ask for this code.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              size="lg"
              disabled={!canProceedStep3}
              onClick={() => setStep(4)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
            >
              Verify & Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Final Confirmation */}
      {step === 4 && (
        <div className="space-y-6 animate-fadeInUp">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Review Withdrawal Request
              </CardTitle>
              <CardDescription>
                Please verify all details before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Summary */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Withdrawal Amount</span>
                  <span className="text-xl font-bold">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Processing Fee ({selectedMethod?.fee})</span>
                  <span className="font-medium text-red-400">-${withdrawalFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">You Will Receive</span>
                  <span className="text-2xl font-bold text-emerald-400">${totalReceived.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {/* Withdrawal Method Summary */}
              <div className="space-y-3">
                <h4 className="font-medium">Withdrawal Method</h4>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  {selectedMethod && <selectedMethod.icon className="h-5 w-5 text-primary" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedMethod?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedMethod?.accountInfo}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Processing time: {selectedMethod?.processingTime}
                </p>
              </div>

              <Separator />

              {/* Balance Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Account Balance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Current Available</p>
                    <p className="text-lg font-bold">${availableBalance.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                    <p className="text-xs text-muted-foreground mb-1">After Withdrawal</p>
                    <p className="text-lg font-bold text-primary">
                      ${(availableBalance - parseFloat(amount)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <Card className="bg-amber-600/5 border-amber-600/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Important</h4>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>Withdrawals cannot be canceled once submitted</li>
                        <li>Make sure all account details are correct</li>
                        <li>Processing times may vary based on your bank or payment provider</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              size="lg"
              onClick={async () => {
                try {
                  const amt = parseFloat(amount || '0');
                  await api.withdraw(amt);
                  await refreshUser();
                  setStep(5);
                } catch (err: any) {
                  console.error(err);
                  // TODO: show user-facing error
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
            >
              <Lock className="h-4 w-4 mr-2" />
              Submit Withdrawal
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <div className="space-y-6 animate-fadeInUp">
          <Card className="border-emerald-600/30 bg-gradient-to-br from-emerald-600/10 to-transparent">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-600/20 mb-6 animate-scaleIn">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Withdrawal Submitted!</h2>
              <p className="text-muted-foreground mb-8">
                Your withdrawal request is being processed
              </p>

              <div className="max-w-md mx-auto space-y-6">
                {/* Transaction Details */}
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Withdrawal Amount</span>
                      <span className="font-bold text-primary">-${parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="font-medium text-red-400">-${withdrawalFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">You Will Receive</span>
                      <span className="text-lg font-bold text-emerald-400">${totalReceived.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Arrival</span>
                      <span className="font-medium">{selectedMethod?.processingTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Method</span>
                      <span className="font-medium">{selectedMethod?.name}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction ID */}
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Withdrawal ID</p>
                  <code className="text-xs bg-muted px-3 py-1 rounded">
                    WTH-{Date.now().toString().slice(-8)}
                  </code>
                </div>

                {/* Next Steps */}
                <Card className="bg-blue-600/5 border-blue-600/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h4 className="font-medium text-sm">What Happens Next?</h4>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                          <li>Your withdrawal is now being processed</li>
                          <li>You'll receive email updates on the status</li>
                          <li>Funds will arrive within {selectedMethod?.processingTime.toLowerCase()}</li>
                          <li>Track your withdrawal in transaction history</li>
                        </ul>
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
              onClick={() => onNavigate?.('wallet-escrow')}
              className="min-w-[200px]"
            >
              View Transaction History
            </Button>
            <Button
              size="lg"
              onClick={() => onNavigate?.('home')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
            >
              Back to Home
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}