import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { AddFriendDialog } from './AddFriendDialog';
import { ReportUserDialog } from './ReportUserDialog';
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
  Flag,
  Crown,
  Flame,
  Swords,
  BarChart3,
  Edit
} from 'lucide-react';

interface PublicProfileProps {
  onNavigate: (tab: string) => void;
  userId?: string;
  isOwnProfile?: boolean;
}

// Mock user data - Replace with actual data from your backend
const mockOwnProfileData = {
  id: 'me',
  username: 'YouAreHere',
  avatar: 'YA',
  bio: 'Competitive gamer climbing the ranks | Always looking for new challenges',
  rank: 5,
  mmr: 2450,
  wins: 127,
  losses: 23,
  winRate: 84.7,
  earnings: 1240,
  trustScore: 98.5,
  level: 42,
  tier: 'Master',
  country: 'USA',
  joinDate: 'Mar 2024',
  isVerified: false,
  isOnline: true,
  games: [
    { name: 'Valorant', level: 45, wins: 62, losses: 12, hours: 340 },
    { name: 'CS2', level: 38, wins: 45, losses: 8, hours: 210 },
    { name: 'Fortnite', level: 22, wins: 20, losses: 3, hours: 87 }
  ],
  recentMatches: [
    { game: 'Valorant', result: 'Win', score: '13-10', earnings: 25, date: '1 hour ago' },
    { game: 'CS2', result: 'Win', score: '16-11', earnings: 50, date: '3 hours ago' },
    { game: 'Valorant', result: 'Win', score: '13-7', earnings: 30, date: '1 day ago' },
    { game: 'CS2', result: 'Loss', score: '12-16', earnings: -20, date: '1 day ago' },
    { game: 'Valorant', result: 'Win', score: '13-9', earnings: 35, date: '2 days ago' }
  ],
  achievements: [
    { name: 'Win Streak Master', description: '15 consecutive wins', icon: Flame, rarity: 'epic' },
    { name: 'Rising Star', description: 'Reached top 10 rank', icon: Trophy, rarity: 'rare' },
    { name: 'Trust Elite', description: '98%+ trust score', icon: Shield, rarity: 'rare' },
    { name: '100 Wins', description: 'Achieved 100 victories', icon: Award, rarity: 'uncommon' }
  ],
  stats: {
    totalMatches: 150,
    totalEarnings: 1240,
    avgMatchEarnings: 8.27,
    longestWinStreak: 15,
    favoriteGame: 'Valorant',
    mostPlayedHour: '7 PM - 10 PM EST',
    peakRank: 5,
    currentStreak: 5
  }
};

const mockOtherProfileData = {
  id: 1,
  username: 'EsportsLegend',
  avatar: 'EL',
  bio: 'Professional esports competitor | 5+ years experience | Looking for serious competitive matches',
  rank: 1,
  mmr: 3250,
  wins: 847,
  losses: 123,
  winRate: 87.3,
  earnings: 12500,
  trustScore: 99.8,
  level: 87,
  tier: 'Elite',
  country: 'USA',
  joinDate: 'Jan 2023',
  isVerified: true,
  isOnline: true,
  games: [
    { name: 'Valorant', level: 92, wins: 345, losses: 45, hours: 1240 },
    { name: 'CS2', level: 78, wins: 289, losses: 52, hours: 890 },
    { name: 'Fortnite', level: 65, wins: 213, losses: 26, hours: 567 }
  ],
  recentMatches: [
    { game: 'Valorant', result: 'Win', score: '13-8', earnings: 50, date: '2 hours ago' },
    { game: 'CS2', result: 'Win', score: '16-12', earnings: 75, date: '5 hours ago' },
    { game: 'Valorant', result: 'Loss', score: '11-13', earnings: -25, date: '1 day ago' },
    { game: 'CS2', result: 'Win', score: '16-9', earnings: 100, date: '1 day ago' },
    { game: 'Fortnite', result: 'Win', score: '#1', earnings: 150, date: '2 days ago' }
  ],
  achievements: [
    { name: 'Tournament Champion', description: 'Won 5 tournaments', icon: Crown, rarity: 'legendary' },
    { name: 'Win Streak Master', description: '25 consecutive wins', icon: Flame, rarity: 'epic' },
    { name: 'Top 10 Global', description: 'Reached top 10 leaderboard', icon: Trophy, rarity: 'epic' },
    { name: 'Trust Elite', description: '99%+ trust score', icon: Shield, rarity: 'rare' },
    { name: 'High Roller', description: '$10,000+ in wagers', icon: DollarSign, rarity: 'rare' },
    { name: '500 Wins', description: 'Achieved 500 victories', icon: Award, rarity: 'uncommon' }
  ],
  stats: {
    totalMatches: 970,
    totalEarnings: 12500,
    avgMatchEarnings: 12.89,
    longestWinStreak: 27,
    favoriteGame: 'Valorant',
    mostPlayedHour: '8 PM - 11 PM EST',
    peakRank: 1,
    currentStreak: 5
  }
};

