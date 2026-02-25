import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  User,
  Trophy,
  Gamepad2,
  Users,
  TrendingUp,
  Star,
  Shield,
  ArrowLeft,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  Crown,
  Target
} from 'lucide-react';

interface SearchResultsProps {
  onNavigate: (tab: string) => void;
  searchQuery?: string;
}

// Mock data - Replace with your actual data
const mockUsers = [
  {
    id: 1,
    username: 'EsportsLegend',
    avatar: 'EL',
    rank: 1,
    mmr: 3250,
    wins: 847,
    losses: 123,
    earnings: 12500,
    trustScore: 99.8,
    level: 87,
    tier: 'Elite',
    country: 'USA',
    games: ['Valorant', 'CS2', 'Fortnite'],
    isVerified: true,
    isOnline: true
  },
  {
    id: 2,
    username: 'ProGamerElite',
    avatar: 'PG',
    rank: 2,
    mmr: 3180,
    wins: 723,
    losses: 98,
    earnings: 9800,
    trustScore: 99.5,
    level: 76,
    tier: 'Elite',
    country: 'UK',
    games: ['CS2', 'Valorant'],
    isVerified: true,
    isOnline: false
  },
  {
    id: 3,
    username: 'SkillMasterX',
    avatar: 'SM',
    rank: 3,
    mmr: 3150,
    wins: 692,
    losses: 145,
    earnings: 8900,
    trustScore: 98.9,
    level: 72,
    tier: 'Elite',
    country: 'Canada',
    games: ['Valorant', 'Apex Legends'],
    isVerified: true,
    isOnline: true
  },
  {
    id: 4,
    username: 'TeamCaptain',
    avatar: 'TC',
    rank: 4,
    mmr: 3100,
    wins: 645,
    losses: 167,
    earnings: 7650,
    trustScore: 99.2,
    level: 68,
    tier: 'Master',
    country: 'Germany',
    games: ['CS2', 'Rainbow Six'],
    isVerified: false,
    isOnline: false
  },
  {
    id: 5,
    username: 'NinjaGamer',
    avatar: 'NG',
    rank: 12,
    mmr: 2850,
    wins: 534,
    losses: 189,
    earnings: 5240,
    trustScore: 97.8,
    level: 59,
    tier: 'Master',
    country: 'Brazil',
    games: ['Fortnite', 'Valorant'],
    isVerified: true,
    isOnline: true
  }
];

const mockLobbies = [
  {
    id: 1,
    title: 'CS2 Competitive 5v5',
    game: 'CS2',
    gameIcon: '🎮',
    stake: 50,
    players: '8/10',
    region: 'NA East',
    rank: 'Diamond+',
    time: '15 min',
    host: 'EsportsLegend',
    verified: true
  },
  {
    id: 2,
    title: 'Valorant Ranked Match',
    game: 'Valorant',
    gameIcon: '🎯',
    stake: 25,
    players: '6/10',
    region: 'EU West',
    rank: 'Platinum+',
    time: '30 min',
    host: 'ProGamerElite',
    verified: true
  },
  {
    id: 3,
    title: 'Fortnite Arena Duos',
    game: 'Fortnite',
    gameIcon: '⚡',
    stake: 100,
    players: '3/4',
    region: 'NA West',
    rank: 'Any',
    time: '45 min',
    host: 'SkillMasterX',
    verified: false
  }
];

const mockTournaments = [
  {
    id: 1,
    name: 'WannaBet? Championship',
    game: 'Valorant',
    prizePool: 10000,
    teams: 16,
    entryFee: 50,
    status: 'Live',
    startDate: 'Today'
  },
  {
    id: 2,
    name: 'CS2 Masters League',
    game: 'CS2',
    prizePool: 5000,
    teams: 8,
    entryFee: 25,
    status: 'Registration Open',
    startDate: 'Oct 5'
  },
  {
    id: 3,
    name: 'Fortnite Friday Finals',
    game: 'Fortnite',
    prizePool: 2500,
    teams: 32,
    entryFee: 10,
    status: 'Upcoming',
    startDate: 'Oct 10'
  }
];

