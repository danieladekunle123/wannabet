import React, { useState } from 'react';
import { ThemeProvider } from './components/ThemeContext';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { OpenLobbies } from './components/OpenLobbies';
import { Tournaments } from './components/Tournaments';
import { Scrims } from './components/Scrims';
import { Lobbies } from './components/Lobbies';
import { SocialHubs } from './components/SocialHubs';
import { Wagers } from './components/Wagers';
import { Messages } from './components/Messages';
import { Settings } from './components/Settings';
import { Leaderboards } from './components/Leaderboards';
import { ActivityRail } from './components/ActivityRail';
import { PlayerStats } from './components/PlayerStats';
import { CreateMatch } from './components/CreateMatch';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { AccountSettings } from './components/AccountSettings';
import { WalletEscrow } from './components/WalletEscrow';
import { SubscriptionsCredits } from './components/SubscriptionsCredits';
import { JoinMatch } from './components/JoinMatch';
import { JoinHub } from './components/JoinHub';
import { CreateTeamHub } from './components/CreateTeamHub';
import { ViewMatch } from './components/ViewMatch';
import { TournamentBracket } from './components/TournamentBracket';
import { TournamentSchedule } from './components/TournamentSchedule';
import { SearchResults } from './components/SearchResults';
import { PublicProfile } from './components/PublicProfile';
import { DepositFunds } from './components/DepositFunds';
import { WithdrawFunds } from './components/WithdrawFunds';
import { RequestMatch } from './components/RequestMatch';
import { JoinTournament } from './components/JoinTournament';
import { TeamPage } from './components/TeamPage';
import { TeamSettings } from './components/TeamSettings';
import { TeamInvites } from './components/TeamInvites';
import { HubPage } from './components/HubPage';