export function PublicProfile({ onNavigate, userId, isOwnProfile = false }: PublicProfileProps) {
  const profile = isOwnProfile ? mockOwnProfileData : mockOtherProfileData; // In production, fetch based on userId
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header with Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(isOwnProfile ? 'home' : 'search-results')}
        className="mb-4 hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {isOwnProfile ? 'Back to Home' : 'Back to Search'}
      </Button>

      {/* Profile Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl sm:text-3xl">{profile.avatar}</span>
                </div>
                {profile.isOnline && (
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-card rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{profile.username}</h1>
                  {profile.isVerified && (
                    <Shield className="h-6 w-6 text-blue-400 shrink-0" />
                  )}
                  <Badge className={`${profile.tier === 'Elite' ? 'bg-amber-600' : 'bg-blue-600'} text-white`}>
                    {profile.tier}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
                
                <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                  <Badge variant="outline" className="flex items-center">
                    <Trophy className="h-3 w-3 mr-1 text-amber-400" />
                    #{profile.rank} Global
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
                  {profile.games.map(game => (
                    <Badge key={game.name} className="bg-primary/20 text-foreground">
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
                    onClick={() => onNavigate('account-settings')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onNavigate('wallet-escrow')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Wallet & Escrow
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:flex-1 lg:w-auto"
                    onClick={() => onNavigate('request-match')}
                  >
                    <Swords className="h-4 w-4 mr-2" />
                    Request Match
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full sm:flex-1 lg:w-auto"
                    onClick={() => onNavigate('messages')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full sm:flex-1 lg:w-auto"
                    onClick={() => setShowAddFriendDialog(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
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
            <div className="text-2xl font-bold text-foreground mb-1">{profile.mmr}</div>
            <div className="text-xs text-muted-foreground">MMR Rating</div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fadeInUp animate-delay-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-400" />
              <span className="text-xs text-emerald-400">+{profile.winRate}%</span>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{profile.wins}W</div>
            <div className="text-xs text-muted-foreground">{profile.losses}L • {profile.winRate}% WR</div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fadeInUp animate-delay-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">${profile.earnings.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fadeInUp animate-delay-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <Badge className="bg-orange-600 text-white text-xs">Hot</Badge>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{profile.stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Win Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                    <span className="text-sm text-muted-foreground">Total Matches</span>
                    <span className="font-semibold text-foreground">{profile.stats.totalMatches}</span>
                  </div>
                  <Progress value={(profile.wins / profile.stats.totalMatches) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Avg Match Earnings</span>
                    <span className="font-semibold text-emerald-400">${profile.stats.avgMatchEarnings}</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Longest Win Streak</span>
                    <span className="font-semibold text-foreground">{profile.stats.longestWinStreak}</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Peak Rank</span>
                    <span className="font-semibold text-amber-400">#{profile.stats.peakRank}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Favorite Game</span>
                  <Badge className="bg-primary text-primary-foreground">{profile.stats.favoriteGame}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Most Active Hours</span>
                  <span className="text-sm text-foreground">{profile.stats.mostPlayedHour}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          {profile.games.map((game, index) => (
            <Card key={game.name} className="hover-lift animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{game.name}</h4>
                    <Badge variant="outline" className="text-xs">Level {game.level}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">{game.wins}W</div>
                    <div className="text-xs text-muted-foreground">{game.losses}L</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="text-foreground">{((game.wins / (game.wins + game.losses)) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(game.wins / (game.wins + game.losses)) * 100} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Hours Played</span>
                    <span className="text-foreground font-semibold">{game.hours}h</span>
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
              className={`hover-lift animate-fadeInUp ${match.result === 'Win' ? 'border-emerald-600/30' : 'border-red-600/30'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Badge className={`${match.result === 'Win' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
                      {match.result}
                    </Badge>
                    <div>
                      <div className="font-semibold text-foreground">{match.game}</div>
                      <div className="text-xs text-muted-foreground">{match.score}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-bold ${match.earnings > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {match.earnings > 0 ? '+' : ''}${match.earnings}
                    </div>
                    <div className="text-xs text-muted-foreground">{match.date}</div>
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
                legendary: 'from-amber-500 to-orange-600',
                epic: 'from-purple-500 to-pink-600',
                rare: 'from-blue-500 to-cyan-600',
                uncommon: 'from-green-500 to-emerald-600'
              };
              
              return (
                <Card 
                  key={achievement.name} 
                  className="hover-lift animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${rarityColors[achievement.rarity as keyof typeof rarityColors]} flex items-center justify-center shrink-0 shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-sm">{achievement.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              achievement.rarity === 'legendary' ? 'border-amber-400 text-amber-400' :
                              achievement.rarity === 'epic' ? 'border-purple-400 text-purple-400' :
                              achievement.rarity === 'rare' ? 'border-blue-400 text-blue-400' :
                              'border-green-400 text-green-400'
                            }`}
                          >
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
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
          <AddFriendDialog
            open={showAddFriendDialog}
            onOpenChange={setShowAddFriendDialog}
            username={profile.username}
            avatar={profile.avatar}
          />
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
