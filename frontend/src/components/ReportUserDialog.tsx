import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Flag, 
  Check, 
  Loader2, 
  ShieldAlert, 
  MessageSquare, 
  UserX, 
  CreditCard, 
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  avatar: string;
  userId?: string;
}

type ReportReason = 
  | 'harassment' 
  | 'cheating' 
  | 'offensive-content' 
  | 'fraud' 
  | 'impersonation' 
  | 'other';

const reportReasons = [
  {
    value: 'harassment' as ReportReason,
    label: 'Harassment or Abuse',
    description: 'Threatening, bullying, or hateful behavior',
    icon: ShieldAlert,
    severity: 'high'
  },
  {
    value: 'cheating' as ReportReason,
    label: 'Cheating or Exploits',
    description: 'Using hacks, exploits, or unfair advantages',
    icon: AlertTriangle,
    severity: 'high'
  },
  {
    value: 'offensive-content' as ReportReason,
    label: 'Offensive Content',
    description: 'Inappropriate language or content',
    icon: MessageSquare,
    severity: 'medium'
  },
  {
    value: 'fraud' as ReportReason,
    label: 'Fraud or Scam',
    description: 'Payment fraud or scam attempts',
    icon: CreditCard,
    severity: 'high'
  },
  {
    value: 'impersonation' as ReportReason,
    label: 'Impersonation',
    description: 'Pretending to be someone else',
    icon: UserX,
    severity: 'medium'
  },
  {
    value: 'other' as ReportReason,
    label: 'Other',
    description: 'Something else that violates our policies',
    icon: FileText,
    severity: 'low'
  }
];

export function ReportUserDialog({ open, onOpenChange, username, avatar, userId }: ReportUserDialogProps) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedReason = reportReasons.find(r => r.value === reason);

  const handleSubmit = async () => {
    if (!reason || !details.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Close dialog after success animation
    setTimeout(() => {
      onOpenChange(false);
      // Reset state when dialog closes
      setTimeout(() => {
        setIsSuccess(false);
        setReason('');
        setDetails('');
      }, 300);
    }, 2000);
  };

  const isFormValid = reason !== '' && details.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeInUp">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="h-10 w-10 text-primary animate-scaleIn" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">Report Submitted</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Thank you for helping keep our community safe. Our team will review this report and take appropriate action.
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Flag className="h-5 w-5 text-destructive" />
                <span>Report User</span>
              </DialogTitle>
              <DialogDescription>
                Report violations of our community guidelines
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* User Preview */}
              <div className="flex items-center space-x-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-md shrink-0">
                  <span className="text-white font-bold text-lg">{avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{username}</div>
                  <div className="text-xs text-muted-foreground">Filing report against this user</div>
                </div>
                <Badge variant="outline" className="text-destructive border-destructive/50">
                  Report
                </Badge>
              </div>

              {/* Warning Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  False reports may result in penalties to your account. Please only report genuine violations of our community guidelines.
                </AlertDescription>
              </Alert>

              {/* Reason Selection */}
              <div className="space-y-3">
                <Label>Reason for Report *</Label>
                <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
                  <div className="space-y-2">
                    {reportReasons.map((reportReason) => {
                      const Icon = reportReason.icon;
                      return (
                        <div
                          key={reportReason.value}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            reason === reportReason.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/30'
                          }`}
                        >
                          <RadioGroupItem 
                            value={reportReason.value} 
                            id={reportReason.value} 
                            className="mt-0.5" 
                          />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={reportReason.value} 
                              className="cursor-pointer flex items-center space-x-2"
                            >
                              <Icon className={`h-4 w-4 ${
                                reportReason.severity === 'high' ? 'text-destructive' :
                                reportReason.severity === 'medium' ? 'text-amber-500' :
                                'text-muted-foreground'
                              }`} />
                              <span>{reportReason.label}</span>
                              {reportReason.severity === 'high' && (
                                <Badge variant="destructive" className="text-xs px-1.5">High Priority</Badge>
                              )}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {reportReason.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <Label htmlFor="details">
                  Additional Details *
                </Label>
                <Textarea
                  id="details"
                  placeholder={
                    selectedReason
                      ? `Please provide specific details about the ${selectedReason.label.toLowerCase()}...`
                      : 'Please provide specific details about the violation...'
                  }
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                  disabled={!reason}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {details.length < 10 ? (
                      <span className="text-destructive">Minimum 10 characters required</span>
                    ) : (
                      'Provide as much detail as possible to help our review'
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground">{details.length}/500</span>
                </div>
              </div>

              {/* Privacy Note */}
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Your report is confidential. The reported user will not be notified of who submitted the report.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                variant="destructive"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
