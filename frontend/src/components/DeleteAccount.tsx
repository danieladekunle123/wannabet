import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { AlertCircle, ArrowLeft, Trash2, AlertTriangle, XCircle, Info, Download } from 'lucide-react';

interface DeleteAccountProps {
  onNavigate?: (tab: string) => void;
}

export function DeleteAccount({ onNavigate }: DeleteAccountProps) {
  const [step, setStep] = useState(1);
  const [deletionReason, setDeletionReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmations, setConfirmations] = useState({
    permanentDeletion: false,
    dataLoss: false,
    noRecovery: false,
    walletWithdrawn: false,
  });
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const allConfirmationsChecked = Object.values(confirmations).every(Boolean);
  const confirmationTextValid = confirmationText === 'DELETE MY ACCOUNT';

  const handleDelete = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      // Navigate to a goodbye page or login
      onNavigate?.('home');
    }, 2000);
  };

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
          <h1 className="mb-2 text-destructive">Delete Account</h1>
          <p className="text-muted-foreground">
            Step {step} of 4 - Permanently delete your WannaBet? account
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex-1">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                num <= step ? 'bg-destructive' : 'bg-muted'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Warning Banner */}
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-destructive mb-1">Permanent Account Deletion</h4>
              <p className="text-sm text-muted-foreground">
                This action is <span className="font-semibold text-destructive">permanent and irreversible</span>. All your data will be permanently deleted and cannot be recovered.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Reason */}
      {step === 1 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-destructive" />
              Why are you deleting your account?
            </CardTitle>
            <CardDescription>
              Help us improve by letting us know why you're leaving permanently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={deletionReason} onValueChange={setDeletionReason}>
              <div className="space-y-3">
                {[
                  { value: 'quitting-gaming', label: 'Quitting competitive gaming' },
                  { value: 'privacy-concerns', label: 'Privacy and data concerns' },
                  { value: 'platform-issues', label: 'Issues with the platform' },
                  { value: 'not-satisfied', label: 'Not satisfied with the service' },
                  { value: 'found-alternative', label: 'Found a better alternative' },
                  { value: 'account-security', label: 'Account security concerns' },
                  { value: 'personal-reasons', label: 'Personal reasons' },
                  { value: 'other', label: 'Other reason' },
                ].map((reason) => (
                  <div
                    key={reason.value}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/30 ${
                      deletionReason === reason.value
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border'
                    }`}
                    onClick={() => setDeletionReason(reason.value)}
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
                placeholder="Your feedback helps us improve..."
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedback.length}/500 characters
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Consider Deactivation Instead</p>
                  <p className="text-muted-foreground mb-3">
                    If you're unsure, you can temporarily deactivate your account. Your data will be preserved and you can return anytime.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate?.('deactivate-account')}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    Deactivate Instead
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!deletionReason}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Data Download & Wallet */}
      {step === 2 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2 text-primary" />
              Download Your Data & Withdraw Funds
            </CardTitle>
            <CardDescription>
              Backup your data and withdraw your wallet balance before deletion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Download Data */}
            <div className="p-4 border border-border rounded-lg bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-2">Download Your Data</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get a copy of your match history, statistics, messages, and other data before it's permanently deleted.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                    <li>• Match history and statistics</li>
                    <li>• Messages and chat logs</li>
                    <li>• Transaction history</li>
                    <li>• Profile information</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <Separator />

            {/* Wallet Balance */}
            <div className="p-4 border border-amber-500/30 rounded-lg bg-amber-500/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                    Wallet Balance: $1,247.50
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    You have funds in your wallet. Please withdraw all funds before deleting your account.
                  </p>
                  <Badge className="bg-amber-500 text-white mb-3">
                    Action Required
                  </Badge>
                </div>
                <Button
                  className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => onNavigate?.('withdraw-funds')}
                >
                  Withdraw Funds
                </Button>
              </div>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive mb-1">Important</p>
                  <p className="text-muted-foreground">
                    Any remaining balance in your wallet will be forfeited after account deletion. Make sure to withdraw all funds.
                  </p>
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
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Understand Consequences */}
      {step === 3 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Understand What Will Be Deleted
            </CardTitle>
            <CardDescription>
              Please review what will be permanently deleted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* What Will Be Deleted */}
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <h4 className="font-medium text-destructive mb-3 flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                All of the following will be permanently deleted:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>Your profile and all personal information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>All match history, statistics, and achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>Messages, conversations, and chat history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>Friends list and social connections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>Team memberships and tournament entries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>Trust score, rankings, and leaderboard positions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>Transaction history and any unclaimed rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>Connected accounts and integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✕</span>
                  <span>Premium subscriptions and credits</span>
                </li>
              </ul>
            </div>

            <Separator />

            {/* Confirmations */}
            <div className="space-y-3">
              <Label>Please confirm you understand:</Label>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                  <Checkbox
                    id="permanentDeletion"
                    checked={confirmations.permanentDeletion}
                    onCheckedChange={(checked) => 
                      setConfirmations({ ...confirmations, permanentDeletion: checked as boolean })
                    }
                  />
                  <label htmlFor="permanentDeletion" className="text-sm cursor-pointer leading-tight font-medium text-destructive">
                    This action is PERMANENT and IRREVERSIBLE
                  </label>
                </div>

                <div className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="dataLoss"
                    checked={confirmations.dataLoss}
                    onCheckedChange={(checked) => 
                      setConfirmations({ ...confirmations, dataLoss: checked as boolean })
                    }
                  />
                  <label htmlFor="dataLoss" className="text-sm cursor-pointer leading-tight">
                    All my data will be permanently deleted and cannot be recovered
                  </label>
                </div>

                <div className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="noRecovery"
                    checked={confirmations.noRecovery}
                    onCheckedChange={(checked) => 
                      setConfirmations({ ...confirmations, noRecovery: checked as boolean })
                    }
                  />
                  <label htmlFor="noRecovery" className="text-sm cursor-pointer leading-tight">
                    I cannot reactivate or recover my account after deletion
                  </label>
                </div>

                <div className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="walletWithdrawn"
                    checked={confirmations.walletWithdrawn}
                    onCheckedChange={(checked) => 
                      setConfirmations({ ...confirmations, walletWithdrawn: checked as boolean })
                    }
                  />
                  <label htmlFor="walletWithdrawn" className="text-sm cursor-pointer leading-tight">
                    I have withdrawn all funds from my wallet or accept forfeiting them
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!allConfirmationsChecked}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Final Confirmation */}
      {step === 4 && (
        <Card className="border-destructive hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <Trash2 className="h-5 w-5 mr-2" />
              Final Confirmation
            </CardTitle>
            <CardDescription>
              Type the confirmation text and enter your password to permanently delete your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive mb-2">
                    You are about to permanently delete your account
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    This action is <span className="font-semibold text-destructive">irreversible</span>. Once deleted, your account and all associated data will be gone forever.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmText">Type "DELETE MY ACCOUNT" to confirm</Label>
              <Input
                id="confirmText"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className={`bg-input-background ${
                  confirmationText && !confirmationTextValid ? 'border-destructive' : ''
                }`}
              />
              {confirmationText && !confirmationTextValid && (
                <p className="text-xs text-destructive">
                  Please type exactly: DELETE MY ACCOUNT
                </p>
              )}
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

            <Separator />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!confirmationTextValid || !password || isProcessing}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isProcessing ? 'Deleting Account...' : 'Permanently Delete Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
