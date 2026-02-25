import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { AlertCircle, ArrowLeft, ShieldOff, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface DeactivateAccountProps {
  onNavigate?: (tab: string) => void;
}

export function DeactivateAccount({ onNavigate }: DeactivateAccountProps) {
  const [step, setStep] = useState(1);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmations, setConfirmations] = useState({
    loseAccess: false,
    hiddenProfile: false,
    pausedMatches: false,
  });
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deactivationComplete, setDeactivationComplete] = useState(false);

  const allConfirmationsChecked = Object.values(confirmations).every(Boolean);

  const handleDeactivate = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setDeactivationComplete(true);
    }, 2000);
  };

  if (deactivationComplete) {
    return (
      <div className="space-y-6 animate-fadeInUp">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate?.('account-settings')}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="mb-2">Account Deactivated</h1>
          </div>
        </div>

        <Card className="border-primary/50">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="mb-2">Your Account Has Been Deactivated</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your profile is now hidden and you won't be able to access WannaBet? features until you reactivate your account.
              </p>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground mb-1">Easy Reactivation</p>
                  <p className="text-xs text-muted-foreground">
                    You can reactivate your account anytime by simply logging back in. All your data will be restored.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => onNavigate?.('home')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => step === 1 ? onNavigate?.('account-settings') : setStep(step - 1)}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="mb-2">Deactivate Account</h1>
          <p className="text-muted-foreground">
            Step {step} of 3 - Temporarily disable your WannaBet? account
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex-1">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                num <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Step 1: Reason */}
      {step === 1 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldOff className="h-5 w-5 mr-2 text-amber-500" />
              Why are you deactivating your account?
            </CardTitle>
            <CardDescription>
              Help us improve by letting us know why you're leaving
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={deactivationReason} onValueChange={setDeactivationReason}>
              <div className="space-y-3">
                {[
                  { value: 'taking-break', label: 'Taking a break from competitive gaming' },
                  { value: 'too-busy', label: "Don't have time right now" },
                  { value: 'privacy-concerns', label: 'Privacy concerns' },
                  { value: 'not-using', label: 'Not using the platform anymore' },
                  { value: 'switching-platform', label: 'Switching to another platform' },
                  { value: 'technical-issues', label: 'Experiencing technical issues' },
                  { value: 'other', label: 'Other reason' },
                ].map((reason) => (
                  <div
                    key={reason.value}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/30 ${
                      deactivationReason === reason.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    onClick={() => setDeactivationReason(reason.value)}
                  >
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="flex-1 cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more about your decision..."
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedback.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!deactivationReason}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Understand Consequences */}
      {step === 2 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Understand What Happens
            </CardTitle>
            <CardDescription>
              Please review what will happen when you deactivate your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* What Happens */}
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                  What will happen:
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Your profile will be hidden from other users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>You won't be able to join matches or tournaments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Active matches will be cancelled and funds returned</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Your messages and friends list will be inaccessible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>You'll lose access to premium features and subscriptions</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                  What will be preserved:
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>Your wallet balance (you can withdraw anytime)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>Your match history and statistics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>All your data for easy reactivation</span>
                  </li>
                </ul>
              </div>
            </div>

            <Separator />

            {/* Confirmations */}
            <div className="space-y-3">
              <Label>Please confirm you understand:</Label>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="loseAccess"
                    checked={confirmations.loseAccess}
                    onCheckedChange={(checked) => 
                      setConfirmations({ ...confirmations, loseAccess: checked as boolean })
                    }
                  />
                  <label htmlFor="loseAccess" className="text-sm cursor-pointer leading-tight">
                    I understand I will lose access to all WannaBet? features
                  </label>
                </div>

                <div className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="hiddenProfile"
                    checked={confirmations.hiddenProfile}
                    onCheckedChange={(checked) => 
                      setConfirmations({ ...confirmations, hiddenProfile: checked as boolean })
                    }
                  />
                  <label htmlFor="hiddenProfile" className="text-sm cursor-pointer leading-tight">
                    I understand my profile will be hidden from all users
                  </label>
                </div>

                <div className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="pausedMatches"
                    checked={confirmations.pausedMatches}
                    onCheckedChange={(checked) => 
                      setConfirmations({ ...confirmations, pausedMatches: checked as boolean })
                    }
                  />
                  <label htmlFor="pausedMatches" className="text-sm cursor-pointer leading-tight">
                    I understand my active matches will be cancelled
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!allConfirmationsChecked}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Final Confirmation */}
      {step === 3 && (
        <Card className="border-destructive/50 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <ShieldOff className="h-5 w-5 mr-2" />
              Final Confirmation
            </CardTitle>
            <CardDescription>
              Enter your password to confirm account deactivation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive mb-2">
                    You're about to deactivate your account
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    This action is reversible. You can reactivate your account anytime by logging back in.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Enter Your Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="bg-input-background"
              />
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Reactivation is Easy</p>
                  <p className="text-muted-foreground">
                    Simply log back in to reactivate your account. All your data will be restored automatically.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={!password || isProcessing}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isProcessing ? 'Deactivating...' : 'Deactivate Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
