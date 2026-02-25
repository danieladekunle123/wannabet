import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield,
  Wallet,
  CreditCard
} from 'lucide-react';

interface ProfileDropdownProps {
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
}

export function ProfileDropdown({ onNavigate, onSignOut }: ProfileDropdownProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const userStats = {
    username: 'YouAreHere',
    displayName: 'Elite Gamer',
    trustScore: 98.5,
    totalEarnings: 12400,
    currentRank: 42,
    mmr: 2450,
    winRate: 84.7,
    totalWins: 127,
    escrowBalance: 250.50,
    availableCredits: 1840.00
  };

  const handleNavigateAndClose = (page: string) => {
    setIsPopoverOpen(false);
    // Small delay to allow popover close animation to complete
    setTimeout(() => {
      onNavigate?.(page);
    }, 100);
  };

  // Close profile dropdown when scrolling the page
  React.useEffect(() => {
    if (!isPopoverOpen) return;

    let lastScrollY = window.scrollY;
    let isClosing = false;

    const handleScroll = () => {
      // Only close if there's actual window scroll movement
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) > 5 && !isClosing) {
        isClosing = true;
        setIsPopoverOpen(false);
      }
    };

    // Add scroll listener to window with passive flag
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isPopoverOpen]);

  const QuickAccountMenu = () => (
    <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-0 bg-card border-border" align="end" sideOffset={8}>
      {/* Profile Summary */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent profile-header-slide">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              YA
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{userStats.displayName}</h3>
            <p className="text-sm text-muted-foreground">@{userStats.username}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className="bg-emerald-600 text-white text-xs">
                #{userStats.currentRank} Global
              </Badge>
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">{userStats.trustScore}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => handleNavigateAndClose('my-profile')}
          >
            View Profile
          </Button>
        </div>
      </div>

      <div className="p-2">
        {/* Core Actions */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1 profile-section-label">Account</p>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
            style={{ animationDelay: '200ms' }}
            onClick={() => handleNavigateAndClose('account-settings')}
          >
            <Settings className="h-4 w-4 mr-3" />
            Account Settings
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
            style={{ animationDelay: '260ms' }}
            onClick={() => handleNavigateAndClose('wallet-escrow')}
          >
            <Wallet className="h-4 w-4 mr-3" />
            Wallet & Escrow
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
            style={{ animationDelay: '320ms' }}
            onClick={() => handleNavigateAndClose('subscriptions-credits')}
          >
            <CreditCard className="h-4 w-4 mr-3" />
            Subscriptions / Credits
          </Button>
        </div>

        <Separator className="my-2" />

        {/* Danger */}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-400 focus:ring-2 focus:ring-primary profile-menu-item"
          style={{ animationDelay: '860ms' }}
          onClick={() => {
            setIsPopoverOpen(false);
            setTimeout(() => {
              onSignOut?.();
            }, 100);
          }}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign out
        </Button>
      </div>
    </PopoverContent>
  );

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-primary/10 focus:ring-2 focus:ring-primary">
          <User className="h-5 w-5 text-foreground" />
        </Button>
      </PopoverTrigger>
      <QuickAccountMenu />
    </Popover>
  );
}