import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { useAuth } from "./AuthContext";
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
  Calendar,
  Swords,
  Search,
  Trash2,
} from "lucide-react";

interface Notification {
  id: string;
  type:
    | "match"
    | "tournament"
    | "wager"
    | "party"
    | "mention"
    | "system"
    | "escrow"
    | "team-invite"
    | "message"
    | "match-joined"
    | "match-request"
    | "event-starting"
    | "event-started";
  category: "all" | "mentions" | "system";
  title: string;
  message: string;
  timestamp: string;
  game?: string;
  read: boolean;
  data?: Record<string, unknown>;
  badge?: {
    text: string;
    color: "emerald" | "amber" | "red" | "blue";
  };
}

const STORAGE_KEY = "wb_notifications";
const API_URL = "http://localhost:4000";

interface NotificationsDropdownProps {
  onNavigate?: (tab: string, query?: string) => void;
}

export function NotificationsDropdown({
  onNavigate,
}: NotificationsDropdownProps) {
  const { user, token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "mentions" | "system">(
    "all",
  );
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Persist notifications to localStorage (cap at 50)
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications.slice(0, 50)),
    );
  }, [notifications]);

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const socket = io(API_URL, { auth: { token }, withCredentials: true });
    socketRef.current = socket;

    socket.on(
      "notification:new",
      (notif: Omit<Notification, "read" | "category"> & { body?: string }) => {
        setNotifications((prev) =>
          [
            {
              ...notif,
              message: notif.message ?? notif.body ?? "",
              read: false,
              category: "all" as const,
            },
            ...prev,
          ].slice(0, 50),
        );
      },
    );

    socket.on(
      "message",
      (msg: {
        id?: string;
        content?: string;
        senderId?: string;
        channelId?: string;
        sender?: { username?: string };
      }) => {
        if (!msg.senderId || msg.senderId === user?.id) return;
        const preview = (msg.content ?? "").slice(0, 60);
        setNotifications((prev) =>
          [
            {
              id: `msg-${msg.id ?? Date.now()}`,
              type: "message" as const,
              category: "mentions" as const,
              title: "New Message",
              message: `${msg.sender?.username ?? "Someone"}: ${preview}`,
              timestamp: new Date().toISOString(),
              read: false,
              data: { senderId: msg.senderId, channelId: msg.channelId },
            },
            ...prev,
          ].slice(0, 50),
        );
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, user?.id]);

  // Mark all as read when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "team-invite":
        return <Users className="h-4 w-4 text-primary" />;
      case "match":
        return <Trophy className="h-4 w-4 text-emerald-400" />;
      case "tournament":
        return <Trophy className="h-4 w-4 text-purple-400" />;
      case "wager":
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case "escrow":
        return <Wallet className="h-4 w-4 text-blue-400" />;
      case "party":
        return <Users className="h-4 w-4 text-pink-400" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-blue-400" />;
      case "system":
        return <ShieldCheck className="h-4 w-4 text-amber-400" />;
      case "message":
        return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case "match-joined":
        return <Swords className="h-4 w-4 text-emerald-400" />;
      case "match-request":
        return <Swords className="h-4 w-4 text-primary" />;
      case "event-starting":
        return <Calendar className="h-4 w-4 text-amber-400" />;
      case "event-started":
        return <Calendar className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-600 text-white";
      case "amber":
        return "bg-amber-600 text-white";
      case "red":
        return "bg-red-600 text-white";
      case "blue":
        return "bg-blue-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesTab =
      activeTab === "all" || notification.category === activeTab;
    const matchesGame =
      gameFilter === "all" || notification.game === gameFilter;
    const matchesType =
      typeFilter === "all" || notification.type === typeFilter;
    return matchesTab && matchesGame && matchesType;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts; // already relative (e.g. "2h")
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    return `${Math.floor(diff / 86_400_000)}d`;
  };

  const handleNotificationClick = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
    setIsOpen(false);
    const d = notification.data ?? {};
    switch (notification.type) {
      case "message":
        // Open the specific conversation if we have a channelId
        onNavigate?.(
          "messages",
          (d.channelId as string | undefined) ??
            (d.senderId as string | undefined),
        );
        break;
      case "match-joined":
        // Deep-link to the specific match
        if (d.matchId) onNavigate?.(`view-match-${d.matchId}`);
        else onNavigate?.("my-events");
        break;
      case "match-request":
        // Open my-events so the user can accept/decline
        onNavigate?.("my-events");
        break;
      case "event-starting":
      case "event-started":
        onNavigate?.("tournaments");
        break;
      case "team-invite":
        onNavigate?.("team-invites");
        break;
      default:
        break;
    }
  };

  const handleViewAllNotifications = () => {
    setActiveTab("all");
    // Scroll to top of notifications
    const scrollArea = document.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    onNavigate?.("notifications-preferences");
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
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10 focus:ring-2 focus:ring-primary"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-primary text-primary-foreground flex items-center justify-center text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] max-w-[340px] sm:w-96 max-h-[60vh] sm:max-h-[70vh] p-0 bg-card border-border"
        align="end"
        sideOffset={8}
      >
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
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleClearAll}
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
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
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full"
          >
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
                  <SelectItem value="all" className="text-primary">
                    All Games
                  </SelectItem>
                  <SelectItem value="Valorant" className="text-foreground">
                    Valorant
                  </SelectItem>
                  <SelectItem value="CS2" className="text-foreground">
                    CS2
                  </SelectItem>
                  <SelectItem value="Apex" className="text-foreground">
                    Apex
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-24 h-8 text-xs bg-muted border-primary/30 text-primary">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all" className="text-primary">
                    All Types
                  </SelectItem>
                  <SelectItem value="match" className="text-foreground">
                    Win/Loss
                  </SelectItem>
                  <SelectItem value="party" className="text-foreground">
                    Invite
                  </SelectItem>
                  <SelectItem value="escrow" className="text-foreground">
                    Payment
                  </SelectItem>
                  <SelectItem value="system" className="text-foreground">
                    Dispute
                  </SelectItem>
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
                      {filteredNotifications.map((notification, index) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg notification-item-slide cursor-pointer ${
                            !notification.read
                              ? "bg-primary/5 border border-primary/10 hover:bg-primary/10"
                              : "hover:bg-muted/50"
                          }`}
                          style={{ animationDelay: `${400 + index * 80}ms` }}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`font-medium text-sm ${
                                    !notification.read
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              {notification.badge && (
                                <div className="mt-1">
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded font-semibold ${getBadgeStyles(notification.badge.color)}`}
                                  >
                                    {notification.badge.text}
                                  </span>
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
                      <p className="text-sm text-muted-foreground mb-4">
                        No notifications yet.
                      </p>
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
