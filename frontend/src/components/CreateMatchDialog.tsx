import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  MapPin, 
  Shield, 
  Clock,
  Gamepad2,
  Settings,
  Info
} from 'lucide-react';

interface CreateMatchDialogProps {
  children: React.ReactNode;
}

export function CreateMatchDialog({ children }: CreateMatchDialogProps) {
  const [game, setGame] = useState('');
  const [mode, setMode] = useState('');
  const [stake, setStake] = useState('');
  const [region, setRegion] = useState('');
  
  const gameOptions = [
    { id: 'valorant', name: 'Valorant', icon: '🎯' },
    { id: 'cs2', name: 'CS2', icon: '🔫' },
    { id: 'lol', name: 'League of Legends', icon: '⚔️' },
    { id: 'apex', name: 'Apex Legends', icon: '🏃' }
  ];

  const modeOptions = {
    valorant: ['Ranked 1v1', 'Team 5v5', 'Spike Rush', 'Deathmatch'],
    cs2: ['Competitive 5v5', 'Wingman 2v2', 'Aim Duel', 'Retakes'],
    lol: ['Ranked Solo/Duo', 'Flex 5v5', 'ARAM', 'Custom'],
    apex: ['Ranked BR', 'Arenas 3v3', 'Control', 'Mixtape']
  };

  const regionOptions = [
    'NA East', 'NA West', 'EU West', 'EU North', 'Asia Pacific', 'Brazil', 'LATAM'
  ];

  const handleCreateMatch = () => {
    // Handle match creation logic
    console.log('Creating match with:', { game, mode, stake, region });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <Gamepad2 className="h-5 w-5 text-primary" />
            <span>Create New Match</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set up your competitive match with secure escrow and fair play protection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Game Selection */}
          <div className="space-y-2">
            <Label>Game</Label>
            <Select value={game} onValueChange={setGame}>
              <SelectTrigger>
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {gameOptions.map(gameOption => (
                  <SelectItem key={gameOption.id} value={gameOption.id}>
                    <div className="flex items-center space-x-2">
                      <span>{gameOption.icon}</span>
                      <span>{gameOption.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode Selection */}
          {game && (
            <div className="space-y-2">
              <Label>Game Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select game mode" />
                </SelectTrigger>
                <SelectContent>
                  {modeOptions[game as keyof typeof modeOptions]?.map(modeOption => (
                    <SelectItem key={modeOption} value={modeOption}>
                      {modeOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stake and Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stake Amount ($)</Label>
              <Input
                type="number"
                placeholder="25"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                min="1"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map(regionOption => (
                    <SelectItem key={regionOption} value={regionOption}>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span>{regionOption}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button 
            onClick={handleCreateMatch}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Create Match
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}