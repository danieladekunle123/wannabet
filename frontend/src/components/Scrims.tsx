import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Swords, Users, Trophy, Star, DollarSign, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { InfoDialog } from './InfoDialog';

interface Scrim {
  id: string;
  title: string;
  game: string;
  gameImage: string;
  teamA: { name: string; logo?: string; mmr: number };
  teamB?: { name: string; logo?: string; mmr: number };
  rules: string;
  stake?: number;
  mmrGate: number;
  status: 'looking' | 'matched';
  createdBy: string;
  trustScore: number;
}

interface ScrimsProps {
  onNavigate?: (tab: string) => void;
  showSeeAll?: boolean;
}

export function Scrims({ onNavigate, showSeeAll = false }: ScrimsProps) {
  const scrims: Scrim[] = [
    {
      id: '1',
      title: 'High MMR Valorant Scrim',
      game: 'Valorant',
      gameImage: 'https://images.unsplash.com/photo-1622349851524-890cc3641b87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcHMlMjBnYW1pbmclMjB2YWxvcmFudHxlbnwxfHx8fDE3NTkwODYwOTZ8MA&ixlib=rb-4.1.0&q=80&w=400',
      teamA: { name: 'Team Phoenix', mmr: 2450 },
      rules: 'Best of 3',
      stake: 50,
      mmrGate: 2200,
      status: 'looking',
      createdBy: 'PhoenixCaptain',
      trustScore: 97.2
    },
    {
      id: '2',
      title: 'CS2 Practice Match',
      game: 'CS2',
      gameImage: 'https://images.unsplash.com/photo-1758179762049-615d9aac58ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwdG91cm5hbWVudHxlbnwxfHx8fDE3NTkwODYwOTB8MA&ixlib=rb-4.1.0&q=80&w=400',
      teamA: { name: 'Alpha Squad', mmr: 2100 },
      teamB: { name: 'Beta Force', mmr: 2050 },
      rules: 'Best of 1 (MR12)',
      mmrGate: 1800,
      status: 'matched',
      createdBy: 'AlphaLeader',
      trustScore: 94.8
    },
    {
      id: '3',
      title: 'LoL Ranked Team Practice',
      game: 'League of Legends',
      gameImage: 'https://images.unsplash.com/photo-1614738499301-d2eed34f7b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JhJTIwZ2FtaW5nJTIwbGVhZ3VlfGVufDF8fHx8MTc1OTA4NjEwMHww&ixlib=rb-4.1.0&q=80&w=400',
      teamA: { name: 'Rift Guardians', mmr: 1950 },
      rules: 'Best of 1 (Draft)',
      stake: 25,
      mmrGate: 1700,
      status: 'looking',
      createdBy: 'GuardianCap',
      trustScore: 96.5
    },
    {
      id: '4',
      title: 'Valorant Aim Training Duel',
      game: 'Valorant',
      gameImage: 'https://images.unsplash.com/photo-1622349851524-890cc3641b87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcHMlMjBnYW1pbmclMjB2YWxvcmFudHxlbnwxfHx8fDE3NTkwODYwOTZ8MA&ixlib=rb-4.1.0&q=80&w=400',
      teamA: { name: 'AimMaster', mmr: 2800 },
      teamB: { name: 'HeadHunter', mmr: 2750 },
      rules: 'First to 21 (Aim map)',
      stake: 15,
      mmrGate: 2500,
      status: 'matched',
      createdBy: 'AimMaster',
      trustScore: 99.1
    },
    {
      id: '5',
      title: 'CS2 Strat Practice',
      game: 'CS2',
      gameImage: 'https://images.unsplash.com/photo-1758179762049-615d9aac58ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwZ2FtaW5nJTIwdG91cm5hbWVudHxlbnwxfHx8fDE3NTkwODYwOTB8MA&ixlib=rb-4.1.0&q=80&w=400',
      teamA: { name: 'Tactical Legends', mmr: 2300 },
      rules: 'Best of 3 (Custom maps)',
      mmrGate: 2000,
      status: 'looking',
      createdBy: 'StratMaster',
      trustScore: 93.7
    },
    {
      id: '6',
      title: 'LoL Mid Lane Showdown',
      game: 'League of Legends',
      gameImage: 'https://images.unsplash.com/photo-1614738499301-d2eed34f7b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JhJTIwZ2FtaW5nJTIwbGVhZ3VlfGVufDF8fHx8MTc1OTA4NjEwMHww&ixlib=rb-4.1.0&q=80&w=400',
      teamA: { name: 'MidKingdom', mmr: 2150 },
      rules: '1v1 Mid (First blood/100 CS)',
      stake: 10,
      mmrGate: 1800,
      status: 'looking',
      createdBy: 'MidLaneKing',
      trustScore: 91.3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'looking': return 'bg-blue-600 text-white';
      case 'matched': return 'bg-amber-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'looking': return 'Looking for Opponent';
      case 'matched': return 'Match Found';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Practice Scrims</h2>
            <p className="text-muted-foreground">Practice matches with optional stakes and MMR requirements</p>
          </div>
          <InfoDialog
            title="About Scrims"
            description="Scrims (scrimmages) are practice matches designed to help you improve your skills. They can have low or no stakes and often include MMR (skill rating) requirements to ensure balanced matches."
            tips={[
              "Scrims are perfect for warming up before ranked matches",
              "MMR gates ensure you play against similarly skilled opponents",
              "Some scrims have small stakes to keep matches competitive",
              "Great way to practice new strategies without high financial risk",
              "Team scrims help coordinate with your squad before tournaments"
            ]}
          />
        </div>
        <div className="flex items-center space-x-3">
          {showSeeAll && (
            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:scale-105 transition-all duration-200"
              onClick={() => onNavigate?.('scrims')}
            >
              See All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => onNavigate?.('create-scrim')}
          >
            <Swords className="h-4 w-4 mr-2" />
            Create Scrim
          </Button>
        </div>
      </div>

      {/* Scrims Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scrims.map((scrim) => (
          <Card key={scrim.id} className="group hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 flex flex-col">
            <CardHeader className="p-0">
              <div className="relative">
                <ImageWithFallback 
                  src={scrim.gameImage}
                  alt={scrim.game}
                  className="w-full h-24 object-cover rounded-t-lg"
                />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-card/90 text-foreground border-primary/30">
                    {scrim.game}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className={getStatusColor(scrim.status)}>
                    {getStatusText(scrim.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 flex flex-col flex-1">
              <div>
                <h3 className="font-medium text-foreground mb-1">{scrim.title}</h3>
                <p className="text-sm text-muted-foreground">Created by {scrim.createdBy}</p>
              </div>

              {/* Teams */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-medium">
                        {scrim.teamA.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{scrim.teamA.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {scrim.teamA.mmr} MMR
                  </Badge>
                </div>

                {scrim.teamB ? (
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                        <span className="text-xs text-secondary-foreground font-medium">
                          {scrim.teamB.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{scrim.teamB.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {scrim.teamB.mmr} MMR
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                    <div className="text-center">
                      <Users className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-sm text-muted-foreground">Waiting for opponent</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rules and Requirements */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rules:</span>
                  <span className="text-foreground">{scrim.rules}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">MMR Gate:</span>
                  <Badge variant="outline" className="text-xs">
                    {scrim.mmrGate}+ required
                  </Badge>
                </div>

                {scrim.stake && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stake:</span>
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">{scrim.stake}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trust Score:</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-amber-400" />
                    <span className="text-amber-400 font-medium">{scrim.trustScore}%</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 mt-auto">
                {scrim.status === 'looking' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 hover:scale-[1.02] text-primary-foreground group-hover:shadow-md transition-all duration-200"
                    onClick={() => onNavigate?.('request-match')}
                  >
                    <Swords className="h-4 w-4 mr-2" />
                    Request Match
                  </Button>
                )}
                {scrim.status === 'matched' && (
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 hover:scale-[1.02] text-white transition-all duration-200"
                    onClick={() => onNavigate?.('view-match')}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    View Match Details
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}