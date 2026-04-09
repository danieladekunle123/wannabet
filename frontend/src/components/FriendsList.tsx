import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Search,
  UserMinus,
  Ban,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  Gamepad2,
  Clock,
  TrendingUp,
  Star,
  Shield,
  AlertTriangle,
  UserX,
  Mail,
  MoreVertical,
  Eye,
  Trophy,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { UserAvatar } from "./UserAvatar";
import { usePresence } from "../context/PresenceContext";

interface Friend {
  id: string;
  username: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  avatarUrl?: string | null;
  status: "online" | "away" | "busy" | "offline";
  trustScore: number;
  level: number;
  wins: number;
  mmr: number;
  currentGame?: string;
  friendSince: string;
  lastOnline: string;
  mutualFriends: number;
}

interface FriendRequest {
  id: string;
  senderId: string;
  username: string;
  profileImageUrl?: string | null;
  avatarUrl?: string | null;
  trustScore: number;
  level: number;
  wins: number;
  mmr: number;
  mutualFriends: number;
  requestedAt: string;
  message?: string;
}

interface BlockedUser {
  id: string;
  username: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  avatarUrl?: string | null;
  blockedAt: string;
}

export function FriendsList({
  onNavigate,
}: {
  onNavigate: (tab: string, query?: string) => void;
}) {
  const { token, user } = useAuth();
  const { watchUsers, getStatus } = usePresence();
  const API_URL = import.meta.env.VITE_API_URL ?? "";
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [friendToBlock, setFriendToBlock] = useState<Friend | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [actionError, setActionError] = useState<string>("");

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/friends`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("Failed to load friends");
      const data = await res.json();
      const list = (data.friends || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        displayName: u.profile?.displayName || u.username,
        profileImageUrl: u.profileImageUrl || u.avatarUrl || null,
        avatarUrl: u.avatarUrl || null,
        status: "offline",
        trustScore: u.profile?.trustScore ?? 87,
        level: u.profile?.level ?? 1,
        wins: 0,
        mmr: 1000,
        friendSince: "",
        lastOnline: "",
        mutualFriends: 0,
      }));
      setFriends(list);
      watchUsers(list.map((f: Friend) => f.id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/friend-requests/incoming`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("Failed to load friend requests");
      const data = await res.json();
      const requests = (data.requests || []).map((req: any) => ({
        id: req.id,
        senderId: req.senderId,
        username: req.sender?.username || "Unknown",
        profileImageUrl:
          req.sender?.profileImageUrl || req.sender?.avatarUrl || null,
        avatarUrl: req.sender?.avatarUrl || null,
        trustScore: req.sender?.profile?.trustScore ?? 100,
        level: req.sender?.profile?.level ?? 1,
        wins: 0,
        mmr: 1000,
        mutualFriends: 0,
        requestedAt: req.createdAt
          ? new Date(req.createdAt).toLocaleString()
          : "",
        message: undefined,
      }));
      setFriendRequests(requests);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/blocked`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("Failed to load blocked users");
      const data = await res.json();
      const list = (data.blocked || []).map((entry: any) => ({
        id: entry.blocked?.id,
        username: entry.blocked?.username || "Unknown",
        displayName:
          entry.blocked?.profile?.displayName || entry.blocked?.username,
        profileImageUrl:
          entry.blocked?.profileImageUrl || entry.blocked?.avatarUrl || null,
        avatarUrl: entry.blocked?.avatarUrl || null,
        blockedAt: entry.createdAt
          ? new Date(entry.createdAt).toLocaleString()
          : "",
      }));
      setBlockedUsers(list.filter((u: BlockedUser) => Boolean(u.id)));
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (!token) return;
    fetchFriends();
    fetchIncomingRequests();
    fetchBlockedUsers();
  }, [token]);

  // friendRequests kept for UI; backend currently accepts direct adds

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "away":
        return "bg-amber-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-muted-foreground";
      default:
        return "bg-muted-foreground";
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const onlineFriends = filteredFriends.filter((f) => {
    const s = getStatus(f.id);
    return s === "online" || s === "idle";
  });
  const offlineFriends = filteredFriends.filter(
    (f) => getStatus(f.id) === "offline",
  );
  const awayBusyFriends = filteredFriends.filter(
    (f) => getStatus(f.id) === "dnd",
  );
  const filteredFriendRequests = friendRequests.filter((r) =>
    r.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredBlockedUsers = blockedUsers.filter((b) =>
    b.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/users/me/friend-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ action: "accept" }),
        },
      );
      if (!res.ok) throw new Error("Failed to accept request");
      await Promise.all([fetchFriends(), fetchIncomingRequests()]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/users/me/friend-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ action: "decline" }),
        },
      );
      if (!res.ok) throw new Error("Failed to decline request");
      await fetchIncomingRequests();
    } catch (err) {
      console.error(err);
    }
  };
  const handleRemoveFriend = async (friend: Friend) => {
    try {
      setActionError("");
      const res = await fetch(`${API_URL}/users/${friend.id}/friends`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to remove friend");
      }

      setFriendToRemove(null);
      await Promise.all([fetchFriends(), fetchIncomingRequests()]);
    } catch (err: any) {
      console.error(err);
      setActionError(err?.message || "Failed to remove friend");
    }
  };

  const handleBlockUser = async (friend: Friend) => {
    try {
      setActionError("");
      const res = await fetch(`${API_URL}/users/${friend.id}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to block user");
      }

      setFriendToBlock(null);
      await Promise.all([
        fetchFriends(),
        fetchIncomingRequests(),
        fetchBlockedUsers(),
      ]);
    } catch (err: any) {
      console.error(err);
      setActionError(err?.message || "Failed to block user");
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      setActionError("");
      const res = await fetch(`${API_URL}/users/${userId}/block`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to unblock user");
      }

      await fetchBlockedUsers();
    } catch (err: any) {
      console.error(err);
      setActionError(err?.message || "Failed to unblock user");
    }
  };

  const handleSendMessage = (friendId: string) => {
    const target = friends.find((f) => f.id === friendId);
    const encodedName = encodeURIComponent(target?.username || "");
    onNavigate("messages", `user:${friendId}:${encodedName}`);
  };
  const handleViewProfile = (friendId: string) => {
    onNavigate(`profile-${friendId}`);
  };
  const handleInviteToMatch = (friendId: string) => {
    onNavigate(`request-match:${friendId}`);
  };

  return (
    <div className="min-h-full pt-16 lg:pl-64 bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Friends
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your friends, requests, and blocked users
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {actionError && (
            <Alert className="mb-4 border-red-500/40 bg-red-500/10">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-blue-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {friends.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Friends
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`h-3 w-3 rounded-full ${getStatusColor("online")} animate-pulse`}
                  />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {onlineFriends.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Online Now
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Mail className="h-8 w-8 text-amber-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400">
                      {friendRequests.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pending Requests
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Ban className="h-8 w-8 text-red-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">
                      {blockedUsers.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Blocked Users
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="friends-search-input"
                  placeholder="Search current tab..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/30 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted/50 h-auto">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All Friends
                <Badge className="ml-2 bg-blue-600 text-white text-xs">
                  {friends.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="online"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Online
                <Badge className="ml-2 bg-emerald-600 text-white text-xs">
                  {onlineFriends.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Requests
                {friendRequests.length > 0 && (
                  <Badge className="ml-2 bg-amber-600 text-white text-xs">
                    {friendRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="blocked"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Blocked
                {blockedUsers.length > 0 && (
                  <Badge className="ml-2 bg-red-600 text-white text-xs">
                    {blockedUsers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle>All Friends ({filteredFriends.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {onlineFriends.length > 0 && (
                        <>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Online — {onlineFriends.length}
                          </div>
                          <AnimatePresence>
                            {onlineFriends.map((friend, index) => (
                              <FriendCard
                                key={friend.id}
                                friend={friend}
                                index={index}
                                onViewProfile={handleViewProfile}
                                onSendMessage={handleSendMessage}
                                onInviteToMatch={handleInviteToMatch}
                                onRemove={() => setFriendToRemove(friend)}
                                onBlock={() => setFriendToBlock(friend)}
                              />
                            ))}
                          </AnimatePresence>
                        </>
                      )}

                      {awayBusyFriends.length > 0 && (
                        <>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                            Away/Busy — {awayBusyFriends.length}
                          </div>
                          <AnimatePresence>
                            {awayBusyFriends.map((friend, index) => (
                              <FriendCard
                                key={friend.id}
                                friend={friend}
                                index={index}
                                onViewProfile={handleViewProfile}
                                onSendMessage={handleSendMessage}
                                onInviteToMatch={handleInviteToMatch}
                                onRemove={() => setFriendToRemove(friend)}
                                onBlock={() => setFriendToBlock(friend)}
                              />
                            ))}
                          </AnimatePresence>
                        </>
                      )}

                      {offlineFriends.length > 0 && (
                        <>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                            Offline — {offlineFriends.length}
                          </div>
                          <AnimatePresence>
                            {offlineFriends.map((friend, index) => (
                              <FriendCard
                                key={friend.id}
                                friend={friend}
                                index={index}
                                onViewProfile={handleViewProfile}
                                onSendMessage={handleSendMessage}
                                onInviteToMatch={handleInviteToMatch}
                                onRemove={() => setFriendToRemove(friend)}
                                onBlock={() => setFriendToBlock(friend)}
                              />
                            ))}
                          </AnimatePresence>
                        </>
                      )}

                      {filteredFriends.length === 0 && (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No friends found
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="online" className="space-y-6">
              <Card className="border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${getStatusColor("online")} animate-pulse`}
                    />
                    Online Friends ({onlineFriends.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {onlineFriends.map((friend, index) => (
                          <FriendCard
                            key={friend.id}
                            friend={friend}
                            index={index}
                            onViewProfile={handleViewProfile}
                            onSendMessage={handleSendMessage}
                            onInviteToMatch={handleInviteToMatch}
                            onRemove={() => setFriendToRemove(friend)}
                            onBlock={() => setFriendToBlock(friend)}
                          />
                        ))}
                      </AnimatePresence>
                      {onlineFriends.length === 0 && (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No friends online
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-400" />
                    Incoming Friend Requests ({friendRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {filteredFriendRequests.map((request, index) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-lg border bg-muted/30 border-border/50 hover:bg-muted/50 transition-all duration-300"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <UserAvatar
                                  className="h-12 w-12"
                                  name={request.username}
                                  username={request.username}
                                  imageUrl={
                                    request.profileImageUrl || request.avatarUrl
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-foreground">
                                    {request.username}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Level {request.level}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <Trophy className="h-3 w-3 mr-1" />
                                      {request.wins} wins
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <Target className="h-3 w-3 mr-1" />
                                      {request.mmr} MMR
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 mb-1">
                                  <Star className="h-4 w-4 text-amber-400" />
                                  <span className="text-sm font-semibold text-amber-400">
                                    {request.trustScore}%
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {request.mutualFriends} mutual
                                </div>
                              </div>
                            </div>

                            {request.message && (
                              <div className="mb-3 p-3 bg-background/50 rounded border border-border/30 text-sm text-foreground">
                                "{request.message}"
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                Requested {request.requestedAt}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                  onClick={() =>
                                    handleDeclineRequest(request.id)
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Decline
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() =>
                                    handleAcceptRequest(request.id)
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {filteredFriendRequests.length === 0 && (
                        <div className="text-center py-12">
                          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No pending friend requests
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blocked" className="space-y-6">
              <Card className="border-red-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5 text-red-400" />
                    Blocked Users ({blockedUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {filteredBlockedUsers.map((user, index) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-lg border bg-red-500/10 border-red-500/30 hover:bg-red-500/20 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <UserAvatar
                                  className="h-10 w-10"
                                  name={user.displayName || user.username}
                                  username={user.username}
                                  imageUrl={
                                    user.profileImageUrl || user.avatarUrl
                                  }
                                  fallbackClassName="bg-red-500/20 text-red-400"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-foreground">
                                    {user.username}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Blocked {user.blockedAt}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => handleUnblockUser(user.id)}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Unblock
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {filteredBlockedUsers.length === 0 && (
                        <div className="text-center py-12">
                          <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No blocked users
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        <Dialog
          open={!!friendToRemove}
          onOpenChange={(open) => !open && setFriendToRemove(null)}
        >
          <DialogContent className="bg-card border-primary/30">
            <DialogHeader>
              <DialogTitle>Remove Friend</DialogTitle>
              <DialogDescription>
                Remove {friendToRemove?.username} from your friends?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFriendToRemove(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() =>
                  friendToRemove && handleRemoveFriend(friendToRemove)
                }
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Friend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!friendToBlock}
          onOpenChange={(open) => !open && setFriendToBlock(null)}
        >
          <DialogContent className="bg-card border-primary/30">
            <DialogHeader>
              <DialogTitle>Block User</DialogTitle>
              <DialogDescription>
                Block {friendToBlock?.username}? You will no longer receive
                messages or friend requests from them.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFriendToBlock(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() => friendToBlock && handleBlockUser(friendToBlock)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Friend Card Component
function FriendCard({
  friend,
  index,
  onViewProfile,
  onSendMessage,
  onInviteToMatch,
  onRemove,
  onBlock,
}: {
  friend: Friend;
  index: number;
  onViewProfile: (id: string) => void;
  onSendMessage: (id: string) => void;
  onInviteToMatch: (id: string) => void;
  onRemove: () => void;
  onBlock: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "away":
        return "bg-amber-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-muted-foreground";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "busy":
        return "Busy";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const { getStatus, watchUsers } = usePresence();
  useEffect(() => {
    watchUsers([friend.id]);
  }, [friend.id, watchUsers]);
  const liveStatus = getStatus(friend.id);
  const liveColorMap: Record<string, string> = {
    online: "bg-emerald-500",
    idle: "bg-yellow-400",
    dnd: "bg-red-500",
    offline: "bg-muted-foreground",
  };
  const liveColor = liveColorMap[liveStatus] ?? "bg-muted-foreground";
  const liveText =
    liveStatus === "online"
      ? "Online"
      : liveStatus === "idle"
        ? "Idle"
        : liveStatus === "dnd"
          ? "Do Not Disturb"
          : "Offline";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 rounded-lg border bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <UserAvatar
              className="h-12 w-12"
              name={friend.displayName || friend.username}
              username={friend.username}
              imageUrl={friend.profileImageUrl || friend.avatarUrl}
              fallbackClassName="bg-primary/20 text-primary text-lg"
            />
            <div
              className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${liveColor} ${liveStatus === "online" ? "animate-pulse" : ""}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-foreground truncate">
                {friend.username}
              </div>
              {friend.trustScore > 95 && (
                <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={liveStatus === "online" ? "text-emerald-400" : ""}
              >
                {liveText}
              </span>
              {friend.currentGame && (
                <>
                  <span>•</span>
                  <Gamepad2 className="h-3 w-3" />
                  <span className="truncate">{friend.currentGame}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs">
                Lvl {friend.level}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-amber-400">
                  {friend.trustScore}%
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                {friend.wins}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
            onClick={() => onSendMessage(friend.id)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          {liveStatus === "online" && (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => onInviteToMatch(friend.id)}
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-card border-primary/30"
            >
              <DropdownMenuItem onClick={() => onViewProfile(friend.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendMessage(friend.id)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove} className="text-amber-400">
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Friend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBlock} className="text-red-400">
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

export default FriendsList;
