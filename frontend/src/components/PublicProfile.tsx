import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { ReportUserDialog } from "./ReportUserDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  ArrowLeft,
  Shield,
  Star,
  Trophy,
  TrendingUp,
  MapPin,
  Calendar,
  Gamepad2,
  Users,
  Target,
  Award,
  DollarSign,
  MessageSquare,
  UserPlus,
  UserMinus,
  Ban,
  Flag,
  Crown,
  Flame,
  Swords,
  BarChart3,
  Edit,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { UserAvatar } from "./UserAvatar";

interface PublicProfileProps {
  onNavigate: (tab: string, query?: string) => void;
  userId?: string;
  isOwnProfile?: boolean;
}

// We'll fetch real profile data from the backend. Local fallback used only
// briefly while loading.
import api from "../lib/api";

const emptyFallback = {
  username: "Player",
  avatar: "PL",
  bio: "",
  rank: 0,
  mmr: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  earnings: 0,
  trustScore: 0,
  level: 1,
  tier: "",
  country: "",
  joinDate: "",
  isVerified: false,
  isOnline: false,
  games: [],
  recentMatches: [],
  achievements: [],
  stats: {
    totalMatches: 0,
    totalEarnings: 0,
    avgMatchEarnings: 0,
    longestWinStreak: 0,
    favoriteGame: "",
    mostPlayedHour: "",
    peakRank: 0,
    currentStreak: 0,
  },
};

