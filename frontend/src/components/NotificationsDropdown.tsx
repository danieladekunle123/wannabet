import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { 
  Bell, 
  Trophy, 
  Users, 
  DollarSign, 
  MessageCircle, 
  Settings, 
  Wallet,
  AtSign,
  ShieldCheck,
  AlertTriangle,
  MoreHorizontal,
  Search,
  RefreshCw
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'match' | 'tournament' | 'wager' | 'party' | 'mention' | 'system' | 'escrow' | 'team-invite';
  category: 'all' | 'mentions' | 'system';
  title: string;
  message: string;
  timestamp: string;
  game?: string;
  read: boolean;
  actions?: Array<{
    label: string;
    variant?: 'default' | 'outline' | 'ghost';
    primary?: boolean;
  }>;
  badge?: {
    text: string;
    color: 'emerald' | 'amber' | 'red' | 'blue';
  };
}

interface NotificationsDropdownProps {
  onNavigate?: (tab: string) => void;
}

export function NotificationsDropdown({ onNavigate }: NotificationsDropdownProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'system'>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const notifications: Notification[] = [
    {
      id: '0',
      type: 'team-invite',
      category: 'all',
      title: 'Team Invitation',
      message: 'CommanderZero invited you to join Apex Predators',
      timestamp: '2h',
      game: 'Valorant',
      read: false,
      badge: { text: 'NEW', color: 'blue' }
    },
    {
      id: '1',
      type: 'match',
      category: 'all',
      title: 'Match Result',
      message: 'You won vs Team Riptide in Valorant BO3 (2–1). Payout available.',
      timestamp: '2m',
      game: 'Valorant',
      read: false,
      badge: { text: 'WIN', color: 'emerald' }
    },
    {
      id: '2',
      type: 'escrow',
      category: 'all',
      title: 'Escrow/Wallet',
      message: '+120 credits from Match #8391. Escrow released.',
      timestamp: '1h',
      read: false
    },
    {
      id: '3',
      type: 'party',
      category: 'all',
      title: 'Party/Invite',
      message: 'Nico invited you to join a party.',
      timestamp: '1h',
      read: false
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team-invite': return <Users className="h-4 w-4 text-primary" />;
      case 'match': return <Trophy className="h-4 w-4 text-emerald-400" />;
      case 'tournament': return <Trophy className="h-4 w-4 text-purple-400" />;
      case 'wager': return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'escrow': return <Wallet className="h-4 w-4 text-blue-400" />;
      case 'party': return <Users className="h-4 w-4 text-pink-400" />;
      case 'mention': return <AtSign className="h-4 w-4 text-blue-400" />;
      case 'system': return <ShieldCheck className="h-4 w-4 text-amber-400" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-600 text-white';
      case 'amber': return 'bg-amber-600 text-white';
      case 'red': return 'bg-red-600 text-white';
      case 'blue': return 'bg-blue-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = activeTab === 'all' || notification.category === activeTab;
    const matchesGame = gameFilter === 'all' || notification.game === gameFilter;
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    return matchesTab && matchesGame && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    // Mock implementation - would update state/API
    console.log('Mark all notifications as read');
  };

  const handleRetry = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleViewAllNotifications = () => {
    setActiveTab('all');
    // Scroll to top of notifications
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    onNavigate?.('notifications-preferences');
  };

  // Close notification dropdown when scrolling the page (not internal scroll)
  React.useEffect(() => {
    if (!isOpen) return;

    let lastScrollY = window.scrollY;
    let isClosing = false;

    const handleScroll = () => {
      // Only close if there's actual window scroll movement
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) > 5 && !isClosing) {
        isClosing = true;
        setIsOpen(false);
      }
    };

    // Add scroll listener to window with passive flag
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 focus:ring-2 focus:ring-primary">
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-primary text-primary-foreground flex items-center justify-center text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-[340px] sm:w-96 max-h-[60vh] sm:max-h-[70vh] p-0 bg-card border-border" align="end" sideOffset={8}>
        <div>
        {/* Header */}
        <div className="p-4 border-b border-border notification-header-slide">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Notifications</h3>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={handleSettingsClick}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <div className="px-4 pt-4 notification-tabs-slide">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="mentions"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent"
              >
                Mentions
              </TabsTrigger>
              <TabsTrigger 
                value="system"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent"
              >
                System
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 flex space-x-2 border-b border-border notification-filters-slide">
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-muted border-primary/30 text-primary">
                <SelectValue placeholder="Game" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-primary">All Games</SelectItem>
                <SelectItem value="Valorant" className="text-foreground">Valorant</SelectItem>
                <SelectItem value="CS2" className="text-foreground">CS2</SelectItem>
                <SelectItem value="Apex" className="text-foreground">Apex</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-24 h-8 text-xs bg-muted border-primary/30 text-primary">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-primary">All Types</SelectItem>
                <SelectItem value="match" className="text-foreground">Win/Loss</SelectItem>
                <SelectItem value="party" className="text-foreground">Invite</SelectItem>
                <SelectItem value="escrow" className="text-foreground">Payment</SelectItem>
                <SelectItem value="system" className="text-foreground">Dispute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="max-h-80 [&>[data-radix-scroll-area-viewport]]:max-h-80">
              <div className="p-2">
                {isLoading ? (
                  // Loading state
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-3 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <div className="flex space-x-2">
                              <Skeleton className="h-6 w-16" />
                              <Skeleton className="h-6 w-20" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {filteredNotifications.slice(0, 5).map((notification, index) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg notification-item-slide ${
                          notification.type === 'team-invite' 
                            ? 'bg-primary/5 border border-primary/20 hover:bg-primary/10 cursor-pointer' 
                            : 'hover:bg-muted/50'
                        }`}
                        style={{ animationDelay: `${400 + index * 80}ms` }}
                        onClick={() => {
                          if (notification.type === 'team-invite') {
                            setIsOpen(false);
                            onNavigate?.('team-invites');
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-foreground text-sm">
                                {notification.title}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {notification.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            {notification.type === 'team-invite' && (
                              <div className="mt-2 flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  View Invite →
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Empty state
                  <div className="p-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">No notifications yet.</p>
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Find Matches
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Footer */}
        <div className="p-3 border-t border-border notification-footer-slide">
          <Button 
            variant="ghost" 
            className="w-full text-primary hover:bg-primary/10"
            onClick={handleViewAllNotifications}
          >
            View all notifications
          </Button>
        </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}