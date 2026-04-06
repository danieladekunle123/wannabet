import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeContext";
import { Navigation } from "./components/Navigation";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Tournaments } from "./components/Tournaments";
import { Scrims } from "./components/Scrims";
import { Lobbies } from "./components/Lobbies";
import { TeamsPage } from "./components/TeamsPage";
import { Wagers } from "./components/Wagers";
import { Messages } from "./components/Messages";
import { Settings } from "./components/Settings";
import { Leaderboards } from "./components/Leaderboards";
import { PlayerStats } from "./components/PlayerStats";
import { CreateMatch } from "./components/CreateMatch";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { AccountSettings } from "./components/AccountSettings";
import { WalletEscrow } from "./components/WalletEscrow";
import { SubscriptionsCredits } from "./components/SubscriptionsCredits";
import { JoinMatch } from "./components/JoinMatch";
import { JoinHub } from "./components/JoinHub";
import { CreateTeamHub } from "./components/CreateTeamHub";
import { ViewMatch } from "./components/ViewMatch";
import { TournamentBracket } from "./components/TournamentBracket";
import { TournamentSchedule } from "./components/TournamentSchedule";
import { SearchResults } from "./components/SearchResults";
import { PublicProfile } from "./components/PublicProfile";
import { DepositFunds } from "./components/DepositFunds";
import { WithdrawFunds } from "./components/WithdrawFunds";
import { RequestMatch } from "./components/RequestMatch";
import { JoinTournament } from "./components/JoinTournament";
import { TeamPage } from "./components/TeamPage";
import { TeamSettings } from "./components/TeamSettings";
import { TeamInvites } from "./components/TeamInvites";
import { HubPage } from "./components/HubPage";
import { TeamDetailPage } from "./components/TeamDetailPage";

import { NotificationSettings } from "./components/NotificationSettings";
import { PrivacySecurity } from "./components/PrivacySecurity";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { Language } from "./components/Language";
import { HelpCenter } from "./components/HelpCenter";
import { ReportBug } from "./components/ReportBug";
import { ContactSupport } from "./components/ContactSupport";
import { DeactivateAccount } from "./components/DeactivateAccount";
import { DeleteAccount } from "./components/DeleteAccount";
import { TermsOfService } from "./components/TermsOfService";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { Onboarding } from "./components/Onboarding";
import { Badge } from "./components/ui/badge";
import { Card, CardContent } from "./components/ui/card";
import { Star, Flame } from "lucide-react";
import { AuthProvider } from "./components/AuthContext";
import { useAuth } from "./components/AuthContext";
import { Admin } from "./components/Admin";
import { Moderator } from "./components/Moderator";
import { FriendsList } from "./components/FriendsList";
import { TrendingEsportsMatches } from "./components/TrendingEsportsMatches";
import { ActivityRail } from "./components/ActivityRail";
import { MyEvents } from "./components/MyEvents";
import { io, Socket } from "socket.io-client";
import { CurrencyProvider } from "./context/CurrencyContext";
import { PresenceProvider } from "./context/PresenceContext";
import api from "./lib/api";

const API_URL = "http://localhost:4000";

