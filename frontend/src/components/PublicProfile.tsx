import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
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
  Trophy,
  TrendingUp,
  MapPin,
  Calendar,
  Gamepad2,
  Target,
  DollarSign,
  MessageSquare,
  UserPlus,
  UserMinus,
  Ban,
  Flag,
  Flame,
  Swords,
  BarChart3,
  Edit,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { UserAvatar } from "./UserAvatar";
import { getTrustRank } from "../utils/trustRank";
import { searchGames, type RawgGameSummary } from "../services/rawgService";

interface PublicProfileProps {
  onNavigate: (tab: string, query?: string) => void;
  userId?: string;
  isOwnProfile?: boolean;
}

// We'll fetch real profile data from the backend. Local fallback used only
// briefly while loading.
import api from "../lib/api";
import { usePresence } from "../context/PresenceContext";
import { useStatusColor } from "./StatusDot";

const emptyFallback = {
  username: "Player",
  avatar: "PL",
  bio: "",
  rank: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  earnings: 0,
  trustScore: 0,
  level: 1,
  tier: "",
  country: "",
  region: "",
  joinDate: "",
  isVerified: false,
  isOnline: false,
  games: [],
  recentMatches: [],
  stats: {
    totalMatches: 0,
    totalEarningsCents: 0,
    avgMatchEarningsCents: 0,
    longestWinStreak: 0,
    currentStreak: 0,
    winRate: 0,
  },
};

