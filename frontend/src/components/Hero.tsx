import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Shield, Trophy, Users, Swords } from "lucide-react";
import { Badge } from "./ui/badge";
import { SearchBar } from "./SearchBar";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface PlatformStats {
  totalAccounts: number;
  completedMatches: number;
  activeMatches: number;
  totalPaidOutCents: number;
  inPlayCents: number;
  onlinePlayers: number;
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M+`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K+`;
  return n.toString();
}

interface HeroProps {
  onNavigate?: (tab: string) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = () => {
      fetch(`${API_URL}/stats`)
        .then((r) => r.json())
        .then((data) => {
          if (mounted) setStats(data);
        })
        .catch(() => {});
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  return (
    <div className="relative bg-gradient-to-br from-card via-card/80 to-background rounded-xl p-4 sm:p-6 md:p-8 mb-6 md:mb-8 overflow-hidden animate-fadeInUp">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10">
        <div className="max-w-4xl">
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs sm:text-sm">
              <Shield className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Secure Escrow</span>
              <span className="sm:hidden">Escrow</span>
            </Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
              <Trophy className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Fair Play Verified</span>
              <span className="sm:hidden">Fair Play</span>
            </Badge>
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs sm:text-sm">
              <Users className="h-3 w-3 mr-1" />
              {stats ? (
                <>
                  <span className="hidden sm:inline">
                    {formatCount(stats.totalAccounts)} Registered Players
                  </span>
                  <span className="sm:hidden">
                    {formatCount(stats.totalAccounts)} Players
                  </span>
                </>
              ) : (
                <span>Loading...</span>
              )}
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent leading-tight py-2">
            Play. Wager. Win.
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl leading-relaxed">
            Join the premier esports platform where skill meets stakes. Compete
            in fair matches with{" "}
            <span className="text-emerald-400 font-medium">
              secure escrow protection
            </span>{" "}
            and transparent dispute resolution.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:flex md:items-center md:space-x-8 mb-6 sm:mb-8 text-xs sm:text-sm">
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-400">
                {stats ? formatMoney(stats.totalPaidOutCents) : "—"}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Paid Out
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">
                {stats ? formatCount(stats.completedMatches) : "—"}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Matches
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-amber-400">
                {stats ? formatCount(stats.totalAccounts) : "—"}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">
                Accounts
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <SearchBar
              placeholder="Search matches, players, tournaments..."
              onSearch={(query) => console.log("Searching for:", query)}
              className="max-w-md w-full"
            />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 text-base sm:text-lg font-medium shadow-lg shadow-primary/25 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-fadeInLeft"
              onClick={() => onNavigate?.("create-match")}
            >
              Create Match
            </Button>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 text-base sm:text-lg font-medium shadow-lg shadow-primary/25 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-fadeInLeft animate-delay-100"
              onClick={() => onNavigate?.("request-match")}
            >
              <Swords className="h-5 w-5 mr-2" />
              Request Match
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary hover:scale-105 px-6 sm:px-8 py-3 text-base sm:text-lg font-medium w-full sm:w-auto transition-all duration-300 animate-fadeInRight"
              onClick={() => onNavigate?.("lobbies")}
            >
              Browse Lobbies
            </Button>
          </div>

          {/* Live Activity Indicator */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">
                {stats
                  ? `${stats.onlinePlayers.toLocaleString()} players online`
                  : "— players online"}
              </span>
              <span className="sm:hidden">
                {stats ? `${stats.onlinePlayers.toLocaleString()} online` : "—"}
              </span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              {stats
                ? `${stats.activeMatches.toLocaleString()} active matches`
                : "—"}
            </span>
            <span className="sm:hidden">
              {stats ? `${stats.activeMatches} matches` : "—"}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              {stats ? `${formatMoney(stats.inPlayCents)} in play` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