// --- Navigation helpers: convert tab name <-> URL path ---
function tabToPath(tab: string, query?: string): string {
  if (tab === "home") return "/";
  if (tab === "my-profile") return "/profile";
  if (tab === "my-events" || tab === "view-match") return "/my-events";
  if (tab === "wallet-escrow") return "/wallet";
  if (tab === "deposit-funds") return "/wallet/deposit";
  if (tab === "withdraw-funds") return "/wallet/withdraw";
  if (tab === "account-settings") return "/settings/account";
  if (tab === "notifications-preferences") return "/settings/notifications";
  if (tab === "privacy-security") return "/settings/privacy";
  if (tab === "keyboard-shortcuts") return "/settings/shortcuts";
  if (tab === "subscriptions-credits") return "/subscriptions";
  if (tab === "help-center") return "/help";
  if (tab === "team-page") return "/my-team";
  if (tab === "search-results")
    return query ? `/search?q=${encodeURIComponent(query)}` : "/search";
  if (tab === "deactivate-account") return "/settings/deactivate";
  if (tab === "delete-account") return "/settings/delete";

  if (tab.startsWith("view-match-"))
    return `/view-match/${tab.replace("view-match-", "")}`;
  if (tab.startsWith("profile-"))
    return `/profile/${tab.replace("profile-", "")}`;
  if (tab.startsWith("team-detail-"))
    return `/team-detail/${tab.replace("team-detail-", "")}`;
  if (tab.startsWith("hub-")) return `/hub/${tab.replace("hub-", "")}`;
  if (tab.startsWith("request-match:"))
    return `/request-match/${tab.slice("request-match:".length)}`;
  if (
    tab.startsWith("team-") &&
    !["team-page", "team-settings", "team-invites"].includes(tab)
  ) {
    return `/team/${tab.replace("team-", "")}`;
  }

  return `/${tab}`;
}