export function PublicProfile({
  onNavigate,
  userId,
  isOwnProfile = false,
}: PublicProfileProps) {
  const { user, token } = useAuth();
  const { watchUsers, getStatus } = usePresence();
  const { currency, rates } = useCurrency();
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
  const [countriesByCode, setCountriesByCode] = useState<
    Record<string, { name: string; flag: string }>
  >({});
  const [ipGeo, setIpGeo] = useState<{
    country: string | null;
    continent: string | null;
  } | null>(null);
  const hasSyncedIpGeoRef = React.useRef(false);

  // RAWG game search state (own profile only)
  const [gameQuery, setGameQuery] = useState("");
  const [gameSearchResults, setGameSearchResults] = useState<RawgGameSummary[]>(
    [],
  );
  const [gameSearching, setGameSearching] = useState(false);
  const [gameCovers, setGameCovers] = useState<Record<string, string | null>>(
    {},
  );
  const [savingGame, setSavingGame] = useState(false);
  const gameSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileStatusId = isOwnProfile ? (user?.id ?? "") : (userId ?? "");
  const profileStatusColor = useStatusColor(profileStatusId);

  useEffect(() => {
    if (profileStatusId) watchUsers([profileStatusId]);
  }, [profileStatusId, watchUsers]);

  const buildProfileFromUser = (
    u: any,
    statsData?: any,
    matchHistory?: any[],
  ) => {
    const s = statsData || emptyFallback.stats;
    return {
      userId: u.id,
      username: u.username,
      avatar: (u.username || "").slice(0, 2).toUpperCase(),
      profileImageUrl: u.profileImageUrl || u.avatarUrl || null,
      bio: u.profile?.bio || "",
      country: u.profile?.country || "",
      region: u.profile?.region || "",
      joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
      isVerified: false,
      isOnline: false,
      tier: "",
      trustScore: u.profile?.trustScore ?? 0,
      wins: s.wins ?? 0,
      losses: s.losses ?? 0,
      winRate: s.winRate ?? 0,
      stats: {
        totalMatches: s.totalMatches ?? 0,
        totalEarningsCents: s.totalEarningsCents ?? 0,
        avgMatchEarningsCents: s.avgMatchEarningsCents ?? 0,
        longestWinStreak: s.longestWinStreak ?? 0,
        currentStreak: s.currentStreak ?? 0,
        winRate: s.winRate ?? 0,
      },
      recentMatches: matchHistory || [],
      games: (u.playerGames || []).map((g: any) => ({
        id: g.id,
        name: g.game,
        wins: g.wins || 0,
        losses: g.losses || 0,
      })),
    };
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingProfile(true);
      try {
        if (isOwnProfile && user) {
          // Fetch stats for own profile from the public endpoint
          const data = await api.getPublicProfile(user.id);
          const u = data.user || user;
          const mapped = buildProfileFromUser(
            u,
            data.stats,
            data.recentMatches,
          );
          if (mounted) setProfileState(mapped);
        } else if (userId) {
          const data = await api.getPublicProfile(userId);
          const u = data.user;
          if (!u) throw new Error("User not found");
          const mapped = buildProfileFromUser(
            u,
            data.stats,
            data.recentMatches,
          );
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

    (async () => {
      try {
        const data = await api.getCountriesAndRegions();
        if (!mounted) return;
        const map = (
          Array.isArray(data.countries) ? data.countries : []
        ).reduce(
          (
            acc: Record<string, { name: string; flag: string }>,
            country: { code?: string; name?: string; flag?: string },
          ) => {
            const code = (country.code || "").toUpperCase();
            if (!code) return acc;
            acc[code] = {
              name: country.name || code,
              flag: country.flag || "",
            };
            return acc;
          },
          {},
        );
        setCountriesByCode(map);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isOwnProfile) return;

    let mounted = true;

    (async () => {
      try {
        const data = await api.detectRegion();
        if (!mounted) return;
        setIpGeo({
          country: data.country || null,
          continent: data.continent || null,
        });
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile || !ipGeo || hasSyncedIpGeoRef.current) return;

    const nextCountry = ipGeo.country || null;

    const currentCountry = profileState?.country || null;

    if (currentCountry === nextCountry) {
      hasSyncedIpGeoRef.current = true;
      return;
    }

    (async () => {
      try {
        await api.updateMyProfile({
          country: nextCountry,
          continent: ipGeo.continent || null,
        });
        setProfileState((prev: any) =>
          prev
            ? {
                ...prev,
                country: nextCountry || "",
              }
            : prev,
        );
      } catch (err) {
        console.error(err);
      } finally {
        hasSyncedIpGeoRef.current = true;
      }
    })();
  }, [ipGeo, isOwnProfile, profileState?.country]);

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

  // Fetch RAWG cover images for games on the profile
  useEffect(() => {
    const games: any[] = profileState?.games || [];
    if (!games.length) return;
    games.forEach(async (g: any) => {
      if (gameCovers[g.name] !== undefined) return;
      try {
        const res = await searchGames(g.name);
        const cover = res.results[0]?.background_image ?? null;
        setGameCovers((prev) => ({ ...prev, [g.name]: cover }));
      } catch {
        setGameCovers((prev) => ({ ...prev, [g.name]: null }));
      }
    });
  }, [profileState?.games]);

  const handleGameSearch = (q: string) => {
    setGameQuery(q);
    if (gameSearchTimer.current) clearTimeout(gameSearchTimer.current);
    if (!q.trim()) {
      setGameSearchResults([]);
      return;
    }
    gameSearchTimer.current = setTimeout(async () => {
      setGameSearching(true);
      try {
        const res = await searchGames(q);
        setGameSearchResults(res.results.slice(0, 8));
      } catch {
        setGameSearchResults([]);
      } finally {
        setGameSearching(false);
      }
    }, 400);
  };

  const handleAddGame = async (rawgGame: RawgGameSummary) => {
    if (!profileState) return;
    if ((profileState.games || []).length >= 3) return;
    setSavingGame(true);
    try {
      const res = await api.addOrUpdateGame({ game: rawgGame.name });
      const newGame = {
        id: res.game?.id,
        name: rawgGame.name,
        wins: 0,
        losses: 0,
      };
      setGameCovers((prev) => ({
        ...prev,
        [rawgGame.name]: rawgGame.background_image ?? null,
      }));
      setProfileState((prev: any) =>
        prev ? { ...prev, games: [...(prev.games || []), newGame] } : prev,
      );
      setGameQuery("");
      setGameSearchResults([]);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingGame(false);
    }
  };

  const handleRemoveGame = async (gameId: string, gameName: string) => {
    setSavingGame(true);
    try {
      await api.deleteMyGame(gameId);
      setProfileState((prev: any) =>
        prev
          ? {
              ...prev,
              games: (prev.games || []).filter((g: any) => g.id !== gameId),
            }
          : prev,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSavingGame(false);
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
  const effectiveCountryCode = String(
    (isOwnProfile ? ipGeo?.country : null) || profile.country || "",
  ).toUpperCase();
  const countryMeta = countriesByCode[effectiveCountryCode];
  const countryLabel =
    countryMeta?.name || profile.country || effectiveCountryCode || "Global";

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
                {profileStatusId &&
                  getStatus(profileStatusId) !== "offline" && (
                    <div
                      className={`absolute bottom-0 right-0 w-6 h-6 ${profileStatusColor} border-4 border-card rounded-full`}
                    />
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
                  {(() => {
                    const rank = getTrustRank(profile.trustScore ?? 87);
                    return (
                      <Badge
                        title="Based on match accuracy and dispute history"
                        className={`flex items-center gap-1 border ${rank.bgColor} ${rank.borderColor} ${rank.textColor}`}
                      >
                        <Shield className="h-3 w-3" />
                        {rank.label}
                      </Badge>
                    );
                  })()}
                  <Badge variant="outline" className="flex items-center">
                    {countryMeta?.flag && (
                      <img
                        src={countryMeta.flag}
                        alt={`${countryLabel} flag`}
                        className="h-3 w-5 rounded-sm object-cover mr-1"
                      />
                    )}
                    <MapPin className="h-3 w-3 mr-1" />
                    {countryLabel || "Global"}
                  </Badge>
                  <Badge variant="outline" className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined {profile.joinDate}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.games.map((game: any) => (
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
                    onClick={() => {
                      const targetUserId = String(
                        userId || profile.userId || "",
                      );
                      onNavigate(
                        targetUserId
                          ? `request-match:${targetUserId}`
                          : "request-match",
                      );
                    }}
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
        {/* Win / Loss — styled like MyEvents */}
        <Card className="hover-lift animate-fadeInUp animate-delay-100 border-emerald-500/30 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="h-6 w-6 text-emerald-400" />
              <div className="text-right">
                <div className="text-2xl font-bold">
                  <span className="text-emerald-400">{profile.wins}</span>
                  <span className="mx-0.5 text-zinc-500">/</span>
                  <span className="text-rose-400">{profile.losses}</span>
                </div>
                <div className="text-xs text-muted-foreground">Win / Loss</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="hover-lift animate-fadeInUp animate-delay-200 border-primary/30 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {profile.winRate}%
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="hover-lift animate-fadeInUp animate-delay-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrencyFromEur(
                (profile.stats.totalEarningsCents ?? 0) / 100,
                currency,
                rates,
              )}
            </div>
            <div className="text-xs text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>

        {/* Win Streak */}
        <Card className="hover-lift animate-fadeInUp animate-delay-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-5 w-5 text-orange-400" />
              {profile.stats.currentStreak > 0 && (
                <Badge className="bg-orange-600 text-white text-xs">Hot</Badge>
              )}
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
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-auto">
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
                    value={
                      profile.stats.totalMatches > 0
                        ? Math.min(
                            (profile.wins / profile.stats.totalMatches) * 100,
                            100,
                          )
                        : 0
                    }
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Avg Match Earnings
                    </span>
                    <span className="font-semibold text-emerald-400">
                      {formatCurrencyFromEur(
                        (profile.stats.avgMatchEarningsCents ?? 0) / 100,
                        currency,
                        rates,
                      )}
                    </span>
                  </div>
                  <Progress
                    value={profile.stats.avgMatchEarningsCents > 0 ? 100 : 0}
                    className="h-2"
                  />
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
                  <Progress
                    value={
                      profile.stats.longestWinStreak > 0
                        ? Math.min(profile.stats.longestWinStreak * 10, 100)
                        : 0
                    }
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Total Earnings
                    </span>
                    <span className="font-semibold text-amber-400">
                      {formatCurrencyFromEur(
                        (profile.stats.totalEarningsCents ?? 0) / 100,
                        currency,
                        rates,
                      )}
                    </span>
                  </div>
                  <Progress
                    value={profile.stats.totalEarningsCents > 0 ? 100 : 0}
                    className="h-2"
                  />
                </div>
              </div>

              {/* Win / Loss visual bar */}
              {profile.stats.totalMatches > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Win / Loss Ratio
                    </span>
                    <span className="text-sm">
                      <span className="text-emerald-400 font-semibold">
                        {profile.wins}W
                      </span>
                      <span className="text-zinc-500 mx-1">/</span>
                      <span className="text-rose-400 font-semibold">
                        {profile.losses}L
                      </span>
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    {profile.wins > 0 && (
                      <div
                        className="bg-emerald-500"
                        style={{
                          width: `${(profile.wins / (profile.wins + profile.losses)) * 100}%`,
                        }}
                      />
                    )}
                    {profile.losses > 0 && (
                      <div
                        className="bg-rose-500"
                        style={{
                          width: `${(profile.losses / (profile.wins + profile.losses)) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          {isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Add Games to Your Profile
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Select up to 3 games to showcase on your profile.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {(profile.games || []).length < 3 && (
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        className="pl-9"
                        placeholder="Search games (e.g. Fortnite, Valorant…)"
                        value={gameQuery}
                        onChange={(e) => handleGameSearch(e.target.value)}
                        disabled={savingGame}
                      />
                    </div>
                    {(gameSearchResults.length > 0 || gameSearching) && (
                      <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {gameSearching && (
                          <div className="p-3 text-sm text-muted-foreground">
                            Searching…
                          </div>
                        )}
                        {gameSearchResults.map((g) => (
                          <button
                            key={g.id}
                            className="flex items-center gap-3 w-full p-2 hover:bg-muted text-left transition-colors"
                            onClick={() => handleAddGame(g)}
                            disabled={savingGame}
                          >
                            {g.background_image ? (
                              <img
                                src={g.background_image}
                                alt={g.name}
                                className="w-10 h-7 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-7 bg-muted rounded flex items-center justify-center">
                                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-foreground">
                              {g.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {(profile.games || []).length >= 3 && (
                  <p className="text-xs text-muted-foreground">
                    You've reached the 3-game limit. Remove a game to add
                    another.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {(profile.games || []).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Gamepad2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {isOwnProfile
                    ? "Search and add your favourite games above."
                    : "No games listed yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(profile.games || []).map((game: any, index: number) => {
                const cover = gameCovers[game.name];
                return (
                  <Card
                    key={game.id ?? game.name}
                    className="hover-lift animate-fadeInUp overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative h-32 bg-muted">
                      {cover ? (
                        <img
                          src={cover}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="h-10 w-10 text-muted-foreground opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      {isOwnProfile && (
                        <button
                          className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                          onClick={() => handleRemoveGame(game.id, game.name)}
                          disabled={savingGame}
                          title="Remove game"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <h4 className="font-semibold text-sm truncate text-foreground text-center">
                        {game.name}
                      </h4>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-3">
          {(profile.recentMatches || []).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Swords className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No completed matches yet.</p>
              </CardContent>
            </Card>
          ) : (
            (profile.recentMatches || []).map((match: any, index: number) => (
              <Card
                key={match.id ?? index}
                className={`hover-lift animate-fadeInUp ${
                  match.result === "Win"
                    ? "border-emerald-600/30"
                    : match.result === "Loss"
                      ? "border-rose-600/30"
                      : "border-border"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Badge
                        className={`shrink-0 ${
                          match.result === "Win"
                            ? "bg-emerald-600"
                            : match.result === "Loss"
                              ? "bg-rose-600"
                              : "bg-muted text-muted-foreground"
                        } text-white`}
                      >
                        {match.result}
                      </Badge>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {match.game}
                        </div>
                        {match.opponentUsername && (
                          <div className="text-xs text-muted-foreground">
                            vs {match.opponentUsername}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      {match.stake > 0 ? (
                        <div
                          className={`text-sm font-bold ${match.result === "Win" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {match.result === "Win" ? "+" : "−"}
                          {formatCurrencyFromEur(
                            match.stake / 100,
                            currency,
                            rates,
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Scrim
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {match.date
                          ? new Date(match.date).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
