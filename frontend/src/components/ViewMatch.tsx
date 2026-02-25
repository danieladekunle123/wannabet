import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Target,
  TrendingUp,
  TrendingDown,
  Star,
  Shield,
  Swords,
  Video,
  Download,
  Share2,
  Award,
  Zap,
  Flame,
  Crown,
  CheckCircle2,
  XCircle,
  Eye,
  MessageCircle,
  BarChart3,
  Activity
} from 'lucide-react';

interface ViewMatchProps {
  onNavigate: (tab: string) => void;
  matchId?: string;
}

export function ViewMatch({ onNavigate, matchId = '1' }: ViewMatchProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock match data - would come from props/API in real app
  const match = {
    id: matchId,
    game: 'Counter-Strike 2',
    mode: '5v5 Competitive',
    map: 'Dust II',
    date: 'Mar 28, 2024',
    time: '7:45 PM EST',
    duration: '42:18',
    result: 'victory',
    score: { team1: 16, team2: 12 },
    prizePool: 250,
    entryFee: 50,
    region: 'NA East',
    rank: 'Diamond III',
    
    team1: {
      name: 'Your Team',
      tag: 'YT',
      score: 16,
      won: true,
      players: [
        { name: 'You', kills: 24, deaths: 18, assists: 7, headshots: 58, adr: 82.3, rating: 1.24, mvp: true },
        { name: 'Teammate1', kills: 21, deaths: 19, assists: 9, headshots: 52, adr: 76.8, rating: 1.08 },
        { name: 'Teammate2', kills: 19, deaths: 20, assists: 11, headshots: 48, adr: 71.2, rating: 0.98 },
        { name: 'Teammate3', kills: 18, deaths: 21, assists: 8, headshots: 45, adr: 68.5, rating: 0.92 },
        { name: 'Teammate4', kills: 16, deaths: 22, assists: 13, headshots: 50, adr: 65.4, rating: 0.87 },
      ]
    },
    
    team2: {
      name: 'Enemy Squad',
      tag: 'ES',
      score: 12,
      won: false,
      players: [
        { name: 'Enemy1', kills: 23, deaths: 20, assists: 6, headshots: 54, adr: 79.1, rating: 1.15 },
        { name: 'Enemy2', kills: 20, deaths: 19, assists: 8, headshots: 49, adr: 73.6, rating: 1.02 },
        { name: 'Enemy3', kills: 19, deaths: 21, assists: 7, headshots: 46, adr: 70.3, rating: 0.95 },
        { name: 'Enemy4', kills: 17, deaths: 20, assists: 10, headshots: 48, adr: 67.8, rating: 0.91 },
        { name: 'Enemy5', kills: 15, deaths: 18, assists: 9, headshots: 44, adr: 63.2, rating: 0.86 },
      ]
    },

    rounds: [
      { number: 1, winner: 'team1', bombPlanted: false, defused: false },
      { number: 2, winner: 'team2', bombPlanted: true, defused: false },
      { number: 3, winner: 'team1', bombPlanted: false, defused: false },
      { number: 4, winner: 'team1', bombPlanted: true, defused: true },
      { number: 5, winner: 'team2', bombPlanted: true, defused: false },
      { number: 6, winner: 'team1', bombPlanted: false, defused: false },
      { number: 7, winner: 'team1', bombPlanted: true, defused: true },
      { number: 8, winner: 'team2', bombPlanted: false, defused: false },
      { number: 9, winner: 'team1', bombPlanted: false, defused: false },
      { number: 10, winner: 'team2', bombPlanted: true, defused: false },
      { number: 11, winner: 'team2', bombPlanted: false, defused: false },
      { number: 12, winner: 'team1', bombPlanted: true, defused: true },
      { number: 13, winner: 'team1', bombPlanted: false, defused: false },
      { number: 14, winner: 'team2', bombPlanted: true, defused: false },
      { number: 15, winner: 'team1', bombPlanted: false, defused: false },
      // Half
      { number: 16, winner: 'team2', bombPlanted: false, defused: false },
      { number: 17, winner: 'team1', bombPlanted: true, defused: true },
      { number: 18, winner: 'team1', bombPlanted: false, defused: false },
      { number: 19, winner: 'team2', bombPlanted: true, defused: false },
      { number: 20, winner: 'team1', bombPlanted: false, defused: false },
      { number: 21, winner: 'team2', bombPlanted: true, defused: false },
      { number: 22, winner: 'team1', bombPlanted: false, defused: false },
      { number: 23, winner: 'team2', bombPlanted: false, defused: false },
      { number: 24, winner: 'team1', bombPlanted: true, defused: true },
      { number: 25, winner: 'team1', bombPlanted: false, defused: false },
      { number: 26, winner: 'team1', bombPlanted: false, defused: false },
      { number: 27, winner: 'team2', bombPlanted: true, defused: false },
      { number: 28, winner: 'team1', bombPlanted: false, defused: false },
    ],

    highlights: [
      { type: 'ace', player: 'You', round: 12, timestamp: '18:32' },
      { type: '1v3_clutch', player: 'Teammate1', round: 7, timestamp: '09:45' },
      { type: '4k', player: 'Enemy1', round: 19, timestamp: '28:17' },
    ],

    awards: [
      { player: 'You', type: 'MVP', icon: 'crown' },
      { player: 'You', type: 'Most Kills', value: 24 },
      { player: 'Teammate4', type: 'Most Assists', value: 13 },
      { player: 'You', type: 'Highest ADR', value: 82.3 },
      { player: 'You', type: 'Best KD Ratio', value: 1.33 },
    ]
  };

  const totalKills = match.team1.score + match.team2.score;
  const yourTeamKillsPercent = (match.team1.score / totalKills) * 100;

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('stats')}
            className="hover:bg-muted transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground">Match Details</h1>
            <p className="text-muted-foreground">
              {match.game} • {match.mode}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Match Result Header */}
      <Card className={`border-2 animate-fadeInLeft ${
        match.result === 'victory' 
          ? 'border-emerald-600/50 bg-emerald-600/5' 
          : 'border-red-600/50 bg-red-600/5'
      }`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Team 1 */}
            <div className="flex flex-col items-center space-y-3 flex-1">
              <div className="flex items-center space-x-3">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {match.team1.tag}
                  </AvatarFallback>
                </Avatar>
                {match.team1.won && (
                  <Crown className="h-8 w-8 text-amber-400" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-foreground">{match.team1.name}</h3>
                <Badge variant="secondary" className="mt-1">Your Team</Badge>
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center space-y-2">
              <Badge className={`text-2xl px-6 py-3 ${
                match.result === 'victory'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              }`}>
                {match.team1.score} - {match.team2.score}
              </Badge>
              <div className="flex items-center space-x-2">
                {match.result === 'victory' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <span className={`font-medium ${
                  match.result === 'victory' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {match.result === 'victory' ? 'VICTORY' : 'DEFEAT'}
                </span>
              </div>
              <div className="text-center space-y-1">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-emerald-400 font-medium">+${match.prizePool}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{match.duration}</span>
                </div>
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center space-y-3 flex-1">
              <div className="flex items-center space-x-3">
                {match.team2.won && (
                  <Crown className="h-8 w-8 text-amber-400" />
                )}
                <Avatar className="h-16 w-16 border-2 border-muted">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                    {match.team2.tag}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center">
                <h3 className="font-medium text-foreground">{match.team2.name}</h3>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Match Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{match.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{match.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{match.map}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{match.rank}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scoreboard">Scoreboard</TabsTrigger>
          <TabsTrigger value="rounds">Round History</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card className="animate-fadeInLeft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Your Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">K/D/A</span>
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div className="font-medium text-foreground">24 / 18 / 7</div>
                    <div className="text-xs text-muted-foreground mt-1">Ratio: 1.33</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Headshot %</span>
                      <Zap className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="font-medium text-foreground">58%</div>
                    <Progress value={58} className="mt-2 h-2" />
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">ADR</span>
                      <Activity className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="font-medium text-foreground">82.3</div>
                    <div className="text-xs text-emerald-400 mt-1">+8.2 avg</div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <Star className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="font-medium text-foreground">1.24</div>
                    <div className="text-xs text-emerald-400 mt-1">Excellent</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Awards */}
            <Card className="animate-fadeInRight">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  <span>Match Awards</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {match.awards.map((award, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-600/10 to-transparent border border-amber-600/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-amber-600/20 flex items-center justify-center">
                        {award.icon === 'crown' ? (
                          <Crown className="h-5 w-5 text-amber-400" />
                        ) : (
                          <Trophy className="h-5 w-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{award.type}</div>
                        <div className="text-sm text-muted-foreground">{award.player}</div>
                      </div>
                    </div>
                    {award.value && (
                      <Badge className="bg-amber-600 text-white">
                        {award.value}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Team Stats Comparison */}
            <Card className="lg:col-span-2 animate-fadeInUp animate-delay-100">
              <CardHeader>
                <CardTitle>Team Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground">Total Kills</span>
                      <span className="text-muted-foreground">{match.team1.players.reduce((sum, p) => sum + p.kills, 0)} - {match.team2.players.reduce((sum, p) => sum + p.kills, 0)}</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-primary transition-all duration-500"
                        style={{ width: `${(match.team1.players.reduce((sum, p) => sum + p.kills, 0) / (match.team1.players.reduce((sum, p) => sum + p.kills, 0) + match.team2.players.reduce((sum, p) => sum + p.kills, 0))) * 100}%` }}
                      />
                      <div className="flex-1 bg-muted-foreground/30" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground">Total Deaths</span>
                      <span className="text-muted-foreground">{match.team1.players.reduce((sum, p) => sum + p.deaths, 0)} - {match.team2.players.reduce((sum, p) => sum + p.deaths, 0)}</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-red-600 transition-all duration-500"
                        style={{ width: `${(match.team1.players.reduce((sum, p) => sum + p.deaths, 0) / (match.team1.players.reduce((sum, p) => sum + p.deaths, 0) + match.team2.players.reduce((sum, p) => sum + p.deaths, 0))) * 100}%` }}
                      />
                      <div className="flex-1 bg-muted-foreground/30" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground">Total Assists</span>
                      <span className="text-muted-foreground">{match.team1.players.reduce((sum, p) => sum + p.assists, 0)} - {match.team2.players.reduce((sum, p) => sum + p.assists, 0)}</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-emerald-600 transition-all duration-500"
                        style={{ width: `${(match.team1.players.reduce((sum, p) => sum + p.assists, 0) / (match.team1.players.reduce((sum, p) => sum + p.assists, 0) + match.team2.players.reduce((sum, p) => sum + p.assists, 0))) * 100}%` }}
                      />
                      <div className="flex-1 bg-muted-foreground/30" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground">Average Headshot %</span>
                      <span className="text-muted-foreground">
                        {(match.team1.players.reduce((sum, p) => sum + p.headshots, 0) / match.team1.players.length).toFixed(1)}% - {(match.team2.players.reduce((sum, p) => sum + p.headshots, 0) / match.team2.players.length).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-amber-600 transition-all duration-500"
                        style={{ width: `${((match.team1.players.reduce((sum, p) => sum + p.headshots, 0) / match.team1.players.length) / ((match.team1.players.reduce((sum, p) => sum + p.headshots, 0) / match.team1.players.length) + (match.team2.players.reduce((sum, p) => sum + p.headshots, 0) / match.team2.players.length))) * 100}%` }}
                      />
                      <div className="flex-1 bg-muted-foreground/30" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scoreboard Tab */}
        <TabsContent value="scoreboard" className="space-y-6">
          {/* Team 1 Scoreboard */}
          <Card className="animate-fadeInLeft border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>{match.team1.name}</span>
                  {match.team1.won && <Crown className="h-5 w-5 text-amber-400" />}
                </div>
                <Badge className="bg-primary text-primary-foreground text-xl px-4">
                  {match.team1.score}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-muted-foreground">Player</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">K</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">D</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">A</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">HS%</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">ADR</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.team1.players.map((player, index) => (
                      <tr 
                        key={index}
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                          player.mvp ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {player.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground">{player.name}</span>
                              {player.mvp && (
                                <Crown className="h-4 w-4 text-amber-400" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2 font-medium text-foreground">{player.kills}</td>
                        <td className="text-center py-3 px-2 text-muted-foreground">{player.deaths}</td>
                        <td className="text-center py-3 px-2 text-muted-foreground">{player.assists}</td>
                        <td className="text-center py-3 px-2">
                          <Badge variant="secondary">{player.headshots}%</Badge>
                        </td>
                        <td className="text-center py-3 px-2 text-foreground">{player.adr}</td>
                        <td className="text-center py-3 px-2">
                          <Badge className={
                            player.rating >= 1.2 ? 'bg-emerald-600 text-white' :
                            player.rating >= 1.0 ? 'bg-primary text-primary-foreground' :
                            'bg-muted text-muted-foreground'
                          }>
                            {player.rating.toFixed(2)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Team 2 Scoreboard */}
          <Card className="animate-fadeInRight animate-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>{match.team2.name}</span>
                  {match.team2.won && <Crown className="h-5 w-5 text-amber-400" />}
                </div>
                <Badge variant="secondary" className="text-xl px-4">
                  {match.team2.score}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-muted-foreground">Player</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">K</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">D</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">A</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">HS%</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">ADR</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.team2.players.map((player, index) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                {player.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{player.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2 font-medium text-foreground">{player.kills}</td>
                        <td className="text-center py-3 px-2 text-muted-foreground">{player.deaths}</td>
                        <td className="text-center py-3 px-2 text-muted-foreground">{player.assists}</td>
                        <td className="text-center py-3 px-2">
                          <Badge variant="secondary">{player.headshots}%</Badge>
                        </td>
                        <td className="text-center py-3 px-2 text-foreground">{player.adr}</td>
                        <td className="text-center py-3 px-2">
                          <Badge className={
                            player.rating >= 1.2 ? 'bg-emerald-600 text-white' :
                            player.rating >= 1.0 ? 'bg-primary text-primary-foreground' :
                            'bg-muted text-muted-foreground'
                          }>
                            {player.rating.toFixed(2)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Round History Tab */}
        <TabsContent value="rounds" className="space-y-6">
          <Card className="animate-fadeInUp">
            <CardHeader>
              <CardTitle>Round Timeline</CardTitle>
              <CardDescription>Detailed round-by-round breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* First Half */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="outline">First Half</Badge>
                    <span className="text-sm text-muted-foreground">Rounds 1-15</span>
                  </div>
                  <div className="grid grid-cols-15 gap-1">
                    {match.rounds.slice(0, 15).map((round) => (
                      <div
                        key={round.number}
                        className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-pointer ${
                          round.winner === 'team1'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        title={`Round ${round.number}: ${round.winner === 'team1' ? match.team1.name : match.team2.name} won`}
                      >
                        {round.number}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Second Half */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="outline">Second Half</Badge>
                    <span className="text-sm text-muted-foreground">Rounds 16-{match.rounds.length}</span>
                  </div>
                  <div className="grid grid-cols-15 gap-1">
                    {match.rounds.slice(15).map((round) => (
                      <div
                        key={round.number}
                        className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-pointer ${
                          round.winner === 'team1'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        title={`Round ${round.number}: ${round.winner === 'team1' ? match.team1.name : match.team2.name} won`}
                      >
                        {round.number}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-6 text-sm pt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-primary" />
                    <span className="text-foreground">{match.team1.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <span className="text-foreground">{match.team2.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Highlights Tab */}
        <TabsContent value="highlights" className="space-y-6">
          <Card className="animate-fadeInUp">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-primary" />
                <span>Match Highlights</span>
              </CardTitle>
              <CardDescription>Key moments and exceptional plays</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {match.highlights.map((highlight, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Flame className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {highlight.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {highlight.player} • Round {highlight.round} • {highlight.timestamp}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Video className="h-4 w-4 mr-2" />
                      Watch
                    </Button>
                  </div>
                </div>
              ))}

              {/* VOD Section */}
              <Separator />
              
              <div className="p-6 rounded-lg border border-border bg-muted/30 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Video className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Full Match Replay</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Watch the complete match from any player's perspective
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Video className="h-4 w-4 mr-2" />
                    Watch Full Replay
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
