import React, { useState } from 'react';
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
  CreditCard, 
  Wallet, 
  DollarSign, 
  ArrowDownLeft,
  Shield,
  Check,
  AlertCircle,
  Info,
  Lock,
  TrendingUp,
  Zap,
  Bitcoin,
  Banknote,
  Building2,
  Smartphone,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface DepositFundsProps {
  onNavigate?: (tab: string) => void;
}

export function DepositFunds({ onNavigate }: DepositFundsProps) {
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment Method, 3: Confirmation, 4: Success
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [processingFee, setProcessingFee] = useState(0);

  const currentBalance = 2450;

  const quickAmounts = [50, 100, 250, 500, 1000, 2500];

  const paymentMethods = [
    {
      id: 'credit-card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Instant deposit',
      fee: '2.9%',
      minAmount: 10,
      maxAmount: 10000,
      processingTime: 'Instant',
      recommended: true,
      popular: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Wallet,
      description: 'Fast & secure',
      fee: '3.5%',
      minAmount: 25,
      maxAmount: 5000,
      processingTime: 'Instant',
      popular: true
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'ACH/Wire transfer',
      fee: '$1.00',
      minAmount: 100,
      maxAmount: 50000,
      processingTime: '2-3 business days'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: Bitcoin,
      description: 'BTC, ETH, USDT',
      fee: '1%',
      minAmount: 50,
      maxAmount: 100000,
      processingTime: '15-30 minutes'
    },
    {
      id: 'apple-pay',
      name: 'Apple Pay',
      icon: Smartphone,
      description: 'One-tap payment',
      fee: '2.5%',
      minAmount: 10,
      maxAmount: 3000,
      processingTime: 'Instant'
    },
    {
      id: 'google-pay',
      name: 'Google Pay',
      icon: Smartphone,
      description: 'Quick checkout',
      fee: '2.5%',
      minAmount: 10,
      maxAmount: 3000,
      processingTime: 'Instant'
    }
  ];

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);

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
    setProcessingFee(fee);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount(value);
    const fee = calculateFee(parseFloat(value) || 0);
    setProcessingFee(fee);
  };

  const handlePaymentMethodChange = (methodId: string) => {
    setPaymentMethod(methodId);
    const fee = calculateFee(parseFloat(amount) || 0);
    setProcessingFee(fee);
  };

  const totalAmount = parseFloat(amount || '0') + processingFee;

  const canProceedStep1 = amount && parseFloat(amount) >= (selectedMethod?.minAmount || 0);
  const canProceedStep2 = paymentMethod && agreeToTerms;

  const progressPercentage = (step / 4) * 100;

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
            <ArrowDownLeft className="h-6 w-6 text-primary" />
            Deposit Funds
          </h1>
          <p className="text-muted-foreground mt-1">
            Add funds to your WannaBet? wallet
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Current Balance: ${currentBalance.toLocaleString()}
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Step {step} of 4</span>
              <span className="text-primary font-medium">{progressPercentage.toFixed(0)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="grid grid-cols-4 gap-2 mt-4">
              {['Amount', 'Payment', 'Confirm', 'Complete'].map((label, idx) => (
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

      {/* Step 1: Choose Amount */}
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
              {/* Quick Amount Buttons */}
              <div className="space-y-3">
                <Label>Quick Amounts</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
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
                  Minimum deposit: ${selectedMethod?.minAmount || 10} • Maximum: ${selectedMethod?.maxAmount.toLocaleString() || 10000}
                </p>
              </div>

              {/* Selected Amount Preview */}
              {amount && (
                <Card className="bg-gradient-to-br from-emerald-600/10 to-transparent border-emerald-600/30 animate-fadeInUp">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Deposit Amount</p>
                        <p className="text-3xl font-bold text-emerald-400">${parseFloat(amount).toFixed(2)}</p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-emerald-400 opacity-50" />
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Balance</p>
                        <p className="font-medium">${currentBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">New Balance</p>
                        <p className="font-medium text-emerald-400">
                          ${(currentBalance + parseFloat(amount)).toLocaleString()}
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
                      All deposits are encrypted and protected with bank-level security
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
                    <h4 className="font-medium text-sm">Instant Availability</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Most deposits are available immediately for wagering
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
              Continue to Payment
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Payment Method */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeInUp">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Select Payment Method
              </CardTitle>
              <CardDescription>
                Choose how you want to fund your deposit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                <div className="grid gap-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <div
                        key={method.id}
                        className={`relative flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover-lift ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handlePaymentMethodChange(method.id)}
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
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">Fee: {method.fee}</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">{method.processingTime}</p>
                          </div>
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

          {/* Payment Details */}
          {selectedMethod && (
            <Card className="border-border/50 animate-fadeInUp">
              <CardHeader>
                <CardTitle className="text-base">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethod === 'credit-card' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input placeholder="1234 5678 9012 3456" className="bg-input-background" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input placeholder="MM/YY" className="bg-input-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>CVV</Label>
                        <Input placeholder="123" type="password" maxLength={4} className="bg-input-background" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cardholder Name</Label>
                      <Input placeholder="John Doe" className="bg-input-background" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      You'll be redirected to PayPal to complete your payment
                    </p>
                    <Button variant="outline" size="sm">
                      Connect PayPal Account
                    </Button>
                  </div>
                )}

                {paymentMethod === 'bank-transfer' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bank Account Number</Label>
                      <Input placeholder="Enter account number" className="bg-input-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>Routing Number</Label>
                      <Input placeholder="Enter routing number" className="bg-input-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Holder Name</Label>
                      <Input placeholder="Enter name" className="bg-input-background" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'crypto' && (
                  <div className="text-center py-8">
                    <Bitcoin className="h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Select your cryptocurrency to get the deposit address
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                      <Button variant="outline" size="sm">Bitcoin</Button>
                      <Button variant="outline" size="sm">Ethereum</Button>
                      <Button variant="outline" size="sm">USDT</Button>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'apple-pay' || paymentMethod === 'google-pay') && (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Click below to complete payment with {selectedMethod.name}
                    </p>
                    <Button variant="outline" size="sm">
                      Continue with {selectedMethod.name}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
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
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By proceeding, you authorize WannaBet? to charge your selected payment method
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
              Review Deposit
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeInUp">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Review Your Deposit
              </CardTitle>
              <CardDescription>
                Please verify all details before confirming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Summary */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deposit Amount</span>
                  <span className="text-xl font-bold">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Processing Fee ({selectedMethod?.fee})</span>
                  <span className="font-medium">${processingFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Charge</span>
                  <span className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {/* Payment Method Summary */}
              <div className="space-y-3">
                <h4 className="font-medium">Payment Method</h4>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  {selectedMethod && <selectedMethod.icon className="h-5 w-5 text-primary" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedMethod?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedMethod?.description}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Balance Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Account Balance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-lg font-bold">${currentBalance.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-emerald-600/10 rounded-lg border border-emerald-600/30">
                    <p className="text-xs text-muted-foreground mb-1">New Balance</p>
                    <p className="text-lg font-bold text-emerald-400">
                      ${(currentBalance + parseFloat(amount)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <Card className="bg-blue-600/5 border-blue-600/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Secure Transaction</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your payment information is encrypted and secure. We never store your full card details.
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
              onClick={() => setStep(4)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
            >
              <Lock className="h-4 w-4 mr-2" />
              Confirm Deposit
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
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
                {/* Transaction Details */}
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit Amount</span>
                      <span className="font-bold text-emerald-400">+${parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="font-medium">${processingFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Total Charged</span>
                      <span className="text-lg font-bold">${totalAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">New Balance</span>
                      <span className="text-xl font-bold text-emerald-400">
                        ${(currentBalance + parseFloat(amount)).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction ID */}
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Transaction ID</p>
                  <code className="text-xs bg-muted px-3 py-1 rounded">
                    TXN-{Date.now().toString().slice(-8)}
                  </code>
                </div>

                {/* Next Steps */}
                <Card className="bg-blue-600/5 border-blue-600/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h4 className="font-medium text-sm">What's Next?</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your funds are now available for wagering. Check your email for a receipt.
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
              onClick={() => onNavigate?.('wallet-escrow')}
              className="min-w-[200px]"
            >
              View Wallet
            </Button>
            <Button
              size="lg"
              onClick={() => onNavigate?.('lobbies')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
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