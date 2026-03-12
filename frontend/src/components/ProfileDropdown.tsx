import React, { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import {
  Settings,
  LogOut,
  Shield,
  Crown,
  Wallet,
  CreditCard,
} from "lucide-react";
import { UserPlus } from "lucide-react";
import { useAuth } from "./AuthContext";
import { UserAvatar } from "./UserAvatar";

interface ProfileDropdownProps {
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
}

export function ProfileDropdown({
  onNavigate,
  onSignOut,
}: ProfileDropdownProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { user, logout } = useAuth();

  const userStats = {
    username: user?.username ?? "YouAreHere",
    displayName: user?.profile?.displayName ?? "Elite Gamer",
    trustScore: 98.5,
    totalEarnings: user?.totalEarnings ?? 0,
    currentRank: 42,
    mmr: 2450,
    winRate: 84.7,
    totalWins: 127,
    escrowBalance: user?.wallet?.escrow ?? 0,
    availableCredits: user?.wallet?.balance ?? 0,
  };
  if (!user) return null;

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
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isPopoverOpen]);

  const QuickAccountMenu = () => (
    <PopoverContent
      className="w-[calc(100vw-2rem)] sm:w-80 p-0 bg-card border-border"
      align="end"
      sideOffset={8}
    >
      {/* Profile Summary */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent profile-header-slide">
        <div className="flex items-center space-x-3">
          <UserAvatar
            className="h-12 w-12"
            name={user?.profile?.displayName || user?.username}
            username={user?.username}
            imageUrl={user?.profileImageUrl || user?.avatarUrl}
          />
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{user.username}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className="bg-emerald-600 text-white text-xs">
                #{userStats.currentRank} Global
              </Badge>
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">
                  {userStats.trustScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => handleNavigateAndClose("my-profile")}
          >
            View Profile
          </Button>
        </div>
      </div>

      <div className="p-2">
        {/* Core Actions */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1 profile-section-label">
            Account
          </p>

          <Button
            variant="ghost"
            className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
            style={{ animationDelay: "200ms" }}
            onClick={() => handleNavigateAndClose("account-settings")}
          >
            <Settings className="h-4 w-4 mr-3" />
            Account Settings
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
            style={{ animationDelay: "260ms" }}
            onClick={() => handleNavigateAndClose("wallet-escrow")}
          >
            <Wallet className="h-4 w-4 mr-3" />
            Wallet & Escrow
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
            style={{ animationDelay: "320ms" }}
            onClick={() => handleNavigateAndClose("subscriptions-credits")}
          >
            <CreditCard className="h-4 w-4 mr-3" />
            Subscriptions / Credits
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
            style={{ animationDelay: "360ms" }}
            onClick={() => handleNavigateAndClose("friends")}
          >
            <UserPlus className="h-4 w-4 mr-3" />
            Friends
          </Button>
          {/* Admin/Moderator quick links */}
          {user?.role === "ADMIN" && (
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
              onClick={() => handleNavigateAndClose("admin")}
            >
              <Crown className="h-4 w-4 mr-3" />
              Admin Dashboard
            </Button>
          )}
          {(user?.role === "ADMIN" || user?.role === "MODERATOR") && (
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary profile-menu-item"
              onClick={() => handleNavigateAndClose("moderator")}
            >
              <Shield className="h-4 w-4 mr-3" />
              Moderator Dashboard
            </Button>
          )}
        </div>

        <Separator className="my-2" />

        {/* Danger */}
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-400 focus:ring-2 focus:ring-primary profile-menu-item"
          style={{ animationDelay: "860ms" }}
          onClick={() => {
            setIsPopoverOpen(false);
            setTimeout(() => logout(), 100);
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
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Open profile menu"
        >
          <UserAvatar
            className="h-8 w-8"
            name={user?.profile?.displayName || user?.username}
            username={user?.username}
            imageUrl={user?.profileImageUrl || user?.avatarUrl}
          />
        </button>
      </PopoverTrigger>
      <QuickAccountMenu />
    </Popover>
  );
}
