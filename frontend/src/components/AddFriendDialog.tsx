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
import { UserPlus, Check, Loader2 } from 'lucide-react';

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  avatar: string;
}

export function AddFriendDialog({ open, onOpenChange, username, avatar }: AddFriendDialogProps) {
  const [message, setMessage] = useState('');
  const [privacy, setPrivacy] = useState<'visible' | 'hidden'>('visible');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
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
        setMessage('');
        setPrivacy('visible');
      }, 300);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeInUp">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="h-10 w-10 text-emerald-500 animate-scaleIn" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">Friend Request Sent!</h3>
              <p className="text-sm text-muted-foreground">
                Your friend request has been sent to <span className="text-primary font-medium">{username}</span>
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Add Friend</span>
              </DialogTitle>
              <DialogDescription>
                Send a friend request to {username}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* User Preview */}
              <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-md shrink-0">
                  <span className="text-white font-bold text-lg">{avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{username}</div>
                  <div className="text-xs text-muted-foreground">User will receive your request</div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Hey! I'd love to connect and maybe team up for some matches..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={200}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Add a personal message to your request
                  </p>
                  <span className="text-xs text-muted-foreground">{message.length}/200</span>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-3">
                <Label>Profile Visibility</Label>
                <RadioGroup value={privacy} onValueChange={(value) => setPrivacy(value as 'visible' | 'hidden')}>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer">
                      <RadioGroupItem value="visible" id="visible" className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor="visible" className="cursor-pointer flex items-center space-x-2">
                          <span>Show my profile</span>
                          <Badge variant="outline" className="text-xs">Recommended</Badge>
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {username} can view your profile and stats
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer">
                      <RadioGroupItem value="hidden" id="hidden" className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor="hidden" className="cursor-pointer">
                          Hide my profile
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your profile remains private until request is accepted
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
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
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Request
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