import { NotificationSettings } from './components/NotificationSettings';
import { PrivacySecurity } from './components/PrivacySecurity';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { Language } from './components/Language';
import { HelpCenter } from './components/HelpCenter';
import { ReportBug } from './components/ReportBug';
import { ContactSupport } from './components/ContactSupport';
import { DeactivateAccount } from './components/DeactivateAccount';
import { DeleteAccount } from './components/DeleteAccount';
import { Onboarding } from './components/Onboarding';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Card, CardContent } from './components/ui/card';
import { Trophy, Users, Star, Flame, Clock } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [contentTab, setContentTab] = useState('lobbies');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('signup');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [messagesKey, setMessagesKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll to top instantly when changing tabs for clean page transitions
  React.useEffect(() => {
    window.scrollTo(0, 0);
    // Also reset scroll for main content area
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
    
    // Force Messages component to remount for animation
    if (activeTab === 'messages') {
      setMessagesKey(prev => prev + 1);
    }
  }, [activeTab]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActiveTab('home');
  };

  const handleSignup = () => {
    setIsAuthenticated(true);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setActiveTab('home');
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setActiveTab('home');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setAuthView('signup');
    setActiveTab('home');
    setShowOnboarding(false);
  };

  const handleNavigate = (tab: string, query?: string) => {
    setActiveTab(tab);
    if (query) {
      setSearchQuery(query);
    }
  };

  // Handle scroll to hide/show sidebar
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Hide sidebar when scrolled down more than 400px
      setHideSidebar(scrollPosition > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show onboarding if user just signed up
  if (isAuthenticated && showOnboarding) {
    return (
      <Onboarding 
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  // Show login/signup if not authenticated
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <Login 
          onNavigate={handleLogin}
          onSwitchToSignup={() => setAuthView('signup')}
        />
      );
    } else {
      return (
        <Signup 
          onNavigate={handleSignup}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${
      activeTab === 'messages' ? 'overflow-hidden h-screen' : ''
    }`}>
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
      <div className="content-layer">
        {/* Hide navigation on mobile when viewing messages */}
        <div className={activeTab === 'messages' ? 'hidden lg:block' : ''}>
          <Navigation onNavigate={handleNavigate} onSignOut={handleSignOut} />
        </div>
      
      <div className={`flex relative ${activeTab === 'messages' ? 'h-full overflow-hidden' : ''}`}>
        {/* Left Sidebar - Hidden on mobile and when scrolled */}
        <div className={`hidden lg:flex overflow-hidden shrink-0 ${
          hideSidebar 
            ? 'sidebar-fade-out lg:pointer-events-none' 
            : 'sidebar-fade-in'
        }`}
        style={{
          width: hideSidebar ? '0px' : '256px'
        }}>
          <div className="w-64 shrink-0">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onSignOut={handleSignOut} />
          </div>
        </div>
        
        {/* Main Content */}
        <main className={`flex-1 min-w-0 content-expand ${
          activeTab === 'messages' ? 'p-0' : 'p-3 sm:p-4 md:p-6 pb-20 lg:pb-6'
        }`}>
          <div className={activeTab === 'messages' ? '' : 'mx-auto max-w-7xl'}>
            {/* Render different pages based on activeTab */}
            {activeTab === 'home' && (
              <div className="page-transition">
                {/* Hero Section */}
                <Hero onNavigate={setActiveTab} />

                {/* Featured Match Banner */}
                <Card className="mb-6 md:mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent animate-fadeInUp animate-delay-100 hover-lift transition-all duration-300">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <Badge className="bg-primary text-primary-foreground shrink-0 animate-pulse">
                          <Flame className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Featured Match</span>
                          <span className="sm:hidden">Live</span>
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground text-sm sm:text-base truncate">Team Phoenix vs Alpha Squad - CS2 Finals</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">$2,500 prize pool • Starting in 45 minutes</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                        <Badge className="bg-emerald-600 text-white text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          2.4k
                        </Badge>
                        <Badge className="bg-amber-600 text-white text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          45m
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabbed Content Area */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                  <div className="flex-1">
                    <Tabs value={contentTab} onValueChange={setContentTab} className="space-y-4 md:space-y-6">
                      <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                        <TabsTrigger 
                          value="lobbies" 
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">Open Lobbies</span>
                          <span className="sm:hidden">Lobbies</span>
                          <Badge className="ml-1 sm:ml-2 bg-emerald-600 text-white text-xs">143</Badge>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="tournaments"
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                        >
                          <Trophy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Tournaments</span>
                          <Badge className="ml-1 sm:ml-2 bg-amber-600 text-white text-xs">NEW</Badge>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="scrims"
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">Scrims</span>
                          <span className="sm:hidden">Scrims</span>
                          <Badge className="ml-1 sm:ml-2 bg-blue-600 text-white text-xs">24</Badge>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="lobbies" className="space-y-4 md:space-y-6">
                        <OpenLobbies onNavigate={setActiveTab} showSeeAll={true} />
                      </TabsContent>

                      <TabsContent value="tournaments" className="space-y-4 md:space-y-6">
                        <Tournaments onNavigate={setActiveTab} showSeeAll={true} />
                      </TabsContent>

                      <TabsContent value="scrims" className="space-y-4 md:space-y-6">
                        <Scrims onNavigate={setActiveTab} showSeeAll={true} />
                      </TabsContent>
                    </Tabs>

                    {/* Global Leaderboard Preview */}
                    <Card className="mt-6 md:mt-8 animate-fadeInUp animate-delay-300 hover-lift transition-all duration-300">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Star className="h-5 w-5 text-amber-400" />
                            <h3 className="text-lg font-semibold text-foreground">Global Leaderboard</h3>
                          </div>
                          <Badge 
                            className="bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                            onClick={() => setActiveTab('leaderboards')}
                          >
                            View Full
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {[
                            { rank: 1, name: 'EsportsLegend', wins: 847, mmr: 3250, earnings: 12500, trust: 99.8, userId: '1' },
                            { rank: 2, name: 'ProGamerElite', wins: 723, mmr: 3180, earnings: 9800, trust: 99.5, userId: '2' },
                            { rank: 3, name: 'SkillMasterX', wins: 692, mmr: 3150, earnings: 8900, trust: 98.9, userId: '3' },
                            { rank: 4, name: 'TeamCaptain', wins: 645, mmr: 3100, earnings: 7650, trust: 99.2, userId: '4' },
                            { rank: 5, name: 'YouAreHere', wins: 127, mmr: 2450, earnings: 1240, trust: 98.5, highlight: true }
                          ].map((player, index) => (
                            <div 
                              key={player.rank} 
                              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer ${
                                player.highlight 
                                  ? 'bg-primary/10 border border-primary/30 animate-fadeInLeft' 
                                  : 'bg-muted/30 hover:bg-muted/50'
                              }`}
                              style={{ animationDelay: `${index * 0.1}s` }}
                              onClick={() => player.highlight ? setActiveTab('my-profile') : setActiveTab(`profile-${player.userId}`)}
                            >
                              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm shrink-0 ${
                                  player.rank <= 3 
                                    ? 'bg-amber-600 text-white' 
                                    : player.highlight
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                }`}>
                                  #{player.rank}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={`font-medium text-sm sm:text-base truncate ${player.highlight ? 'text-primary' : 'text-foreground'}`}>
                                    {player.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {player.wins} wins • {player.mmr} MMR
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs sm:text-sm text-emerald-400 font-medium">
                                  ${player.earnings.toLocaleString()}
                                </div>
                                <div className="flex items-center justify-end space-x-1">
                                  <Star className="h-3 w-3 text-amber-400" />
                                  <span className="text-xs text-amber-400">{player.trust}%</span>
                                  {player.trust > 99 && (
                                    <Badge className="bg-emerald-600 text-white text-xs px-1">
                                      Elite
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Activity Rail - Hidden on mobile and tablet */}
                  <div className="hidden xl:block animate-fadeInRight">
                    <ActivityRail onNavigate={setActiveTab} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'create-match' && <div className="page-transition"><CreateMatch onNavigate={setActiveTab} /></div>}
            {activeTab === 'create-wager' && <div className="page-transition"><CreateMatch onNavigate={setActiveTab} initialTab="wager" /></div>}
            {activeTab === 'create-scrim' && <div className="page-transition"><CreateMatch onNavigate={setActiveTab} initialTab="scrim" /></div>}
            {activeTab === 'create-tournament' && <div className="page-transition"><CreateMatch onNavigate={setActiveTab} initialTab="tournament" /></div>}
            {activeTab === 'create-team-hub' && <div className="page-transition"><CreateTeamHub onNavigate={setActiveTab} /></div>}
            {activeTab === 'join-match' && <div className="page-transition"><JoinMatch onNavigate={setActiveTab} /></div>}
            {activeTab === 'join-hub' && <div className="page-transition"><JoinHub onNavigate={setActiveTab} /></div>}
            {activeTab === 'view-match' && <div className="page-transition"><ViewMatch onNavigate={setActiveTab} /></div>}
            {activeTab === 'tournament-bracket' && <div className="page-transition"><TournamentBracket onNavigate={setActiveTab} /></div>}
            {activeTab === 'tournament-schedule' && <div className="page-transition"><TournamentSchedule onNavigate={setActiveTab} /></div>}
            {activeTab === 'search-results' && <div className="page-transition"><SearchResults onNavigate={setActiveTab} searchQuery={searchQuery} /></div>}
            {activeTab === 'my-profile' && <div className="page-transition"><PublicProfile onNavigate={setActiveTab} isOwnProfile={true} /></div>}
            {activeTab.startsWith('profile-') && <div className="page-transition"><PublicProfile onNavigate={setActiveTab} userId={activeTab.replace('profile-', '')} /></div>}
            {activeTab === 'lobbies' && <div className="page-transition"><Lobbies onNavigate={setActiveTab} /></div>}
            {activeTab === 'hubs' && <div className="page-transition"><SocialHubs onNavigate={setActiveTab} /></div>}
            {activeTab === 'wagers' && <div className="page-transition"><Wagers onNavigate={setActiveTab} /></div>}
            {activeTab === 'scrims' && <div className="page-transition"><Scrims onNavigate={setActiveTab} /></div>}
            {activeTab === 'tournaments' && <div className="page-transition"><Tournaments onNavigate={setActiveTab} /></div>}
            {activeTab === 'messages' && <Messages key={messagesKey} />}
            {activeTab === 'leaderboards' && <div className="page-transition"><Leaderboards /></div>}
            {activeTab === 'stats' && <div className="page-transition"><PlayerStats onNavigate={setActiveTab} /></div>}
            {activeTab === 'settings' && <div className="page-transition"><Settings onNavigate={setActiveTab} onSignOut={handleSignOut} /></div>}
            {activeTab === 'account-settings' && <div className="page-transition"><AccountSettings onNavigate={setActiveTab} /></div>}
            {activeTab === 'wallet-escrow' && <div className="page-transition"><WalletEscrow onNavigate={setActiveTab} /></div>}
            {activeTab === 'deposit-funds' && <div className="page-transition"><DepositFunds onNavigate={setActiveTab} /></div>}
            {activeTab === 'withdraw-funds' && <div className="page-transition"><WithdrawFunds onNavigate={setActiveTab} /></div>}
            {activeTab === 'request-match' && <div className="page-transition"><RequestMatch onNavigate={setActiveTab} /></div>}
            {activeTab === 'join-tournament' && <div className="page-transition"><JoinTournament onNavigate={setActiveTab} /></div>}
            {activeTab === 'team-page' && <div className="page-transition"><TeamPage onNavigate={setActiveTab} isOwnTeam={true} /></div>}
            {activeTab === 'team-settings' && <div className="page-transition"><TeamSettings onNavigate={setActiveTab} /></div>}
            {activeTab === 'team-invites' && <div className="page-transition"><TeamInvites onNavigateToTeam={(teamId) => setActiveTab(`team-${teamId}`)} /></div>}
            {activeTab.startsWith('team-') && !['team-page', 'team-settings', 'team-invites'].includes(activeTab) && <div className="page-transition"><TeamPage onNavigate={setActiveTab} teamId={activeTab.replace('team-', '')} isOwnTeam={false} /></div>}
            {activeTab.startsWith('hub-') && <div className="page-transition"><HubPage onNavigate={setActiveTab} hubId={activeTab.replace('hub-', '')} isJoined={true} /></div>}
            {activeTab === 'subscriptions-credits' && <div className="page-transition"><SubscriptionsCredits onNavigate={setActiveTab} /></div>}
            {activeTab === 'notifications-preferences' && <div className="page-transition"><NotificationSettings onNavigate={setActiveTab} /></div>}
            {activeTab === 'privacy-security' && <div className="page-transition"><PrivacySecurity onNavigate={setActiveTab} /></div>}
            {activeTab === 'keyboard-shortcuts' && <div className="page-transition"><KeyboardShortcuts onNavigate={setActiveTab} /></div>}
            {activeTab === 'language' && <div className="page-transition"><Language onNavigate={setActiveTab} /></div>}
            {activeTab === 'help-center' && <div className="page-transition"><HelpCenter onNavigate={setActiveTab} /></div>}
            {activeTab === 'report-bug' && <div className="page-transition"><ReportBug onNavigate={setActiveTab} /></div>}
            {activeTab === 'contact-support' && <div className="page-transition"><ContactSupport onNavigate={setActiveTab} /></div>}
            {activeTab === 'deactivate-account' && <div className="page-transition"><DeactivateAccount onNavigate={setActiveTab} /></div>}
            {activeTab === 'delete-account' && <div className="page-transition"><DeleteAccount onNavigate={setActiveTab} /></div>}
          </div>

          {/* Footer - Hidden on Messages page */}
          {activeTab !== 'messages' && <Footer />}
        </main>
      </div>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNav activeTab={activeTab} onNavigate={setActiveTab} messageCount={12} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}