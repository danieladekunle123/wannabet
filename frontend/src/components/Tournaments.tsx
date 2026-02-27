import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from './AuthContext';

interface TournamentsProps {
  onNavigate?: (tab: string) => void;
  showSeeAll?: boolean;
}

export function Tournaments({ onNavigate, showSeeAll }: TournamentsProps = {}) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getTournaments();
      setTournaments(data.tournaments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async (id: string) => {
    try {
      await api.joinTournament(id);
      await refreshUser?.();
      load();
      alert('Joined tournament');
    } catch (err: any) {
      alert(err?.message || 'Failed to join');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tournaments</h2>
      {loading && <div>Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t.name}</span>
                <span className="text-sm text-muted-foreground">{t.game}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm">Entry: ${t.entryFee}</div>
                <Button onClick={() => handleJoin(t.id)} size="sm">Join</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Tournaments;
import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Trophy, Users, DollarSign, Calendar, Lock, Globe, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { InfoDialog } from './InfoDialog';

interface Tournament {
  id: string;
  name: string;
  game: string;
  gameImage: string;
  type: 'public' | 'invite';
  entryFee: number;
  prizePool: number;
  startTime: string;
  entrants: { current: number; max: number };
  format: string;
  organizer: string;
  featured?: boolean;
}

interface TournamentsProps {
  onNavigate?: (tab: string) => void;
  showSeeAll?: boolean;
}

export function Tournaments({ onNavigate, showSeeAll = false }: TournamentsProps) {
  const tournaments: Tournament[] = [
    {
      id: '1',
      name: 'Valorant Champions Weekly',
      game: 'Valorant',
      gameImage: 'https://images.unsplash.com/photo-1622349851524-890cc3641b87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcHMlMjBnYW1pbmclMjB2YWxvcmFudHxlbnwxfHx8fDE3NTkwODYwOTZ8MA&ixlib=rb-4.1.0&q=80&w=400',
      type: 'public',
      entryFee: 25,
      prizePool: 2500,
      startTime: '2h 30m',
      entrants: { current: 47, max: 64 },
      format: 'Single Elimination',
      organizer: 'WannaBet? Official',
      featured: true
    },
    {
      id: '2',
      name: 'CS2 Pro League',
      game: 'CS2',
      gameImage: 'https://images.unsplash.com/photo-1758179762049-615d9aac58ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwdG91cm5hbWVudHxlbnwxfHx8fDE3NTkwODYwOTB8MA&ixlib=rb-4.1.0&q=80&w=400',
      type: 'invite',
      entryFee: 100,
      prizePool: 5000,
      startTime: 'Tomorrow 6PM',
      entrants: { current: 12, max: 16 },
      format: 'Double Elimination',
      organizer: 'EliteEsports'
    },
    {
      id: '3',
      name: 'LoL Rift Royale',
      game: 'League of Legends',
      gameImage: 'https://images.unsplash.com/photo-1614738499301-d2eed34f7b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JhJTIwZ2FtaW5nJTIwbGVhZ3VlfGVufDF8fHx8MTc1OTA4NjEwMHww&ixlib=rb-4.1.0&q=80&w=400',
      type: 'public',
      entryFee: 15,
      prizePool: 960,
      startTime: '45m',
      entrants: { current: 28, max: 32 },
      format: 'Single Elimination',
      organizer: 'RiftMasters'
    },
    {
      id: '4',
      name: 'Valorant Aim Championship',
      game: 'Valorant',
      gameImage: 'https://images.unsplash.com/photo-1622349851524-890cc3641b87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcHMlMjBnYW1pbmclMjB2YWxvcmFudHxlbnwxfHx8fDE3NTkwODYwOTZ8MA&ixlib=rb-4.1.0&q=80&w=400',
      type: 'public',
      entryFee: 10,
      prizePool: 640,
      startTime: '1h 15m',
      entrants: { current: 56, max: 64 },
      format: 'Swiss System',
      organizer: 'AimAcademy'
    },
    {
      id: '5',
      name: 'CS2 Major Qualifier',
      game: 'CS2',
      gameImage: 'https://images.unsplash.com/photo-1758179762049-615d9aac58ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwdG91cm5hbWVudHxlbnwxfHx8fDE3NTkwODYwOTB8MA&ixlib=rb-4.1.0&q=80&w=400',
      type: 'invite',
      entryFee: 50,
      prizePool: 1600,
      startTime: '3h 45m',
      entrants: { current: 24, max: 32 },
      format: 'Group Stage + Playoffs',
      organizer: 'ProTournaments'
    },
    {
      id: '6',
      name: 'LoL Clash Cup',
      game: 'League of Legends',
      gameImage: 'https://images.unsplash.com/photo-1614738499301-d2eed34f7b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JhJTIwZ2FtaW5nJTIwbGVhZ3VlfGVufDF8fHx8MTc1OTA4NjEwMHww&ixlib=rb-4.1.0&q=80&w=400',
      type: 'public',
      entryFee: 20,
      prizePool: 1280,
      startTime: '6h 20m',
      entrants: { current: 41, max: 64 },
      format: 'Single Elimination',
      organizer: 'ClashTourneys'
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Active Tournaments</h2>
            <p className="text-sm md:text-base text-muted-foreground">Join competitive tournaments with guaranteed prize pools</p>
          </div>
          <InfoDialog
            title="About Tournaments"
            description="Tournaments are structured competitions with multiple rounds and guaranteed prize pools. Compete against many players in elimination-style brackets for a chance at big rewards."
            tips={[
              "Entry fees are collected upfront and distributed to winners",
              "Check the tournament format - Single Elimination, Double Elimination, or Round Robin",
              "Register early - spots fill up fast for popular tournaments",
              "Prize distribution is shown before you join - higher placements earn more",
              "Be ready to play at the scheduled start time or risk forfeit"
            ]}
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
          {showSeeAll && (
            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:scale-105 transition-all duration-200 text-sm"
              onClick={() => onNavigate?.('tournaments')}
            >
              See All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
            onClick={() => onNavigate?.('create-tournament')}
          >
            <span className="hidden sm:inline">Create Tournament</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Featured Tournament */}
      {tournaments.find(t => t.featured) && (
        <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              <Badge className="bg-amber-600 text-white text-xs sm:text-sm">Featured</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  {tournaments.find(t => t.featured)?.name}
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Prize Pool: ${tournaments.find(t => t.featured)?.prizePool}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{tournaments.find(t => t.featured)?.entrants.current}/{tournaments.find(t => t.featured)?.entrants.max} players</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Starts in {tournaments.find(t => t.featured)?.startTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-start md:justify-end">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base w-full md:w-auto"
                  onClick={() => onNavigate?.('join-tournament')}
                >
                  Join Tournament - ${tournaments.find(t => t.featured)?.entryFee}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {tournaments.filter(t => !t.featured).map((tournament, index) => (
          <Card key={tournament.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 flex flex-col hover-lift animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="p-0">
              <div className="relative">
                <ImageWithFallback 
                  src={tournament.gameImage}
                  alt={tournament.game}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-card/90 text-foreground border-primary/30">
                    {tournament.game}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  {tournament.type === 'invite' ? (
                    <Badge className="bg-amber-600 text-white">
                      <Lock className="h-3 w-3 mr-1" />
                      Invite Only
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-600 text-white">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex flex-col flex-1">
              <div>
                <h3 className="font-medium text-sm sm:text-base text-foreground mb-1 truncate">{tournament.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">by {tournament.organizer}</p>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <DollarSign className="h-3 w-3" />
                    <span>Prize: ${tournament.prizePool}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{tournament.entrants.current}/{tournament.entrants.max}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 text-muted-foreground min-w-0 flex-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="truncate">{tournament.startTime}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {tournament.format}
                  </Badge>
                </div>
              </div>

              <div className="flex space-x-2 mt-auto">
                <Button 
                  className={`flex-1 text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/30 transition-all duration-300 ${
                    tournament.type === 'invite' 
                      ? 'bg-primary/50 hover:bg-primary/50' 
                      : 'bg-primary hover:brightness-110 hover:scale-105'
                  }`}
                  disabled={tournament.type === 'invite'}
                  onClick={() => tournament.type !== 'invite' && onNavigate?.('join-tournament')}
                >
                  {tournament.type === 'invite' ? 'View Bracket' : `Join - ${tournament.entryFee}`}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-primary/50 hover:bg-primary/10 hover:scale-110 hover:rotate-12 transition-all duration-300"
                  onClick={() => onNavigate?.('tournament-bracket')}
                >
                  <Trophy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}