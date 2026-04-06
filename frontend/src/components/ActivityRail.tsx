import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Users,
  Trophy,
  DollarSign,
  Crown,
  TrendingUp,
  ArrowRight,
  Target,
  Shield,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import { usePresence } from "../context/PresenceContext";
import { StatusDot } from "./StatusDot";

interface ActivityRailProps {
  onNavigate?: (tab: string) => void;
}

interface HomepageFriend {
  id: string;
  username: string;
  profile?: {
    displayName?: string | null;
  } | null;
}

interface MyStats {
  wins: number;
  losses: number;
  winRate: number;
  totalEarningsCents: number;
  trustScore: number;
}

export function ActivityRail({ onNavigate }: ActivityRailProps = {}) {
  const { token, isAuthenticated, user } = useAuth();
  const { currency, rates } = useCurrency();
  const { watchUsers } = usePresence();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [friends, setFriends] = useState<HomepageFriend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [myStats, setMyStats] = useState<MyStats | null>(null);

  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (!isAuthenticated || !authToken) {
      setFriends([]);
      return;
    }

    let active = true;
    setLoadingFriends(true);

    fetch(`${API_URL}/users/me/friends`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load friends");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const nextFriends = Array.isArray(data?.friends) ? data.friends : [];
        setFriends(nextFriends);
        watchUsers(nextFriends.map((f: HomepageFriend) => f.id));
      })
      .catch(() => {
        if (!active) return;
        setFriends([]);
      })
      .finally(() => {
        if (!active) return;
        setLoadingFriends(false);
      });

    return () => {
      active = false;
    };
  }, [API_URL, isAuthenticated, token]);

  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (!isAuthenticated || !authToken || !user?.id) return;

    let active = true;

    Promise.all([
      fetch(`${API_URL}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }).then((r) => r.json()),
    ])
      .then(([publicData, meData]) => {
        if (!active) return;
        const s = publicData?.stats;
        if (s) {
          const trustScore =
            meData?.user?.profile?.trustScore ??
            publicData?.user?.profile?.trustScore ??
            100;
          setMyStats({
            wins: s.wins ?? 0,
            losses: s.losses ?? 0,
            winRate: s.winRate ?? 0,
            totalEarningsCents: s.totalEarningsCents ?? 0,
            trustScore,
          });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [API_URL, isAuthenticated, token, user?.id]);

  return (
    <div className="w-80 space-y-4">
      {/* Friends Online */}
      <Card className="animate-fadeInUp hover-lift transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Friends Online</span>
            <Badge className="bg-emerald-600 text-white text-xs">
              {friends.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingFriends && (
            <div className="text-sm text-muted-foreground">
              Loading friends...
            </div>
          )}

          {!loadingFriends && friends.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No friends to show yet.
            </div>
          )}

          {!loadingFriends &&
            friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <StatusDot userId={friend.id} />
                  <div>
                    <div className="text-sm text-foreground">
                      {friend.profile?.displayName || friend.username}
                    </div>
                    <div className="text-xs text-muted-foreground">Friend</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:bg-primary/10 hover:scale-110 transition-all duration-300"
                >
                  Invite
                </Button>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="animate-fadeInUp animate-delay-300 hover-lift transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Your Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <Trophy className="h-4 w-4 text-emerald-400" />
                <div className="text-lg font-semibold text-emerald-400">
                  {myStats?.wins ?? "—"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <Target className="h-4 w-4 text-rose-400" />
                <div className="text-lg font-semibold text-rose-400">
                  {myStats?.losses ?? "—"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Losses</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <DollarSign className="h-4 w-4 text-amber-400" />
                <div className="text-lg font-semibold text-amber-400">
                  {myStats
                    ? formatCurrencyFromEur(
                        myStats.totalEarningsCents / 100,
                        currency,
                        rates,
                      )
                    : "—"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div className="text-lg font-semibold text-primary">
                  {myStats != null ? `${myStats.winRate}%` : "—"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Trust Score</span>
            </div>
            <div className="text-sm font-semibold text-blue-400">
              {myStats != null ? `${myStats.trustScore}%` : "—"}
            </div>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-1 group"
            size="sm"
            onClick={() => onNavigate?.("my-profile")}
          >
            <span>View Full Stats</span>
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
