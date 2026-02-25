import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Crown, Trophy, Star, TrendingUp, DollarSign, Target, Users, Medal, Flame } from 'lucide-react';

interface LeaderboardPlayer {
  rank: number;
  name: string;
  wins: number;
  losses: number;
  mmr: number;
  earnings: number;
  trustScore: number;
  games: string[];
  streak: number;
  isCurrentUser?: boolean;
}

export function Leaderboards() {
  const [gameFilter, setGameFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [regionFilter, setRegionFilter] = useState('all');

  const globalLeaderboard: LeaderboardPlayer[] = [
    { 
      rank: 1, 
      name: 'EsportsLegend', 
      wins: 847, 
      losses: 23, 
      mmr: 3250, 
      earnings: 125000, 
      trustScore: 99.8, 
      games: ['Valorant', 'CS2'],
      streak: 47
    },
    { 
      rank: 2, 
      name: 'ProGamerElite', 
      wins: 723, 
      losses: 41, 
      mmr: 3180, 
      earnings: 98000, 
      trustScore: 99.5, 
      games: ['Valorant'],
      streak: 23
    },
    { 
      rank: 3, 
      name: 'SkillMasterX', 
      wins: 692, 
      losses: 38, 
      mmr: 3150, 
      earnings: 89000, 
      trustScore: 98.9, 
      games: ['CS2', 'LoL'],
      streak: 31
    },
    { 
      rank: 4, 
      name: 'TeamCaptain', 
      wins: 645, 
      losses: 45, 
      mmr: 3100, 
      earnings: 76500, 
      trustScore: 99.2, 
      games: ['Valorant', 'CS2', 'LoL'],
      streak: 12
    },
    { 
      rank: 5, 
      name: 'AimGodPro', 
      wins: 612, 
      losses: 52, 
      mmr: 3080, 
      earnings: 71200, 
      trustScore: 98.7, 
      games: ['CS2'],
      streak: 19
    },
    { 
      rank: 42, 
      name: 'YouAreHere', 
      wins: 127, 
      losses: 23, 
      mmr: 2450, 
      earnings: 12400, 
      trustScore: 98.5, 
      games: ['Valorant'],
      streak: 8,
      isCurrentUser: true
    }
  ];

  const tournamentWinners: LeaderboardPlayer[] = [
    { 
      rank: 1, 
      name: 'TournamentKing', 
      wins: 45, 
      losses: 3, 
      mmr: 3100, 
      earnings: 35000, 
      trustScore: 99.6, 
      games: ['Valorant'],
      streak: 12
    },
    { 
      rank: 2, 
      name: 'ChampionAce', 
      wins: 38, 
      losses: 5, 
      mmr: 2950, 
      earnings: 28500, 
      trustScore: 99.1, 
      games: ['CS2'],
      streak: 8
    },
    { 
      rank: 3, 
      name: 'VictorySeeker', 
      wins: 31, 
      losses: 7, 
      mmr: 2850, 
      earnings: 22300, 
      trustScore: 98.8, 
      games: ['LoL'],
      streak: 5
    }
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
    if (rank <= 10) return 'bg-gradient-to-r from-primary/80 to-primary text-primary-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getWinRate = (wins: number, losses: number) => {
    return ((wins / (wins + losses)) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Leaderboards</h1>
          <p className="text-muted-foreground">See how you rank against the best players</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-emerald-600 text-white">
            <Users className="h-3 w-3 mr-1" />
            25,847 Players
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            <SelectItem value="valorant">Valorant</SelectItem>
            <SelectItem value="cs2">CS2</SelectItem>
            <SelectItem value="lol">League of Legends</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="daily">Today</SelectItem>
          </SelectContent>
        </Select>

        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Global</SelectItem>
            <SelectItem value="na">North America</SelectItem>
            <SelectItem value="eu">Europe</SelectItem>
            <SelectItem value="asia">Asia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="global" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Trophy className="h-4 w-4 mr-2" />
            Global
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Crown className="h-4 w-4 mr-2" />
            Tournaments
          </TabsTrigger>
          <TabsTrigger value="earnings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            Earnings
          </TabsTrigger>
          <TabsTrigger value="trust" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Star className="h-4 w-4 mr-2" />
            Trust Score
          </TabsTrigger>
        </TabsList>

        {/* Global Leaderboard */}
        <TabsContent value="global" className="space-y-4">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {globalLeaderboard.slice(0, 3).map((player, index) => (
              <Card key={player.rank} className={`${index === 0 ? 'md:order-2 border-amber-400/50' : index === 1 ? 'md:order-1' : 'md:order-3'} hover:border-primary/50 transition-all duration-200`}>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    {getRankBadge(player.rank)}
                  </div>
                  <Avatar className="h-16 w-16 mx-auto mb-4">
                    <AvatarFallback className="bg-primary/20 text-primary text-xl">
                      {player.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-foreground mb-2">{player.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MMR:</span>
                      <span className="text-foreground font-medium">{player.mmr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">W/L:</span>
                      <span className="text-foreground font-medium">{player.wins}/{player.losses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Earnings:</span>
                      <span className="text-emerald-400 font-medium">${player.earnings.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Global Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {globalLeaderboard.map((player) => (
                  <div 
                    key={player.rank} 
                    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                      player.isCurrentUser 
                        ? 'bg-primary/10 border border-primary/30 hover:bg-primary/15' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(player.rank)}`}>
                        {player.rank <= 3 ? getRankBadge(player.rank) : <span className="font-bold">#{player.rank}</span>}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${player.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {player.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium ${player.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                            {player.name}
                          </h3>
                          {player.isCurrentUser && (
                            <Badge className="bg-primary text-primary-foreground text-xs">You</Badge>
                          )}
                          {player.streak >= 10 && (
                            <Badge className="bg-amber-600 text-white text-xs">
                              <Flame className="h-3 w-3 mr-1" />
                              {player.streak}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{player.wins}W - {player.losses}L ({getWinRate(player.wins, player.losses)}%)</span>
                          <div className="flex space-x-1">
                            {player.games.map((game, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {game}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <div className="font-semibold text-foreground">{player.mmr}</div>
                        <div className="text-xs text-muted-foreground">MMR</div>
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-400">${player.earnings.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Earned</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-amber-400" />
                        <span className="font-medium text-amber-400">{player.trustScore}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tournament Champions */}
        <TabsContent value="tournaments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Champions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tournamentWinners.map((player) => (
                  <div key={player.rank} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(player.rank)}`}>
                        {getRankBadge(player.rank)}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-amber-600/20 text-amber-400">
                          {player.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-medium text-foreground">{player.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{player.wins} Tournament Wins</span>
                          <div className="flex space-x-1">
                            {player.games.map((game, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {game}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <div className="font-semibold text-foreground">{player.wins}</div>
                        <div className="text-xs text-muted-foreground">Wins</div>
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-400">${player.earnings.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Prize Money</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span className="font-medium text-amber-400">{player.wins}/{player.wins + player.losses}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would follow similar patterns */}
        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Earnings Leaderboard</h3>
              <p className="text-muted-foreground">Coming soon - track top earners across all games and tournaments</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trust" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Trust Score Rankings</h3>
              <p className="text-muted-foreground">Coming soon - discover the most trusted players in the community</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}