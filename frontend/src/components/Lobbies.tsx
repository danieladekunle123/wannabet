import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, Users, DollarSign, MapPin, Shield, Star, Filter, Search, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { InfoDialog } from './InfoDialog';

interface Lobby {
  id: string;
  game: string;
  gameImage: string;
  mode: string;
  stake: number;
  region: string;
  trustScore: number;
  timeLeft: string;
  players: { current: number; max: number };
  host: string;
  rules: string[];
}

interface LobbiesProps {
  onNavigate?: (tab: string) => void;
}

export function Lobbies({ onNavigate }: LobbiesProps = {}) {
  const [gameFilter, setGameFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [stakeFilter, setStakeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // More Filters state
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [playerCountFilter, setPlayerCountFilter] = useState<string[]>([]);
  const [trustScoreMin, setTrustScoreMin] = useState([85]);
  const [rankFilter, setRankFilter] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState<string[]>([]);
  const [timeLeftFilter, setTimeLeftFilter] = useState('all');

  const lobbies: Lobby[] = [
    {
      id: '1',
      game: 'Valorant',
      gameImage: 'https://images.unsplash.com/photo-1622349851524-890cc3641b87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcHMlMjBnYW1pbmclMjB2YWxvcmFudHxlbnwxfHx8fDE3NTkwODYwOTZ8MA&ixlib=rb-4.1.0&q=80&w=400',
      mode: 'Ranked 1v1',
      stake: 50,
      region: 'NA East',
      trustScore: 98.5,
      timeLeft: '4m 23s',
      players: { current: 1, max: 2 },
      host: 'ProGamer23',
      rules: ['Best of 3', 'No smurfing', 'Ascendant+']
    },
    {
      id: '2',
      game: 'CS2',
      gameImage: 'https://images.unsplash.com/photo-1758179762049-615d9aac58ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwdG91cm5hbWVudHxlbnwxfHx8fDE3NTkwODYwOTB8MA&ixlib=rb-4.1.0&q=80&w=400',
      mode: '5v5 Competitive',
      stake: 200,
      region: 'EU West',
      trustScore: 94.2,
      timeLeft: '12m 15s',
      players: { current: 8, max: 10 },
      host: 'TeamAlpha',
      rules: ['MR12', 'All pick', 'Global Elite+']
    },
    {
      id: '3',
      game: 'League of Legends',
      gameImage: 'https://images.unsplash.com/photo-1614738499301-d2eed34f7b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JhJTIwZ2FtaW5nJTIwbGVhZ3VlfGVufDF8fHx8MTc1OTA4NjEwMHww&ixlib=rb-4.1.0&q=80&w=400',
      mode: 'Ranked Solo',
      stake: 25,
      region: 'NA West',
      trustScore: 96.8,
      timeLeft: '2m 47s',
      players: { current: 1, max: 2 },
      host: 'MidLaneKing',
      rules: ['Best of 1', 'Draft pick', 'Diamond+']
    },
    {
      id: '4',
      game: 'Valorant',
      gameImage: 'https://images.unsplash.com/photo-1622349851524-890cc3641b87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcHMlMjBnYW1pbmclMjB2YWxvcmFudHxlbnwxfHx8fDE3NTkwODYwOTZ8MA&ixlib=rb-4.1.0&q=80&w=400',
      mode: 'Team 5v5',
      stake: 100,
      region: 'Asia',
      trustScore: 99.1,
      timeLeft: '8m 52s',
      players: { current: 7, max: 10 },
      host: 'EsportsClub',
      rules: ['Best of 3', 'Custom map pool', 'Immortal+']
    },
    {
      id: '5',
      game: 'CS2',
      gameImage: 'https://images.unsplash.com/photo-1758179762049-615d9aac58ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwdG91cm5hbWVudHxlbnwxfHx8fDE3NTkwODYwOTB8MA&ixlib=rb-4.1.0&q=80&w=400',
      mode: 'Aim Duel',
      stake: 15,
      region: 'EU Central',
      trustScore: 92.3,
      timeLeft: '6m 31s',
      players: { current: 1, max: 2 },
      host: 'AimGod',
      rules: ['First to 16', 'Aim_map2', 'Any rank']
    },
    {
      id: '6',
      game: 'League of Legends',
      gameImage: 'https://images.unsplash.com/photo-1614738499301-d2eed34f7b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JhJTIwZ2FtaW5nJTIwbGVhZ3VlfGVufDF8fHx8MTc1OTA4NjEwMHww&ixlib=rb-4.1.0&q=80&w=400',
      mode: 'ARAM',
      stake: 10,
      region: 'NA East',
      trustScore: 89.7,
      timeLeft: '14m 05s',
      players: { current: 6, max: 10 },
      host: 'ARAMChamp',
      rules: ['Best of 1', 'Random champs', 'Any rank']
    },
    {
      id: '7',
      game: 'Valorant',
      gameImage: 'https://images.unsplash.com/photo-1622349851524-890cc3641b87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcHMlMjBnYW1pbmclMjB2YWxvcmFudHxlbnwxfHx8fDE3NTkwODYwOTZ8MA&ixlib=rb-4.1.0&q=80&w=400',
      mode: 'Spike Rush',
      stake: 20,
      region: 'NA East',
      trustScore: 95.4,
      timeLeft: '3m 12s',
      players: { current: 4, max: 10 },
      host: 'SpeedRunner',
      rules: ['Best of 1', 'Quick match', 'Any rank']
    },
    {
      id: '8',
      game: 'CS2',
      gameImage: 'https://images.unsplash.com/photo-1758179762049-615d9aac58ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwdG91cm5hbWVudHxlbnwxfHx8fDE3NTkwODYwOTB8MA&ixlib=rb-4.1.0&q=80&w=400',
      mode: 'Wingman 2v2',
      stake: 75,
      region: 'NA West',
      trustScore: 97.8,
      timeLeft: '5m 40s',
      players: { current: 2, max: 4 },
      host: 'DuoKings',
      rules: ['Best of 3', 'MR9', 'Supreme+']
    },
    {
      id: '9',
      game: 'League of Legends',
      gameImage: 'https://images.unsplash.com/photo-1614738499301-d2eed34f7b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JhJTIwZ2FtaW5nJTIwbGVhZ3VlfGVufDF8fHx8MTc1OTA4NjEwMHww&ixlib=rb-4.1.0&q=80&w=400',
      mode: 'Ranked Flex',
      stake: 150,
      region: 'EU West',
      trustScore: 98.9,
      timeLeft: '10m 22s',
      players: { current: 8, max: 10 },
      host: 'TeamSynergy',
      rules: ['Best of 1', 'Draft pick', 'Master+']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Browse All Lobbies</h2>
            <p className="text-muted-foreground">Find the perfect match and start competing</p>
          </div>
          <InfoDialog
            title="About Lobbies"
            description="Lobbies are quick competitive matches where players compete for real money. Browse available games, choose your stake level, and join matches that fit your skill level."
            tips={[
              "Check the host's trust score before joining - higher is better",
              "Start with lower stakes while learning the platform",
              "Read the lobby rules carefully before committing",
              "Make sure you meet the rank requirements to avoid disputes"
            ]}
          />
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span>143 active lobbies</span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-primary/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by game, mode, or host..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="na-east">NA East</SelectItem>
                <SelectItem value="na-west">NA West</SelectItem>
                <SelectItem value="eu-west">EU West</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stakeFilter} onValueChange={setStakeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stake Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stakes</SelectItem>
                <SelectItem value="low">$1 - $25</SelectItem>
                <SelectItem value="mid">$26 - $100</SelectItem>
                <SelectItem value="high">$100+</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={showMoreFilters} onOpenChange={setShowMoreFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-primary/50 hover:bg-primary/10"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                  {(playerCountFilter.length > 0 || rankFilter.length > 0 || formatFilter.length > 0 || timeLeftFilter !== 'all' || trustScoreMin[0] > 85) && (
                    <Badge className="ml-2 bg-primary text-primary-foreground text-xs px-1.5">
                      {[
                        playerCountFilter.length > 0,
                        rankFilter.length > 0,
                        formatFilter.length > 0,
                        timeLeftFilter !== 'all',
                        trustScoreMin[0] > 85
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">More Filters</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setPlayerCountFilter([]);
                        setTrustScoreMin([85]);
                        setRankFilter([]);
                        setFormatFilter([]);
                        setTimeLeftFilter('all');
                      }}
                    >
                      Reset All
                    </Button>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 mobile-scrollable-filters">

                  {/* Player Count Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm">Player Count</Label>
                    <div className="space-y-2">
                      {['1v1', '2v2', '5v5', '10 Players'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`player-${option}`}
                            checked={playerCountFilter.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPlayerCountFilter([...playerCountFilter, option]);
                              } else {
                                setPlayerCountFilter(playerCountFilter.filter(f => f !== option));
                              }
                            }}
                          />
                          <label
                            htmlFor={`player-${option}`}
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Trust Score Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Minimum Trust Score</Label>
                      <span className="text-sm text-amber-400 font-medium">{trustScoreMin[0]}%</span>
                    </div>
                    <Slider
                      value={trustScoreMin}
                      onValueChange={setTrustScoreMin}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Rank Requirements */}
                  <div className="space-y-2">
                    <Label className="text-sm">Rank Requirements</Label>
                    <div className="space-y-2">
                      {['Any Rank', 'Diamond+', 'Immortal+', 'Radiant'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rank-${option}`}
                            checked={rankFilter.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setRankFilter([...rankFilter, option]);
                              } else {
                                setRankFilter(rankFilter.filter(f => f !== option));
                              }
                            }}
                          />
                          <label
                            htmlFor={`rank-${option}`}
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Match Format */}
                  <div className="space-y-2">
                    <Label className="text-sm">Match Format</Label>
                    <div className="space-y-2">
                      {['Best of 1', 'Best of 3', 'Best of 5'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`format-${option}`}
                            checked={formatFilter.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormatFilter([...formatFilter, option]);
                              } else {
                                setFormatFilter(formatFilter.filter(f => f !== option));
                              }
                            }}
                          />
                          <label
                            htmlFor={`format-${option}`}
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Time Left Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm">Time Left to Join</Label>
                    <Select value={timeLeftFilter} onValueChange={setTimeLeftFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Times</SelectItem>
                        <SelectItem value="urgent">&lt; 5 minutes</SelectItem>
                        <SelectItem value="soon">5 - 10 minutes</SelectItem>
                        <SelectItem value="later">&gt; 10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowMoreFilters(false)}
                    >
                      Close
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => {
                        setShowMoreFilters(false);
                        // Apply filters logic would go here
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Lobbies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lobbies.map((lobby) => (
          <Card key={lobby.id} className="group hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 flex flex-col">
            <CardHeader className="p-0">
              <div className="relative">
                <ImageWithFallback 
                  src={lobby.gameImage}
                  alt={lobby.game}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-card/90 text-foreground border-primary/30">
                    {lobby.game}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary text-primary-foreground">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {lobby.stake}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{lobby.mode}</h3>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{lobby.timeLeft}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{lobby.players.current}/{lobby.players.max}</span>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{lobby.region}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Host: {lobby.host}</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-amber-400" />
                  <span className="text-amber-400 font-medium">{lobby.trustScore}%</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {lobby.rules.slice(0, 2).map((rule, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {rule}
                  </Badge>
                ))}
                {lobby.rules.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{lobby.rules.length - 2}
                  </Badge>
                )}
              </div>

              <Button 
                className="w-full bg-primary hover:brightness-110 hover:scale-[1.02] text-primary-foreground group-hover:shadow-md transition-all duration-200 mt-auto"
                onClick={() => onNavigate?.('join-match')}
              >
                Join Match
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}