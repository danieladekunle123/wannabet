import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, Users, DollarSign, MapPin, Shield, Star, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

interface OpenLobbiesProps {
  onNavigate?: (tab: string) => void;
  showSeeAll?: boolean;
}

export function OpenLobbies({ onNavigate, showSeeAll = false }: OpenLobbiesProps) {
  const [gameFilter, setGameFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [stakeFilter, setStakeFilter] = useState('all');

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
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with See All */}
      {showSeeAll && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Open Lobbies</h2>
            <p className="text-sm md:text-base text-muted-foreground">Join live matches with active players</p>
          </div>
          <Button
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10 hover:scale-105 transition-all duration-200 self-end sm:self-auto"
            onClick={() => onNavigate?.('lobbies')}
          >
            See All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4">
          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
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
            <SelectTrigger className="w-full sm:w-40">
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
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Stake Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stakes</SelectItem>
              <SelectItem value="low">$1 - $25</SelectItem>
              <SelectItem value="mid">$26 - $100</SelectItem>
              <SelectItem value="high">$100+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span>143 active lobbies</span>
        </div>
      </div>

      {/* Lobbies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {lobbies.map((lobby, index) => (
          <Card key={lobby.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 flex flex-col hover-lift animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
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
            <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm sm:text-base text-foreground truncate pr-2">{lobby.mode}</h3>
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{lobby.timeLeft}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{lobby.players.current}/{lobby.players.max}</span>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{lobby.region}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground truncate pr-2">Host: {lobby.host}</span>
                <div className="flex items-center space-x-1 shrink-0">
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
                className="w-full bg-primary hover:brightness-110 hover:scale-105 text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/30 transition-all duration-300 mt-auto"
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