import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Separator } from './ui/separator';
import { Search, Trophy, Crown, Menu, Users, DollarSign, Swords, Star, LogOut, Gamepad2, TrendingUp, Wallet, Shield } from 'lucide-react';

interface MobileMenuProps {
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
}

export function MobileMenu({ onNavigate, onSignOut }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'lobbies', label: 'Lobbies', icon: Gamepad2, badge: '143', category: 'compete' },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, badge: 'NEW', category: 'compete' },
    { id: 'scrims', label: 'Scrims', icon: Swords, category: 'compete' },
    { id: 'wagers', label: 'Wagers', icon: DollarSign, category: 'compete' },
    { id: 'hubs', label: 'Social Hubs', icon: Users, badge: '5', category: 'social' },
    { id: 'stats', label: 'My Stats', icon: TrendingUp, category: 'profile' },
    { id: 'leaderboards', label: 'Leaderboards', icon: Star, category: 'profile' },
  ];

  const handleNavigation = (page: string) => {
    // Close the menu with transition
    setIsOpen(false);
    // Wait for the sheet close animation to complete before navigating
    setTimeout(() => {
      onNavigate?.(page);
    }, 300);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    setTimeout(() => {
      onSignOut?.();
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden hover:bg-primary/10">
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-card border-border">
        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate to different sections of WannaBet?
        </SheetDescription>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="bg-primary rounded-lg p-2">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">WannaBet?</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-5 border-b border-border/50">
            <Button 
              variant="outline" 
              className="w-full justify-start h-11 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]"
              onClick={() => handleNavigation('search-results')}
            >
              <Search className="h-4 w-4 mr-3" />
              <span>Search</span>
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-3 py-5 overflow-y-auto">
            <nav className="space-y-1.5">
              {/* Compete Section */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground/60 px-3 mb-3 font-semibold">Compete</p>
                {menuItems.filter(item => item.category === 'compete').map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-between h-12 text-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.02] transition-all duration-300 rounded-lg group"
                      onClick={() => handleNavigation(item.id)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors duration-300">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge 
                          className={`text-xs px-2.5 py-0.5 rounded-full shadow-sm ${
                            item.badge === 'NEW' 
                              ? 'bg-primary text-primary-foreground animate-pulse' 
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Social Section */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground/60 px-3 mb-3 font-semibold">Social</p>
                {menuItems.filter(item => item.category === 'social').map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-between h-12 text-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.02] transition-all duration-300 rounded-lg group"
                      onClick={() => handleNavigation(item.id)}
                      style={{ animationDelay: `${(index + 4) * 50}ms` }}
                    >
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors duration-300">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge 
                          className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Profile Section */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground/60 px-3 mb-3 font-semibold">Profile</p>
                {menuItems.filter(item => item.category === 'profile').map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-between h-12 text-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.02] transition-all duration-300 rounded-lg group"
                      onClick={() => handleNavigation(item.id)}
                      style={{ animationDelay: `${(index + 5) * 50}ms` }}
                    >
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors duration-300">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>

              <Separator className="my-5" />

              {/* Wallet Section */}
              <div className="space-y-3 px-1">
                <Button
                  variant="ghost"
                  className="w-full justify-between h-12 text-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.02] transition-all duration-300 rounded-lg group"
                  onClick={() => handleNavigation('wallet-escrow')}
                >
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600/10 flex items-center justify-center mr-3 group-hover:bg-emerald-600/20 transition-colors duration-300">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-medium">Wallet</span>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-xs animate-pulse shadow-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Escrow
                  </Badge>
                </Button>
                
                <div className="pl-12 pr-3 text-sm space-y-2 bg-muted/30 rounded-lg py-3 -mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Available:</span>
                    <span className="text-emerald-400 font-semibold">2,450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">In Escrow:</span>
                    <span className="text-amber-400 font-semibold">500</span>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="px-4 py-5 border-t border-border/50 space-y-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-11 text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:scale-[1.02] transition-all duration-300 rounded-lg group"
              onClick={handleSignOut}
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-colors duration-300">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-medium">Sign Out</span>
            </Button>
            <Separator className="opacity-50" />
            <div className="text-xs text-muted-foreground/70 text-center space-y-1 px-2">
              <div className="font-semibold text-foreground/60">WannaBet? © 2024</div>
              <div className="text-[10px] uppercase tracking-widest">Play • Wager • Win</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}