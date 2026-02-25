import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Slider } from './ui/slider';
import { 
  Trophy, 
  Target, 
  Users, 
  DollarSign, 
  Shield, 
  Clock, 
  Gamepad2,
  Star,
  Settings,
  MapPin,
  Swords,
  Zap,
  Lock,
  TrendingUp,
  Award,
  Flag,
  ChevronRight
} from 'lucide-react';

interface CreateMatchProps {
  onNavigate: (page: string) => void;
  initialTab?: 'tournament' | 'scrim' | 'wager' | 'custom';
}

export function CreateMatch({ onNavigate, initialTab = 'tournament' }: CreateMatchProps) {
  const [matchType, setMatchType] = useState<'tournament' | 'scrim' | 'wager' | 'custom'>(initialTab);
  const [selectedGame, setSelectedGame] = useState('');
  const [entryFee, setEntryFee] = useState([25]);
  const [teamSize, setTeamSize] = useState('5v5');
  const [mmrRequired, setMMRRequired] = useState([1500]);
  const [requireEscrow, setRequireEscrow] = useState(true);
  const [privateMatch, setPrivateMatch] = useState(false);

  const games = [
    { id: 'cs2', name: 'Counter-Strike 2', icon: '🎯' },
    { id: 'valorant', name: 'Valorant', icon: '⚔️' },
    { id: 'dota2', name: 'Dota 2', icon: '🏆' },
    { id: 'lol', name: 'League of Legends', icon: '👑' },
    { id: 'rocket-league', name: 'Rocket League', icon: '🚗' },
    { id: 'apex', name: 'Apex Legends', icon: '🔫' },
    { id: 'fortnite', name: 'Fortnite', icon: '🏗️' },
    { id: 'cod', name: 'Call of Duty', icon: '💥' },
  ];

  const matchTypes = [
    {
      id: 'tournament',
      title: 'Tournament',
      description: 'Competitive bracket-style competition',
      icon: Trophy,
      color: 'text-amber-400',
      bgColor: 'bg-amber-600/10',
      borderColor: 'border-amber-600/30'
    },
    {
      id: 'scrim',
      title: 'Scrim',
      description: 'Practice match with no entry fee',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/10',
      borderColor: 'border-blue-600/30'
    },
    {
      id: 'wager',
      title: 'Wager Match',
      description: 'Head-to-head with real stakes',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-600/10',
      borderColor: 'border-emerald-600/30'
    },
    {
      id: 'custom',
      title: 'Custom Lobby',
      description: 'Fully customizable match settings',
      icon: Settings,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/10',
      borderColor: 'border-purple-600/30'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeInUp max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Match</h1>
          <p className="text-muted-foreground">Set up your perfect competitive experience</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('home')}
          className="hover:bg-muted"
        >
          Cancel
        </Button>
      </div>

      {/* Match Type Selection */}
      <Card className="border-primary/20 animate-fadeInUp animate-delay-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Select Match Type
          </CardTitle>
          <CardDescription>Choose the format that fits your gameplay style</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {matchTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-300 hover-lift ${
                    matchType === type.id
                      ? `${type.borderColor} border-2 ${type.bgColor}`
                      : 'border-muted hover:border-primary/30'
                  }`}
                  onClick={() => setMatchType(type.id as any)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${type.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${type.color}`} />
                    </div>
                    <h3 className="font-semibold mb-1">{type.title}</h3>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                    {matchType === type.id && (
                      <Badge className="mt-3 bg-primary text-primary-foreground">
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Selection */}
          <Card className="animate-fadeInUp animate-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Game & Basic Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="game">Select Game</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger id="game" className="bg-muted/50 border-muted">
                    <SelectValue placeholder="Choose your game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        <div className="flex items-center gap-2">
                          <span>{game.icon}</span>
                          <span>{game.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="match-title">Match Title</Label>
                <Input
                  id="match-title"
                  placeholder="e.g., Championship Finals 2025"
                  className="bg-muted/50 border-muted"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your match, rules, and any special requirements..."
                  className="bg-muted/50 border-muted min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select defaultValue="na">
                    <SelectTrigger id="region" className="bg-muted/50 border-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="na">🇺🇸 North America</SelectItem>
                      <SelectItem value="eu">🇪🇺 Europe</SelectItem>
                      <SelectItem value="asia">🌏 Asia</SelectItem>
                      <SelectItem value="oce">🇦🇺 Oceania</SelectItem>
                      <SelectItem value="sa">🇧🇷 South America</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team-size">Team Size</Label>
                  <Select value={teamSize} onValueChange={setTeamSize}>
                    <SelectTrigger id="team-size" className="bg-muted/50 border-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1v1">1v1 Solo</SelectItem>
                      <SelectItem value="2v2">2v2 Duo</SelectItem>
                      <SelectItem value="3v3">3v3 Trio</SelectItem>
                      <SelectItem value="5v5">5v5 Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Settings */}
          <Card className="animate-fadeInUp animate-delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Match Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Entry Fee - Only show for non-scrim matches */}
              {matchType !== 'scrim' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Entry Fee</Label>
                    <Badge className="bg-emerald-600 text-white">
                      ${entryFee[0]}
                    </Badge>
                  </div>
                  <Slider
                    value={entryFee}
                    onValueChange={setEntryFee}
                    min={5}
                    max={500}
                    step={5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$5</span>
                    <span>$500</span>
                  </div>
                </div>
              )}

              {/* Prize Pool - Only for tournaments */}
              {matchType === 'tournament' && (
                <div className="p-4 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-400" />
                      <span className="font-semibold">Estimated Prize Pool</span>
                    </div>
                    <span className="text-lg font-bold text-amber-400">
                      ${(entryFee[0] * 32 * 0.9).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on 32 participants (90% of total entry fees)
                  </p>
                </div>
              )}

              {/* MMR Requirement */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Minimum MMR Required
                  </Label>
                  <Badge className="bg-blue-600 text-white">
                    {mmrRequired[0]} MMR
                  </Badge>
                </div>
                <Slider
                  value={mmrRequired}
                  onValueChange={setMMRRequired}
                  min={0}
                  max={5000}
                  step={100}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>No requirement</span>
                  <span>5000 MMR (Elite)</span>
                </div>
              </div>

              {/* Match Format - Only for tournaments */}
              {matchType === 'tournament' && (
                <div>
                  <Label className="mb-2 block">Tournament Format</Label>
                  <RadioGroup defaultValue="single-elim">
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="single-elim" id="single-elim" />
                      <Label htmlFor="single-elim" className="cursor-pointer flex-1">
                        <div className="font-medium">Single Elimination</div>
                        <div className="text-xs text-muted-foreground">One loss and you're out</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="double-elim" id="double-elim" />
                      <Label htmlFor="double-elim" className="cursor-pointer flex-1">
                        <div className="font-medium">Double Elimination</div>
                        <div className="text-xs text-muted-foreground">Second chance bracket</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="round-robin" id="round-robin" />
                      <Label htmlFor="round-robin" className="cursor-pointer flex-1">
                        <div className="font-medium">Round Robin</div>
                        <div className="text-xs text-muted-foreground">Everyone plays everyone</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Max Participants */}
              <div>
                <Label htmlFor="max-players">Maximum Participants</Label>
                <Select defaultValue="32">
                  <SelectTrigger id="max-players" className="bg-muted/50 border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 Players</SelectItem>
                    <SelectItem value="16">16 Players</SelectItem>
                    <SelectItem value="32">32 Players</SelectItem>
                    <SelectItem value="64">64 Players</SelectItem>
                    <SelectItem value="128">128 Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    className="bg-muted/50 border-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    className="bg-muted/50 border-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Security & Privacy */}
        <div className="space-y-6">
          {/* Security Settings */}
          <Card className="animate-fadeInUp animate-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security & Trust
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">Require Escrow</div>
                  <div className="text-xs text-muted-foreground">
                    Players deposit funds before match
                  </div>
                </div>
                <Switch
                  checked={requireEscrow}
                  onCheckedChange={setRequireEscrow}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">Private Match</div>
                  <div className="text-xs text-muted-foreground">
                    Invite only, not publicly listed
                  </div>
                </div>
                <Switch
                  checked={privateMatch}
                  onCheckedChange={setPrivateMatch}
                />
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm mb-2 block">Minimum Trust Score</Label>
                <Select defaultValue="90">
                  <SelectTrigger className="bg-background border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Requirement</SelectItem>
                    <SelectItem value="70">70% - Basic</SelectItem>
                    <SelectItem value="85">85% - Verified</SelectItem>
                    <SelectItem value="90">90% - Trusted</SelectItem>
                    <SelectItem value="95">95% - Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Your Trust Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-primary">98%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Preview */}
          <Card className="animate-fadeInUp animate-delay-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Match Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge className="bg-primary text-primary-foreground">
                  {matchTypes.find(t => t.id === matchType)?.title}
                </Badge>
              </div>
              
              {matchType !== 'scrim' && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm text-muted-foreground">Entry Fee</span>
                  <span className="font-semibold text-emerald-400">${entryFee[0]}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Team Size</span>
                <span className="font-semibold">{teamSize}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Min MMR</span>
                <span className="font-semibold text-blue-400">{mmrRequired[0]}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Escrow</span>
                <Badge className={requireEscrow ? "bg-emerald-600" : "bg-muted"}>
                  {requireEscrow ? 'Required' : 'Optional'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Visibility</span>
                <Badge className={!privateMatch ? "bg-blue-600" : "bg-muted"}>
                  {privateMatch ? 'Private' : 'Public'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="border-primary/20 animate-fadeInUp animate-delay-600">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="leading-tight">Your match will be reviewed before going live</span>
            </div>
            <div className="flex gap-2 sm:gap-3 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => onNavigate('home')}
                className="flex-1 sm:flex-none"
              >
                Save as Draft
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none"
                disabled={!selectedGame}
              >
                <Flag className="h-4 w-4 mr-2" />
                Create Match
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}