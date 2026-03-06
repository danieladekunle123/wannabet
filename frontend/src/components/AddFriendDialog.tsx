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
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

export function AddFriendDialog({ open, onOpenChange, onAdded }: AddFriendDialogProps) {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const handleSubmit = async () => {
    if (!username.trim()) return alert('Enter a username');
    setIsSubmitting(true);
    try {
      // Lookup user by username
      const lookupRes = await fetch(`${API_URL}/users/by-username/${encodeURIComponent(username)}`);
      if (!lookupRes.ok) throw new Error('User not found');
      const lookupData = await lookupRes.json();
      const targetId = lookupData.user.id;

      // Send friend add request
      const res = await fetch(`${API_URL}/users/${targetId}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Failed to send friend request');

      setIsSuccess(true);
      onAdded?.();
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
        setUsername('');
        setMessage('');
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to add friend');
    } finally {
      setIsSubmitting(false);
    }
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
              <h3 className="text-xl font-bold text-foreground mb-2">Friend Added!</h3>
              <p className="text-sm text-muted-foreground">{username} has been added to your friends list.</p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Add Friend</span>
              </DialogTitle>
              <DialogDescription>Lookup a user by username and add them as a friend</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Exact username (case sensitive)" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Optional message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[80px]" />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Adding...</>) : (<><UserPlus className="h-4 w-4 mr-2"/>Add Friend</>)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