const mockScrims = [
  {
    id: 1,
    title: 'Team Practice - High MMR Only',
    game: 'Valorant',
    mmr: 2500,
    players: '8/10',
    region: 'NA',
    time: 'Now'
  },
  {
    id: 2,
    title: 'CS2 Competitive Training',
    game: 'CS2',
    mmr: 2800,
    players: '6/10',
    region: 'EU',
    time: '20 min'
  }
];

export function SearchResults({ onNavigate, searchQuery = '' }: SearchResultsProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Filter results based on search query
  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchInput.toLowerCase()) ||
    user.games.some(game => game.toLowerCase().includes(searchInput.toLowerCase()))
  );

  const filteredLobbies = mockLobbies.filter(lobby =>
    lobby.title.toLowerCase().includes(searchInput.toLowerCase()) ||
    lobby.game.toLowerCase().includes(searchInput.toLowerCase())
  );

  const filteredTournaments = mockTournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    tournament.game.toLowerCase().includes(searchInput.toLowerCase())
  );

  const filteredScrims = mockScrims.filter(scrim =>
    scrim.title.toLowerCase().includes(searchInput.toLowerCase()) ||
    scrim.game.toLowerCase().includes(searchInput.toLowerCase())
  );

  const totalResults = filteredUsers.length + filteredLobbies.length + filteredTournaments.length + filteredScrims.length;

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('home')}
          className="hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <Badge variant="outline" className="text-xs">
          {totalResults} results found
        </Badge>
      </div>

      {/* Search Bar */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for players, lobbies, tournaments, scrims..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 bg-input-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="space-y-6">
        <div className="overflow-x-auto pb-2 flex items-center justify-center">
          <TabsList className="inline-flex min-w-full sm:grid sm:w-full sm:grid-cols-5 bg-muted/50 p-1">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 sm:px-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              All
              <Badge className="ml-2 bg-primary/20">{totalResults}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 sm:px-4"
            >
              <User className="h-4 w-4 mr-2" />
              Players
              <Badge className="ml-2 bg-primary/20">{filteredUsers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="lobbies"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 sm:px-4"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Lobbies
              <Badge className="ml-2 bg-primary/20">{filteredLobbies.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="tournaments"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 sm:px-4"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Tournaments
              <Badge className="ml-2 bg-primary/20">{filteredTournaments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="scrims"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 sm:px-4"
            >
              <Target className="h-4 w-4 mr-2" />
              Scrims
              <Badge className="ml-2 bg-primary/20">{filteredScrims.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* All Results */}
        <TabsContent value="all" className="space-y-6">
          {filteredUsers.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Players ({filteredUsers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.slice(0, 4).map((user, index) => (
                  <Card 
                    key={user.id} 
                    className="hover-lift cursor-pointer border-primary/30 animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => onNavigate(`profile-${user.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg`}>
                              <span className="text-white font-bold">{user.avatar}</span>
                            </div>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground truncate">{user.username}</h4>
                              {user.isVerified && (
                                <Shield className="h-4 w-4 text-blue-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge className={`text-xs ${user.tier === 'Elite' ? 'bg-amber-600' : 'bg-blue-600'} text-white`}>
                                {user.tier}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                #{user.rank} Global
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {user.country}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {user.games.slice(0, 3).map(game => (
                                <Badge key={game} variant="outline" className="text-xs">
                                  {game}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-muted-foreground">{user.mmr} MMR</span>
                              <span className="text-emerald-400">{user.wins}W-{user.losses}L</span>
                              <span className="flex items-center text-amber-400">
                                <Star className="h-3 w-3 mr-1" />
                                {user.trustScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-emerald-400">
                            ${user.earnings.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">earned</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredLobbies.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Gamepad2 className="h-5 w-5 mr-2 text-primary" />
                Open Lobbies ({filteredLobbies.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLobbies.map((lobby, index) => (
                  <Card 
                    key={lobby.id} 
                    className="hover-lift cursor-pointer animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => onNavigate('join-match')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{lobby.gameIcon}</span>
                          <div>
                            <h4 className="font-semibold text-foreground">{lobby.title}</h4>
                            <p className="text-xs text-muted-foreground">by {lobby.host}</p>
                          </div>
                        </div>
                        {lobby.verified && (
                          <Shield className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className="bg-emerald-600 text-white text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${lobby.stake}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {lobby.players}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {lobby.region}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{lobby.rank}</span>
                        <span className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {lobby.time}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredTournaments.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-primary" />
                Tournaments ({filteredTournaments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTournaments.map((tournament, index) => (
                  <Card 
                    key={tournament.id} 
                    className="hover-lift cursor-pointer animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => onNavigate('tournament-bracket')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{tournament.name}</h4>
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            {tournament.game}
                          </Badge>
                        </div>
                        <Badge 
                          className={`text-xs ${
                            tournament.status === 'Live' 
                              ? 'bg-emerald-600 text-white animate-pulse' 
                              : tournament.status === 'Registration Open'
                                ? 'bg-blue-600 text-white'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {tournament.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Prize Pool:</span>
                          <span className="font-bold text-amber-400">${tournament.prizePool.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Teams:</span>
                          <span className="text-foreground">{tournament.teams}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Entry Fee:</span>
                          <span className="text-foreground">${tournament.entryFee}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span className="text-foreground">{tournament.startDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Players Only */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user, index) => (
              <Card 
                key={user.id} 
                className="hover-lift cursor-pointer border-primary/30 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onNavigate(`profile-${user.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-bold">{user.avatar}</span>
                        </div>
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">{user.username}</h4>
                          {user.isVerified && (
                            <Shield className="h-4 w-4 text-blue-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`text-xs ${user.tier === 'Elite' ? 'bg-amber-600' : 'bg-blue-600'} text-white`}>
                            {user.tier}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            #{user.rank} Global
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {user.country}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {user.games.slice(0, 3).map(game => (
                            <Badge key={game} variant="outline" className="text-xs">
                              {game}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">{user.mmr} MMR</span>
                          <span className="text-emerald-400">{user.wins}W-{user.losses}L</span>
                          <span className="flex items-center text-amber-400">
                            <Star className="h-3 w-3 mr-1" />
                            {user.trustScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-400">
                        ${user.earnings.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">earned</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other tabs similar structure */}
        <TabsContent value="lobbies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLobbies.map((lobby, index) => (
              <Card 
                key={lobby.id} 
                className="hover-lift cursor-pointer animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onNavigate('join-match')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{lobby.gameIcon}</span>
                      <div>
                        <h4 className="font-semibold text-foreground">{lobby.title}</h4>
                        <p className="text-xs text-muted-foreground">by {lobby.host}</p>
                      </div>
                    </div>
                    {lobby.verified && (
                      <Shield className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-emerald-600 text-white text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${lobby.stake}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {lobby.players}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {lobby.region}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{lobby.rank}</span>
                    <span className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {lobby.time}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTournaments.map((tournament, index) => (
              <Card 
                key={tournament.id} 
                className="hover-lift cursor-pointer animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onNavigate('tournament-bracket')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{tournament.name}</h4>
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {tournament.game}
                      </Badge>
                    </div>
                    <Badge 
                      className={`text-xs ${
                        tournament.status === 'Live' 
                          ? 'bg-emerald-600 text-white animate-pulse' 
                          : tournament.status === 'Registration Open'
                            ? 'bg-blue-600 text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tournament.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Prize Pool:</span>
                      <span className="font-bold text-amber-400">${tournament.prizePool.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Teams:</span>
                      <span className="text-foreground">{tournament.teams}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Entry Fee:</span>
                      <span className="text-foreground">${tournament.entryFee}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="text-foreground">{tournament.startDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scrims" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScrims.map((scrim, index) => (
              <Card 
                key={scrim.id} 
                className="hover-lift cursor-pointer animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-3">{scrim.title}</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-blue-600 text-white text-xs">
                      {scrim.game}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {scrim.mmr}+ MMR
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {scrim.players}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {scrim.region}
                    </span>
                    <span className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {scrim.time}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* No Results */}
      {totalResults === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