function pathToTab(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname === "/profile") return "my-profile";
  if (pathname === "/wallet") return "wallet-escrow";
  if (pathname === "/wallet/deposit") return "deposit-funds";
  if (pathname === "/wallet/withdraw") return "withdraw-funds";
  if (pathname === "/settings/account") return "account-settings";
  if (pathname === "/settings/notifications")
    return "notifications-preferences";
  if (pathname === "/settings/privacy") return "privacy-security";
  if (pathname === "/settings/shortcuts") return "keyboard-shortcuts";
  if (pathname === "/settings/deactivate") return "deactivate-account";
  if (pathname === "/settings/delete") return "delete-account";
  if (pathname === "/subscriptions") return "subscriptions-credits";
  if (pathname === "/help") return "help-center";
  if (pathname === "/my-team") return "team-page";
  if (pathname === "/search") return "search-results";

  const m1 = pathname.match(/^\/view-match\/(.+)$/);
  if (m1) return `view-match-${m1[1]}`;
  const m2 = pathname.match(/^\/profile\/(.+)$/);
  if (m2) return `profile-${m2[1]}`;
  const m3 = pathname.match(/^\/team-detail\/(.+)$/);
  if (m3) return `team-detail-${m3[1]}`;
  const m4 = pathname.match(/^\/team\/(.+)$/);
  if (m4) return `team-${m4[1]}`;
  const m5 = pathname.match(/^\/hub\/(.+)$/);
  if (m5) return `hub-${m5[1]}`;
  const m6 = pathname.match(/^\/request-match\/(.+)$/);
  if (m6) return `request-match:${m6[1]}`;

  return pathname.slice(1) || "home";
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = pathToTab(location.pathname);

  const AUTH_TRANSITION_MS = 340;
  const [authView, setAuthView] = useState<"login" | "signup">("signup");
  const [renderedAuthView, setRenderedAuthView] = useState<"login" | "signup">(
    "signup",
  );
  const [authTransitionClass, setAuthTransitionClass] =
    useState("auth-view-enter");
  const [hideSidebar, setHideSidebar] = useState(false);
  const [messagesKey, setMessagesKey] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [initialConversationId, setInitialConversationId] = useState<
    string | undefined
  >(undefined);
  const [featuredMatch, setFeaturedMatch] = useState<{
    id: string;
    game: string;
    stake: number;
    status: string;
    createdAt: string;
    host: { username: string };
  } | null>(null);
  const [topEarners, setTopEarners] = useState<
    {
      rank: number;
      userId: string;
      username: string;
      earningsCents: number;
      trustScore: number;
    }[]
  >([]);
  const authTransitionTimerRef = React.useRef<number | null>(null);

  const {
    user,
    token,
    isAuthenticated,
    logout,
    completeOnboarding,
    refreshUser,
  } = useAuth();

  // Fetch top 5 earners for the home leaderboard preview
  useEffect(() => {
    let mounted = true;
    api
      .getLeaderboardEarnings()
      .then((data: any) => {
        if (mounted) setTopEarners((data.entries || []).slice(0, 5));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch most popular open match for the featured banner
  useEffect(() => {
    let mounted = true;
    fetch(`${API_URL}/matches/featured`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setFeaturedMatch(data.match ?? null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Scroll reset
  React.useEffect(() => {
    window.scrollTo(0, 0);

    const mainContent = document.querySelector("main");
    if (mainContent) mainContent.scrollTo(0, 0);

    if (location.pathname === "/messages") {
      setMessagesKey((prev) => prev + 1);
    }
  }, [location.pathname]);

  // Sidebar hide on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      setHideSidebar(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      await completeOnboarding();
    } catch (err) {
      console.error(err);
      // If the PATCH failed but the user still exists, try to refresh so we get
      // the real hasCompletedOnboarding value. If it's still false, mark the
      // user as onboarded locally so they are never permanently stuck.
      try {
        await refreshUser();
      } catch {
        // refreshUser threw — user was logged out by AuthContext, nothing more to do.
        return;
      }
    }
    navigate("/");
  };

  const handleOnboardingSkip = handleOnboardingComplete;

  const handleSignOut = () => {
    logout();
    setAuthView("signup");
    setRenderedAuthView("signup");
    navigate("/");
  };
  const switchAuthView = (nextView: "login" | "signup") => {
    if (nextView === renderedAuthView) return;

    setAuthTransitionClass("auth-view-leave");
    if (authTransitionTimerRef.current) {
      window.clearTimeout(authTransitionTimerRef.current);
    }

    authTransitionTimerRef.current = window.setTimeout(() => {
      setAuthView(nextView);
      setRenderedAuthView(nextView);
      setAuthTransitionClass("auth-view-enter");
      authTransitionTimerRef.current = null;
    }, AUTH_TRANSITION_MS);
  };

  React.useEffect(() => {
    return () => {
      if (authTransitionTimerRef.current) {
        window.clearTimeout(authTransitionTimerRef.current);
      }
    };
  }, []);

  const refreshMessageUnreadCount = React.useCallback(async () => {
    if (!token) {
      setMessageUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const conversations = Array.isArray(data?.data) ? data.data : [];
      const totalUnread = conversations.reduce(
        (sum: number, c: any) => sum + (Number(c?.unread) || 0),
        0,
      );
      setMessageUnreadCount(totalUnread);
    } catch {
      // Keep the last badge value when background refresh fails.
    }
  }, [token]);

  React.useEffect(() => {
    if (!isAuthenticated || !token) {
      setMessageUnreadCount(0);
      return;
    }

    void refreshMessageUnreadCount();

    const intervalId = window.setInterval(() => {
      void refreshMessageUnreadCount();
    }, 15000);

    const onFocus = () => {
      void refreshMessageUnreadCount();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, token, refreshMessageUnreadCount]);

  React.useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket: Socket = io(API_URL, {
      auth: { token },
      withCredentials: true,
    });

    const syncUnread = () => {
      void refreshMessageUnreadCount();
    };

    socket.on("message", syncUnread);
    socket.on("message:read", syncUnread);
    socket.on("message:update", syncUnread);
    socket.on("message:delete", syncUnread);

    return () => {
      socket.off("message", syncUnread);
      socket.off("message:read", syncUnread);
      socket.off("message:update", syncUnread);
      socket.off("message:delete", syncUnread);
      socket.disconnect();
    };
  }, [isAuthenticated, token, refreshMessageUnreadCount]);

  const handleUnreadCountChange = React.useCallback((count: number) => {
    setMessageUnreadCount(count);
  }, []);

  const handleNavigate = (tab: string, query?: string) => {
    if (query) {
      if (tab === "messages") setInitialConversationId(query);
      if (tab === "search-results") setSearchQuery(query);
    }
    navigate(tabToPath(tab, tab === "search-results" ? query : undefined));
  };

  if (!isAuthenticated) {
    if (currentTab === "terms-of-service") {
      return <TermsOfService onNavigate={() => navigate("/")} />;
    }
    if (currentTab === "privacy-policy") {
      return <PrivacyPolicy onNavigate={() => navigate("/")} />;
    }
    return (
      <div className={authTransitionClass}>
        {renderedAuthView === "login" ? (
          <Login
            onNavigate={(tab) => handleNavigate(tab)}
            onSwitchToSignup={() => switchAuthView("signup")}
          />
        ) : (
          <Signup
            onNavigate={(tab) => {
              if (tab === "onboarding") {
                navigate("/");
                return;
              }
              handleNavigate(tab);
            }}
            onSwitchToLogin={() => switchAuthView("login")}
          />
        )}
      </div>
    );
  }

  // Show onboarding only for users who have not completed it yet.
  if (isAuthenticated && user && !user.hasCompletedOnboarding) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  // Show login/signup if not authenticated
  if (!user) {
    return authView === "login" ? (
      <Login
        onNavigate={() => navigate("/")}
        onSwitchToSignup={() => setAuthView("signup")}
      />
    ) : (
      <Signup
        onNavigate={() => navigate("/")}
        onSwitchToLogin={() => setAuthView("login")}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-background text-foreground flex flex-col ${
        currentTab === "messages" ? "overflow-hidden h-screen" : ""
      }`}
    >
      {/* Animated Background Gradients & Graphics */}
      <div className="gradient-blobs">
        <div className="gradient-blob gradient-blob-1" />
        <div className="gradient-blob gradient-blob-2" />
        <div className="gradient-blob gradient-blob-3" />
        <div className="gradient-blob gradient-blob-4" />
        <div className="gradient-blob gradient-blob-5" />
      </div>

      <div className="geometric-shapes">
        <div className="geometric-shape geometric-shape-1" />
        <div className="geometric-shape geometric-shape-2" />
        <div className="geometric-shape geometric-shape-3" />
        <div className="geometric-shape geometric-shape-4" />
      </div>

      <div className="grid-overlay" />

      {/* Content Layer */}
      <div className="content-layer flex-1 flex flex-col min-h-0">
        {/* Hide navigation on mobile when viewing messages */}
        <div className={currentTab === "messages" ? "hidden lg:block" : ""}>
          <Navigation onNavigate={handleNavigate} onSignOut={handleSignOut} />
        </div>

        <div
          className={`flex relative flex-1 min-h-0 ${currentTab === "messages" ? "h-full overflow-hidden" : ""}`}
        >
          {/* Left Sidebar - Hidden on mobile and when scrolled */}
          <div
            className={`hidden lg:flex overflow-hidden shrink-0 ${
              hideSidebar
                ? "sidebar-fade-out lg:pointer-events-none"
                : "sidebar-fade-in"
            }`}
            style={{
              width: hideSidebar ? "0px" : "256px",
            }}
          >
            <div className="w-64 shrink-0">
              <Sidebar
                activeTab={currentTab}
                onTabChange={(tab) => handleNavigate(tab)}
                onSignOut={handleSignOut}
                messageCount={messageUnreadCount}
              />
            </div>
          </div>

          {/* Main Content */}
          <main
            className={`flex-1 min-w-0 content-expand flex flex-col ${
              currentTab === "messages"
                ? "p-0"
                : "p-3 sm:p-4 md:p-6 pb-20 lg:pb-6"
            }`}
          >
            <div
              className={
                currentTab === "messages"
                  ? "flex-1"
                  : "mx-auto max-w-7xl flex-1 w-full"
              }
            >
              {/* Render different pages based on currentTab */}
              {currentTab === "home" && (
                <div className="page-transition">
                  {/* Hero Section */}
                  <Hero onNavigate={handleNavigate} />

                  {/* Featured Match Banner */}
                  {featuredMatch && (
                    <Card
                      className="mb-6 md:mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent animate-fadeInUp animate-delay-100 hover-lift transition-all duration-300 cursor-pointer"
                      onClick={() =>
                        handleNavigate(`view-match-${featuredMatch.id}`)
                      }
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <Badge className="bg-primary text-primary-foreground shrink-0 animate-pulse">
                              <Flame className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">
                                Featured Match
                              </span>
                              <span className="sm:hidden">Hot</span>
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-foreground text-sm sm:text-base truncate">
                                {featuredMatch.game} — hosted by{" "}
                                {featuredMatch.host.username}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {featuredMatch.stake > 0
                                  ? `$${(featuredMatch.stake / 100).toFixed(2)} wager • Open to join`
                                  : "Free scrim • Open to join"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                            <Badge className="bg-emerald-600 text-white text-xs">
                              {featuredMatch.status}
                            </Badge>
                            {featuredMatch.stake > 0 && (
                              <Badge className="bg-amber-600 text-white text-xs">
                                ${(featuredMatch.stake / 100).toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Home Content Area */}
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    <div className="flex-1">
                      <TrendingEsportsMatches onNavigate={handleNavigate} />

                      {/* Global Leaderboard Preview */}
                      <Card className="mt-6 md:mt-8 animate-fadeInUp animate-delay-300 hover-lift transition-all duration-300">
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Star className="h-5 w-5 text-amber-400" />
                              <h3 className="text-lg font-semibold text-foreground">
                                Global Leaderboard
                              </h3>
                            </div>
                            <Badge
                              className="bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                              onClick={() => handleNavigate("leaderboards")}
                            >
                              View Full
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {topEarners.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No earnings data yet.
                              </p>
                            ) : (
                              topEarners.map((player, index) => (
                                <div
                                  key={player.userId}
                                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer ${
                                    player.userId === user?.id
                                      ? "bg-primary/10 border border-primary/30 animate-fadeInLeft"
                                      : "bg-muted/30 hover:bg-muted/50"
                                  }`}
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                  onClick={() =>
                                    player.userId === user?.id
                                      ? handleNavigate("my-profile")
                                      : handleNavigate(
                                          `profile-${player.userId}`,
                                        )
                                  }
                                >
                                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                    <div
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm shrink-0 ${
                                        player.rank <= 3
                                          ? "bg-amber-600 text-white"
                                          : player.userId === user?.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      #{player.rank}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div
                                        className={`font-medium text-sm sm:text-base truncate ${
                                          player.userId === user?.id
                                            ? "text-primary"
                                            : "text-foreground"
                                        }`}
                                      >
                                        {player.username}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Trust: {player.trustScore.toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="text-xs sm:text-sm text-emerald-400 font-medium">
                                      $
                                      {(
                                        player.earningsCents / 100
                                      ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                    <div className="flex items-center justify-end space-x-1">
                                      <Star className="h-3 w-3 text-amber-400" />
                                      <span className="text-xs text-amber-400">
                                        {player.trustScore.toFixed(1)}%
                                      </span>
                                      {player.trustScore > 99 && (
                                        <Badge className="bg-emerald-600 text-white text-xs px-1">
                                          Elite
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Activity Rail - Hidden on mobile and tablet */}
                    <div className="hidden xl:block animate-fadeInRight">
                      <ActivityRail onNavigate={handleNavigate} />
                    </div>
                  </div>
                </div>
              )}
              {currentTab === "friends" && (
                <div className="page-transition">
                  <FriendsList onNavigate={handleNavigate} />
                </div>
              )}

              {currentTab === "create-match" && (
                <div className="page-transition">
                  <CreateMatch onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "create-wager" && (
                <div className="page-transition">
                  <CreateMatch onNavigate={handleNavigate} initialTab="wager" />
                </div>
              )}
              {currentTab === "create-scrim" && (
                <div className="page-transition">
                  <CreateMatch onNavigate={handleNavigate} initialTab="scrim" />
                </div>
              )}
              {currentTab === "create-tournament" && (
                <div className="page-transition">
                  <CreateMatch
                    onNavigate={handleNavigate}
                    initialTab="tournament"
                  />
                </div>
              )}
              {currentTab === "create-team-hub" && (
                <div className="page-transition">
                  <CreateTeamHub onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "join-match" && (
                <div className="page-transition">
                  <JoinMatch onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "join-hub" && (
                <div className="page-transition">
                  <JoinHub onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "view-match" && (
                <div className="page-transition">
                  <MyEvents onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab.startsWith("view-match-") && (
                <div className="page-transition">
                  <ViewMatch
                    eventId={currentTab.replace("view-match-", "")}
                    onBack={() => handleNavigate("my-events")}
                  />
                </div>
              )}
              {(currentTab === "tournament-bracket" ||
                currentTab.startsWith("tournament-bracket-")) && (
                <div className="page-transition">
                  <TournamentBracket
                    onNavigate={handleNavigate}
                    tournamentId={
                      currentTab.startsWith("tournament-bracket-")
                        ? currentTab.replace("tournament-bracket-", "")
                        : undefined
                    }
                  />
                </div>
              )}
              {(currentTab === "tournament-schedule" ||
                currentTab.startsWith("tournament-schedule-")) && (
                <div className="page-transition">
                  <TournamentSchedule
                    onNavigate={handleNavigate}
                    tournamentId={
                      currentTab.startsWith("tournament-schedule-")
                        ? currentTab.replace("tournament-schedule-", "")
                        : undefined
                    }
                  />
                </div>
              )}
              {currentTab === "search-results" && (
                <div className="page-transition">
                  <SearchResults
                    onNavigate={handleNavigate}
                    searchQuery={searchQuery}
                  />
                </div>
              )}
              {currentTab === "my-profile" && (
                <div className="page-transition">
                  <PublicProfile
                    onNavigate={handleNavigate}
                    isOwnProfile={true}
                  />
                </div>
              )}
              {currentTab.startsWith("profile-") && (
                <div className="page-transition">
                  <PublicProfile
                    onNavigate={handleNavigate}
                    userId={currentTab.replace("profile-", "")}
                  />
                </div>
              )}
              {currentTab === "lobbies" && (
                <div className="page-transition">
                  <Lobbies onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "hubs" && (
                <div className="page-transition">
                  <TeamsPage onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "wagers" && (
                <div className="page-transition">
                  <Wagers onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "scrims" && (
                <div className="page-transition">
                  <Scrims onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "tournaments" && (
                <div className="page-transition">
                  <Tournaments onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "messages" && (
                <Messages
                  key={messagesKey}
                  initialConversationId={initialConversationId}
                  onInitialConsumed={() => setInitialConversationId(undefined)}
                  onNavigate={handleNavigate}
                  onUnreadCountChange={handleUnreadCountChange}
                />
              )}
              {currentTab === "leaderboards" && (
                <div className="page-transition">
                  <Leaderboards />
                </div>
              )}
              {currentTab === "stats" && (
                <div className="page-transition">
                  <PlayerStats onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "my-events" && (
                <div className="page-transition">
                  <MyEvents onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "settings" && (
                <div className="page-transition">
                  <Settings
                    onNavigate={handleNavigate}
                    onSignOut={handleSignOut}
                  />
                </div>
              )}
              {currentTab === "account-settings" && (
                <div className="page-transition">
                  <AccountSettings onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "wallet-escrow" && (
                <div className="page-transition">
                  <WalletEscrow onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "deposit-funds" && (
                <div className="page-transition">
                  <DepositFunds onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "withdraw-funds" && (
                <div className="page-transition">
                  <WithdrawFunds onNavigate={handleNavigate} />
                </div>
              )}
              {(currentTab === "request-match" ||
                currentTab.startsWith("request-match:")) && (
                <div className="page-transition">
                  <RequestMatch
                    onNavigate={handleNavigate}
                    preselectedOpponent={
                      currentTab.startsWith("request-match:")
                        ? currentTab.slice("request-match:".length)
                        : undefined
                    }
                  />
                </div>
              )}
              {(currentTab === "join-tournament" ||
                currentTab.startsWith("join-tournament-")) && (
                <div className="page-transition">
                  <JoinTournament
                    onNavigate={handleNavigate}
                    tournamentId={
                      currentTab.startsWith("join-tournament-")
                        ? currentTab.replace("join-tournament-", "")
                        : undefined
                    }
                  />
                </div>
              )}
              {currentTab === "team-page" && (
                <div className="page-transition">
                  <TeamPage onNavigate={handleNavigate} isOwnTeam={true} />
                </div>
              )}
              {currentTab === "team-settings" && (
                <div className="page-transition">
                  <TeamSettings onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "team-invites" && (
                <div className="page-transition">
                  <TeamInvites
                    onNavigateToTeam={(teamId) =>
                      handleNavigate(`team-${teamId}`)
                    }
                  />
                </div>
              )}
              {currentTab.startsWith("team-") &&
                !currentTab.startsWith("team-detail-") &&
                !["team-page", "team-settings", "team-invites"].includes(
                  currentTab,
                ) && (
                  <div className="page-transition">
                    <TeamPage
                      onNavigate={handleNavigate}
                      teamId={currentTab.replace("team-", "")}
                      isOwnTeam={false}
                    />
                  </div>
                )}
              {currentTab.startsWith("hub-") && (
                <div className="page-transition">
                  <HubPage
                    onNavigate={handleNavigate}
                    hubId={currentTab.replace("hub-", "")}
                    isJoined={true}
                  />
                </div>
              )}
              {currentTab.startsWith("team-detail-") && (
                <div className="page-transition">
                  <TeamDetailPage
                    teamId={currentTab.replace("team-detail-", "")}
                    onNavigate={handleNavigate}
                  />
                </div>
              )}
              {currentTab === "subscriptions-credits" && (
                <div className="page-transition">
                  <SubscriptionsCredits onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "notifications-preferences" && (
                <div className="page-transition">
                  <NotificationSettings onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "privacy-security" && (
                <div className="page-transition">
                  <PrivacySecurity onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "keyboard-shortcuts" && (
                <div className="page-transition">
                  <KeyboardShortcuts onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "language" && (
                <div className="page-transition">
                  <Language onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "help-center" && (
                <div className="page-transition">
                  <HelpCenter onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "report-bug" && (
                <div className="page-transition">
                  <ReportBug onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "contact-support" && (
                <div className="page-transition">
                  <ContactSupport onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "deactivate-account" && (
                <div className="page-transition">
                  <DeactivateAccount onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "delete-account" && (
                <div className="page-transition">
                  <DeleteAccount onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "admin" && (
                <div className="page-transition">
                  {user?.role === "ADMIN" ? (
                    <Admin />
                  ) : (
                    <Card className="p-6">
                      <CardContent>
                        <h3 className="text-lg font-semibold">Access Denied</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          You do not have permission to view the Admin
                          Dashboard.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {currentTab === "terms-of-service" && (
                <div className="page-transition">
                  <TermsOfService onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "privacy-policy" && (
                <div className="page-transition">
                  <PrivacyPolicy onNavigate={handleNavigate} />
                </div>
              )}
              {currentTab === "moderator" && (
                <div className="page-transition">
                  {user?.role === "MODERATOR" || user?.role === "ADMIN" ? (
                    <Moderator />
                  ) : (
                    <Card className="p-6">
                      <CardContent>
                        <h3 className="text-lg font-semibold">Access Denied</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          You do not have permission to view the Moderator
                          Dashboard.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Hidden on Messages page */}
            {currentTab !== "messages" && (
              <div className="mt-20">
                <Footer onNavigate={handleNavigate} />
              </div>
            )}
          </main>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNav
          activeTab={currentTab}
          onNavigate={handleNavigate}
          messageCount={messageUnreadCount}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <PresenceProvider>
            <AppContent />
          </PresenceProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