export function PublicProfile({
  onNavigate,
  userId,
  isOwnProfile = false,
}: PublicProfileProps) {
  const { user, token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const [profileState, setProfileState] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showSendFriendRequestDialog, setShowSendFriendRequestDialog] =
    useState(false);
  const [showRemoveFriendDialog, setShowRemoveFriendDialog] = useState(false);
  const [showBlockUserDialog, setShowBlockUserDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [friendRequestState, setFriendRequestState] = useState<
    "none" | "outgoing" | "incoming" | "friends" | "blocked"
  >("none");
  const [blockedByUser, setBlockedByUser] = useState(false);
  const [isUpdatingFriendRequest, setIsUpdatingFriendRequest] = useState(false);

  const buildProfileFromUser = (u: any) => {
    return {
      userId: u.id,
      username: u.username,
      avatar: (u.username || "").slice(0, 2).toUpperCase(),
      profileImageUrl: u.profileImageUrl || u.avatarUrl || null,
      bio: u.profile?.bio || "",
      country: u.profile?.country || "",
      joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
      isVerified: false,
      isOnline: false,
      tier: "",
      trustScore: u.profile?.trustScore ?? 0,
      earnings: u.totalEarnings ?? 0,
      mmr: 0,
      wins: 0,
      losses: 0,
      stats: { ...emptyFallback.stats },
      recentMatches: u.recentMatches || [],
      achievements: u.achievements || [],
      games: (u.playerGames || []).map((g: any) => ({
        name: g.game,
        level: g.level || 1,
        wins: g.wins || 0,
        losses: g.losses || 0,
        hours: g.hours || 0,
      })),
    };
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingProfile(true);
      try {
        if (isOwnProfile && user) {
          const mapped = buildProfileFromUser(user);
          if (mounted) setProfileState(mapped);
        } else if (userId) {
          const data = await api.getPublicProfile(userId);
          const u = data.user;
          if (!u) throw new Error("User not found");
          const mapped = buildProfileFromUser(u);
          if (mounted) setProfileState(mapped);
        } else {
          if (mounted) setProfileState(emptyFallback);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setProfileState(emptyFallback);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isOwnProfile, user, userId]);

  useEffect(() => {
    let mounted = true;

    async function loadFriendshipStatus() {
      if (isOwnProfile || !userId || !token) return;

      try {
        const res = await fetch(
          `${API_URL}/users/${userId}/friendship-status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        if (data.isFriend) {
          setFriendRequestState("friends");
        } else if (data.blockedByYou) {
          setFriendRequestState("blocked");
          setBlockedByUser(false);
        } else if (data.blockedYou) {
          setFriendRequestState("none");
          setBlockedByUser(true);
        } else if (data.outgoingRequest) {
          setFriendRequestState("outgoing");
          setBlockedByUser(false);
        } else if (data.incomingRequest) {
          setFriendRequestState("incoming");
          setBlockedByUser(false);
        } else {
          setFriendRequestState("none");
          setBlockedByUser(false);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadFriendshipStatus();
    return () => {
      mounted = false;
    };
  }, [API_URL, isOwnProfile, token, userId]);

  const sendFriendRequest = async () => {
    if (!userId || !token) return;
    setIsUpdatingFriendRequest(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/friend-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send friend request");
      }
      setFriendRequestState("outgoing");
      setShowSendFriendRequestDialog(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingFriendRequest(false);
    }
  };

  const retractFriendRequest = async () => {
    if (!userId || !token) return;
    setIsUpdatingFriendRequest(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/friend-requests`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to retract friend request");
      setFriendRequestState("none");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingFriendRequest(false);
    }
  };

  const removeFriend = async () => {
    if (!userId || !token) return;
    setIsUpdatingFriendRequest(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/friends`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to remove friend");
      setFriendRequestState("none");
      setShowRemoveFriendDialog(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingFriendRequest(false);
    }
  };

  const blockUser = async () => {
    if (!userId || !token) return;
    setIsUpdatingFriendRequest(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to block user");
      setFriendRequestState("blocked");
      setBlockedByUser(false);
      setShowBlockUserDialog(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingFriendRequest(false);
    }
  };

  const unblockUser = async () => {
    if (!userId || !token) return;
    setIsUpdatingFriendRequest(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/block`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to unblock user");
      setFriendRequestState("none");
      setBlockedByUser(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingFriendRequest(false);
    }
  };

  if (!profileState && loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  // ensure non-null for rendering
  const displayed = profileState || emptyFallback;
  const profile = displayed;

  if (isOwnProfile && !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header with Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(isOwnProfile ? "home" : "search-results")}
        className="mb-4 hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {isOwnProfile ? "Back to Home" : "Back to Search"}
      </Button>

      {/* Profile Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              <div className="relative shrink-0">
                <UserAvatar
                  className="w-20 h-20 sm:w-24 sm:h-24 shadow-lg"
                  name={profile.username}
                  username={profile.username}
                  imageUrl={profile.profileImageUrl}
                  fallbackClassName="bg-gradient-to-br from-primary to-amber-500 text-white text-2xl sm:text-3xl"
                />
                {profile.isOnline && (
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-card rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {profile.username}
                  </h1>
                  {profile.isVerified && (
                    <Shield className="h-6 w-6 text-blue-400 shrink-0" />
                  )}
                  <Badge
                    className={`${profile.tier === "Elite" ? "bg-amber-600" : "bg-blue-600"} text-white`}
                  >
                    {profile.tier}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {profile.bio}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                  <Badge variant="outline" className="flex items-center">
                    <Trophy className="h-3 w-3 mr-1 text-amber-400" />#
                    {profile.rank} Global
                  </Badge>
                  <Badge variant="outline" className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-amber-400" />
                    {profile.trustScore}% Trust
                  </Badge>
                  <Badge variant="outline" className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {profile.country}
                  </Badge>
                  <Badge variant="outline" className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined {profile.joinDate}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.games.map((game) => (
                    <Badge
                      key={game.name}
                      className="bg-primary/20 text-foreground"
                    >
                      {game.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
              {isOwnProfile ? (
                <>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                    onClick={() => onNavigate("account-settings")}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onNavigate("wallet-escrow")}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Wallet & Escrow
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:flex-1 lg:w-auto"
                    onClick={() => onNavigate("request-match")}
                  >
                    <Swords className="h-4 w-4 mr-2" />
                    Request Match
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 lg:w-auto"
                    onClick={() => {
                      const targetUserId = String(
                        userId || profile.userId || "",
                      );
                      if (
                        !targetUserId ||
                        !user?.id ||
                        targetUserId === user.id
                      )
                        return;
                      const targetUserName = encodeURIComponent(
                        String(profile.username || ""),
                      );
                      onNavigate(
                        "messages",
                        `user:${targetUserId}:${targetUserName}`,
                      );
                    }}
                    disabled={friendRequestState === "blocked" || blockedByUser}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 lg:w-auto"
                    onClick={() => setShowSendFriendRequestDialog(true)}
                    disabled={
                      isUpdatingFriendRequest ||
                      blockedByUser ||
                      friendRequestState === "blocked" ||
                      friendRequestState === "outgoing" ||
                      friendRequestState === "friends"
                    }
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {blockedByUser
                      ? "Blocked You"
                      : friendRequestState === "blocked"
                        ? "Blocked"
                        : friendRequestState === "friends"
                          ? "Friends"
                          : friendRequestState === "outgoing"
                            ? "Request Sent"
                            : friendRequestState === "incoming"
                              ? "Respond in Requests"
                              : "Add Friend"}
                  </Button>
                  {friendRequestState === "outgoing" && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={retractFriendRequest}
                      disabled={isUpdatingFriendRequest}
                    >
                      Retract Request
                    </Button>
                  )}
                  {friendRequestState === "friends" && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setShowRemoveFriendDialog(true)}
                      disabled={isUpdatingFriendRequest}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove Friend
                    </Button>
                  )}
                  {friendRequestState === "blocked" ? (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={unblockUser}
                      disabled={isUpdatingFriendRequest}
                    >
                      Unblock
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setShowBlockUserDialog(true)}
                      disabled={isUpdatingFriendRequest || blockedByUser}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Block User
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setShowReportDialog(true)}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-lift animate-fadeInUp animate-delay-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {profile.mmr}
            </div>
            <div className="text-xs text-muted-foreground">MMR Rating</div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fadeInUp animate-delay-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-400" />
              <span className="text-xs text-emerald-400">
                +{profile.winRate}%
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {profile.wins}W
            </div>
            <div className="text-xs text-muted-foreground">
              {profile.losses}L • {profile.winRate}% WR
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fadeInUp animate-delay-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              ${profile.earnings.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fadeInUp animate-delay-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <Badge className="bg-orange-600 text-white text-xs">Hot</Badge>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {profile.stats.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">Win Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
          >
            <BarChart3 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
          >
            <Gamepad2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Games</span>
          </TabsTrigger>
          <TabsTrigger
            value="matches"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
          >
            <Swords className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Matches</span>
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
          >
            <Award className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Total Matches
                    </span>
                    <span className="font-semibold text-foreground">
                      {profile.stats.totalMatches}
                    </span>
                  </div>
                  <Progress
                    value={(profile.wins / profile.stats.totalMatches) * 100}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Avg Match Earnings
                    </span>
                    <span className="font-semibold text-emerald-400">
                      ${profile.stats.avgMatchEarnings}
                    </span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Longest Win Streak
                    </span>
                    <span className="font-semibold text-foreground">
                      {profile.stats.longestWinStreak}
                    </span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Peak Rank
                    </span>
                    <span className="font-semibold text-amber-400">
                      #{profile.stats.peakRank}
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Favorite Game
                  </span>
                  <Badge className="bg-primary text-primary-foreground">
                    {profile.stats.favoriteGame}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Most Active Hours
                  </span>
                  <span className="text-sm text-foreground">
                    {profile.stats.mostPlayedHour}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          {profile.games.map((game, index) => (
            <Card
              key={game.name}
              className="hover-lift animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {game.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      Level {game.level}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">
                      {game.wins}W
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {game.losses}L
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="text-foreground">
                        {(
                          (game.wins / (game.wins + game.losses)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(game.wins / (game.wins + game.losses)) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Hours Played
                    </span>
                    <span className="text-foreground font-semibold">
                      {game.hours}h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-4">
          {profile.recentMatches.map((match, index) => (
            <Card
              key={index}
              className={`hover-lift animate-fadeInUp ${match.result === "Win" ? "border-emerald-600/30" : "border-red-600/30"}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Badge
                      className={`${match.result === "Win" ? "bg-emerald-600" : "bg-red-600"} text-white`}
                    >
                      {match.result}
                    </Badge>
                    <div>
                      <div className="font-semibold text-foreground">
                        {match.game}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {match.score}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${match.earnings > 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {match.earnings > 0 ? "+" : ""}${match.earnings}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {match.date}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              const rarityColors = {
                legendary: "from-amber-500 to-orange-600",
                epic: "from-purple-500 to-pink-600",
                rare: "from-blue-500 to-cyan-600",
                uncommon: "from-green-500 to-emerald-600",
              };

              return (
                <Card
                  key={achievement.name}
                  className="hover-lift animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${rarityColors[achievement.rarity as keyof typeof rarityColors]} flex items-center justify-center shrink-0 shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-sm">
                            {achievement.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              achievement.rarity === "legendary"
                                ? "border-amber-400 text-amber-400"
                                : achievement.rarity === "epic"
                                  ? "border-purple-400 text-purple-400"
                                  : achievement.rarity === "rare"
                                    ? "border-blue-400 text-blue-400"
                                    : "border-green-400 text-green-400"
                            }`}
                          >
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {!isOwnProfile && (
        <>
          <Dialog
            open={showSendFriendRequestDialog}
            onOpenChange={setShowSendFriendRequestDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Friend Request</DialogTitle>
                <DialogDescription>
                  Send friend request to {profile.username}?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSendFriendRequestDialog(false)}
                  disabled={isUpdatingFriendRequest}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendFriendRequest}
                  disabled={isUpdatingFriendRequest}
                >
                  Send Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showRemoveFriendDialog}
            onOpenChange={setShowRemoveFriendDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Friend</DialogTitle>
                <DialogDescription>
                  Remove {profile.username} from your friends?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowRemoveFriendDialog(false)}
                  disabled={isUpdatingFriendRequest}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={removeFriend}
                  disabled={isUpdatingFriendRequest}
                >
                  Remove Friend
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showBlockUserDialog}
            onOpenChange={setShowBlockUserDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block User</DialogTitle>
                <DialogDescription>
                  Block {profile.username}? You will no longer receive messages
                  or friend requests from them.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowBlockUserDialog(false)}
                  disabled={isUpdatingFriendRequest}
                >
                  Cancel
                </Button>
                <Button onClick={blockUser} disabled={isUpdatingFriendRequest}>
                  Block
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ReportUserDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            username={profile.username}
            avatar={profile.avatar}
            userId={userId}
          />
        </>
      )}
    </div>
  );
}
