import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings, 
  Trophy, 
  Users, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Shield,
  Target,
  Crown,
  Swords,
  MessageCircle,
  UserPlus,
  Star,
  Flame,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Award
} from 'lucide-react';
import { useTheme } from './ThemeContext';

interface TeamPageProps {
  onNavigate?: (page: string) => void;
  teamId?: string;
  isOwnTeam?: boolean;
}

export function TeamPage({ onNavigate, teamId = '1', isOwnTeam = true }: TeamPageProps) {
  const { color } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock team data
  const teamData = {
    name: 'Team Phoenix',
    tag: 'PHX',
    logo: '🔥',
    banner: 'linear-gradient(135deg, rgba(229, 9, 20, 0.2) 0%, rgba(229, 9, 20, 0.05) 100%)',
    description: 'Elite competitive esports team focused on CS2 and Valorant. Dominating the scene since 2023.',
    founded: 'Jan 2023',
    captain: 'PhoenixLeader',
    trustScore: 99.2,
    stats: {
      wins: 156,
      losses: 23,
      winRate: 87.2,
      totalEarnings: 48500,
      tournamentsWon: 12,
      currentStreak: 8,
      mmr: 3250
    },
    roster: [
      { id: '1', name: 'PhoenixLeader', role: 'Captain', game: 'CS2', kd: 1.84, wins: 156, trustScore: 99.5, status: 'online' },
      { id: '2', name: 'BlazeFury', role: 'Entry Fragger', game: 'CS2', kd: 1.92, wins: 142, trustScore: 98.8, status: 'online' },
      { id: '3', name: 'EmberStrike', role: 'AWPer', game: 'Valorant', kd: 2.15, wins: 138, trustScore: 99.1, status: 'in-game' },
      { id: '4', name: 'InfernoShot', role: 'Support', game: 'Valorant', kd: 1.67, wins: 129, trustScore: 98.4, status: 'offline' },
      { id: '5', name: 'PyroTactic', role: 'IGL', game: 'CS2', kd: 1.73, wins: 145, trustScore: 99.0, status: 'online' }
    ],
    recentMatches: [
      { id: '1', opponent: 'Alpha Squad', game: 'CS2', result: 'win', score: '16-12', prize: 500, date: '2h ago' },
      { id: '2', opponent: 'Team Riptide', game: 'Valorant', result: 'win', score: '13-8', prize: 750, date: '1d ago' },
      { id: '3', opponent: 'Elite Gaming', game: 'CS2', result: 'win', score: '16-14', prize: 1000, date: '2d ago' },
      { id: '4', opponent: 'Apex Legends', game: 'Valorant', result: 'loss', score: '11-13', prize: 0, date: '3d ago' },
      { id: '5', opponent: 'Pro Esports', game: 'CS2', result: 'win', score: '16-9', prize: 850, date: '4d ago' }
    ],
    achievements: [
      { id: '1', title: 'Tournament Champion', description: 'Won CS2 Winter Championship 2024', icon: '🏆' },
      { id: '2', title: 'Undefeated', description: '8-game winning streak', icon: '🔥' },
      { id: '3', title: 'Elite Squad', description: 'All members above 98% trust score', icon: '⭐' },
      { id: '4', title: 'Money Makers', description: 'Earned over $40,000', icon: '💰' }
    ],
    upcomingMatches: [
      { id: '1', opponent: 'Cyber Warriors', game: 'CS2', mode: 'BO3', prize: 2500, time: '2h 15m', status: 'Confirmed' },
      { id: '2', opponent: 'Digital Knights', game: 'Valorant', mode: 'BO5', prize: 5000, time: '1d 4h', status: 'Pending' }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'in-game': return 'bg-amber-500';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-game': return 'In Game';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.('hubs')}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-foreground">Team Profile</h1>
          <p className="text-muted-foreground">View team statistics and roster</p>
        </div>
      </div>

      {/* Team Banner */}
      <Card className="border-primary/30 overflow-hidden animate-fadeInUp animate-delay-100">
        <div 
          className="h-32 sm:h-40 relative"
          style={{ background: teamData.banner }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>
        <CardContent className="relative -mt-16 sm:-mt-20 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Team Logo */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-card border-4 border-card flex items-center justify-center text-5xl sm:text-6xl shadow-xl">
                {teamData.logo}
              </div>
              {isOwnTeam && (
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                  onClick={() => onNavigate?.('team-settings')}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Team Info */}
            <div className="flex-1 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-foreground">{teamData.name}</h2>
                    <Badge className="bg-primary/20 text-primary border border-primary/30">
                      [{teamData.tag}]
                    </Badge>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">{teamData.trustScore}%</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{teamData.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Founded {teamData.founded}</span>
                    <span>•</span>
                    <span>Captain: {teamData.captain}</span>
                  </div>
                </div>

                {!isOwnTeam && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Request to Join
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 animate-fadeInUp animate-delay-200">
        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{teamData.stats.wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{teamData.stats.losses}</div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">{teamData.stats.winRate}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">${(teamData.stats.totalEarnings / 1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground">Earnings</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Crown className="h-5 w-5 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{teamData.stats.tournamentsWon}</div>
            <div className="text-xs text-muted-foreground">Tournaments</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Flame className="h-5 w-5 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-400">{teamData.stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{teamData.stats.mmr}</div>
            <div className="text-xs text-muted-foreground">Team MMR</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fadeInUp animate-delay-300">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="roster" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4 mr-2" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="matches" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Swords className="h-4 w-4 mr-2" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Award className="h-4 w-4 mr-2" />
            Awards
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Upcoming Matches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-foreground">Upcoming Matches</h3>
                </div>
                <Badge className="bg-primary/20 text-primary">
                  {teamData.upcomingMatches.length} Scheduled
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamData.upcomingMatches.map((match, index) => (
                <div
                  key={match.id}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover-lift cursor-pointer animate-fadeInLeft"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">vs {match.opponent}</span>
                        <Badge variant="outline" className="text-xs">{match.game}</Badge>
                        <Badge variant="outline" className="text-xs">{match.mode}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Starts in {match.time}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-medium">${match.prize.toLocaleString()}</div>
                      <Badge className={`mt-1 text-xs ${
                        match.status === 'Confirmed' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-amber-600 text-white'
                      }`}>
                        {match.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h3 className="text-foreground">Recent Matches</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamData.recentMatches.slice(0, 3).map((match, index) => (
                <div
                  key={match.id}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer animate-fadeInRight"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={match.result === 'win' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}>
                        {match.result.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="font-medium text-foreground text-sm">vs {match.opponent}</div>
                        <div className="text-xs text-muted-foreground">{match.game} • {match.score}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {match.prize > 0 && (
                        <div className="text-sm text-emerald-400">+${match.prize}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{match.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roster Tab */}
        <TabsContent value="roster" className="space-y-4 mt-6">
          {teamData.roster.map((player, index) => (
            <Card
              key={player.id}
              className="hover-lift cursor-pointer transition-all duration-300 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onNavigate?.(`profile-${player.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {player.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(player.status)}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-medium text-foreground">{player.name}</h4>
                      {player.role === 'Captain' && (
                        <Badge className="bg-amber-600 text-white text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Captain
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{player.role}</Badge>
                      <span className="text-xs text-muted-foreground">• {getStatusText(player.status)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{player.game}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-foreground">K/D: {player.kd}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-emerald-400">{player.wins} Wins</span>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">{player.trustScore}%</span>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {isOwnTeam && (
            <Button
              variant="outline"
              className="w-full border-dashed border-primary/30 hover:bg-primary/10 hover:border-primary"
              onClick={() => onNavigate?.('team-settings')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite New Member
            </Button>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-4 mt-6">
          {teamData.recentMatches.map((match, index) => (
            <Card
              key={match.id}
              className="hover-lift cursor-pointer transition-all duration-300 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className={`${
                      match.result === 'win' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-red-600 text-white'
                    } text-sm px-3 py-1`}>
                      {match.result.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium text-foreground mb-1">
                        Team Phoenix vs {match.opponent}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{match.game}</Badge>
                        <span>Final Score: {match.score}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {match.prize > 0 && (
                      <div className="text-lg text-emerald-400 font-medium mb-1">
                        +${match.prize}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">{match.date}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamData.achievements.map((achievement, index) => (
              <Card
                key={achievement.id}
                className="hover-lift cursor-pointer transition-all duration-300 animate-scaleIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}