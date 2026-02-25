import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ArrowLeft, Users, Upload, Plus, X, Shield, Star, Trophy, Globe, Lock, Eye, EyeOff, Hash, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateTeamHubProps {
  onNavigate: (tab: string) => void;
}

export function CreateTeamHub({ onNavigate }: CreateTeamHubProps) {
  const [creationType, setCreationType] = useState<'team' | 'hub'>('team');
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    game: '',
    description: '',
    category: '',
    privacy: 'public',
    requireApproval: true,
    minMMR: '',
    minTrustScore: '90',
    maxMembers: creationType === 'team' ? '5' : '1000',
    region: 'multi-region',
    voiceRequired: false,
    competitiveLevel: 'casual',
  });

  const [rules, setRules] = useState<string[]>(['Be respectful to all members', 'No toxic behavior']);
  const [newRule, setNewRule] = useState('');
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const games = [
    'Counter-Strike 2',
    'Valorant',
    'League of Legends',
    'Dota 2',
    'Apex Legends',
    'Fortnite',
    'Call of Duty',
    'Rainbow Six Siege',
    'Overwatch 2',
    'Rocket League',
  ];

  const hubCategories = [
    'Competitive',
    'Casual',
    'Social',
    'Tournament',
    'Training',
    'Regional',
  ];

  const teamSizes = ['3', '5', '6', '10'];
  const hubSizes = ['50', '100', '250', '500', '1000', '5000', 'Unlimited'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addRule = () => {
    if (newRule.trim() && rules.length < 10) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const addEmail = () => {
    if (newEmail.trim() && inviteEmails.length < 20 && newEmail.includes('@')) {
      setInviteEmails([...inviteEmails, newEmail.trim()]);
      setNewEmail('');
    }
  };

  const removeEmail = (index: number) => {
    setInviteEmails(inviteEmails.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    console.log('Creating:', creationType, formData, rules, inviteEmails, tags);
    onNavigate('hubs');
  };

  const isFormValid = formData.name.trim() !== '' && formData.game !== '' && formData.description.trim() !== '';

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('hubs')}
            className="hover:bg-muted transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground">Create {creationType === 'team' ? 'Team' : 'Social Hub'}</h1>
            <p className="text-muted-foreground">
              {creationType === 'team' 
                ? 'Build your competitive team and dominate the arena' 
                : 'Create a community for players to connect and compete'}
            </p>
          </div>
        </div>
      </div>

      {/* Type Selection */}
      <Card className="animate-fadeInLeft hover-lift">
        <CardHeader>
          <CardTitle>What would you like to create?</CardTitle>
          <CardDescription>Choose between a competitive team or a social hub</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setCreationType('team');
                handleInputChange('maxMembers', '5');
              }}
              className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                creationType === 'team'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-card'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`p-4 rounded-full ${creationType === 'team' ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Users className={`h-8 w-8 ${creationType === 'team' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-center">
                  <h3 className={`font-medium ${creationType === 'team' ? 'text-primary' : 'text-foreground'}`}>
                    Competitive Team
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Small roster focused on competitive play
                  </p>
                </div>
                {creationType === 'team' && (
                  <Badge className="bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </button>

            <button
              onClick={() => {
                setCreationType('hub');
                handleInputChange('maxMembers', '1000');
              }}
              className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                creationType === 'hub'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-card'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`p-4 rounded-full ${creationType === 'hub' ? 'bg-primary/20' : 'bg-muted'}`}>
                  <MessageCircle className={`h-8 w-8 ${creationType === 'hub' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-center">
                  <h3 className={`font-medium ${creationType === 'hub' ? 'text-primary' : 'text-foreground'}`}>
                    Social Hub
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Large community for social play and events
                  </p>
                </div>
                {creationType === 'hub' && (
                  <Badge className="bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="animate-fadeInLeft animate-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-primary" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {creationType === 'team' ? 'Team' : 'Hub'} Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder={creationType === 'team' ? 'Phoenix Elite' : 'Pro Valorant Grinders'}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-input-background"
                  />
                </div>

                {creationType === 'team' && (
                  <div className="space-y-2">
                    <Label htmlFor="tag">Team Tag (Optional)</Label>
                    <Input
                      id="tag"
                      placeholder="PHX"
                      maxLength={5}
                      value={formData.tag}
                      onChange={(e) => handleInputChange('tag', e.target.value.toUpperCase())}
                      className="bg-input-background"
                    />
                  </div>
                )}

                {creationType === 'hub' && (
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="bg-input-background">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {hubCategories.map((cat) => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="game">Game *</Label>
                <Select value={formData.game} onValueChange={(value) => handleInputChange('game', value)}>
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game} value={game.toLowerCase().replace(/\s+/g, '-')}>
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder={
                    creationType === 'team'
                      ? 'Describe your team, playstyle, and what you\'re looking for in teammates...'
                      : 'Describe your hub, what activities you host, and what kind of community you\'re building...'
                  }
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-input-background resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.description.length}/500
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tags (Optional)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Add a tag (e.g., competitive, casual)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="bg-input-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addTag}
                    disabled={!newTag.trim() || tags.length >= 5}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="pl-2 pr-1">
                        {tag}
                        <button
                          onClick={() => removeTag(index)}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {tags.length}/5 tags added
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">
                  {creationType === 'team' ? 'Team' : 'Hub'} Logo (Optional)
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/10">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG or GIF (MAX. 2MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="animate-fadeInLeft animate-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Select value={formData.maxMembers} onValueChange={(value) => handleInputChange('maxMembers', value)}>
                    <SelectTrigger className="bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(creationType === 'team' ? teamSizes : hubSizes).map((size) => (
                        <SelectItem key={size} value={size.toLowerCase()}>
                          {size} {size === 'Unlimited' ? '' : 'members'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                    <SelectTrigger className="bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multi-region">Multi-Region</SelectItem>
                      <SelectItem value="na-east">NA East</SelectItem>
                      <SelectItem value="na-west">NA West</SelectItem>
                      <SelectItem value="eu-west">EU West</SelectItem>
                      <SelectItem value="eu-east">EU East</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                      <SelectItem value="oceania">Oceania</SelectItem>
                      <SelectItem value="south-america">South America</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitiveLevel">Competitive Level</Label>
                  <Select value={formData.competitiveLevel} onValueChange={(value) => handleInputChange('competitiveLevel', value)}>
                    <SelectTrigger className="bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="semi-competitive">Semi-Competitive</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="pro">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <Select value={formData.privacy} onValueChange={(value) => handleInputChange('privacy', value)}>
                    <SelectTrigger className="bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span>Public - Anyone can join</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="approval">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>Approval Required</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4" />
                          <span>Private - Invite Only</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Member Requirements</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="minMMR">Minimum MMR (Optional)</Label>
                  <Input
                    id="minMMR"
                    type="number"
                    placeholder="2500"
                    value={formData.minMMR}
                    onChange={(e) => handleInputChange('minMMR', e.target.value)}
                    className="bg-input-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minTrustScore">Minimum Trust Score</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      id="minTrustScore"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.minTrustScore}
                      onChange={(e) => handleInputChange('minTrustScore', e.target.value)}
                      className="bg-input-background"
                    />
                    <Badge variant="secondary">{formData.minTrustScore}%</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <Label htmlFor="voiceRequired" className="cursor-pointer">
                      Voice Chat Required
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Members must use voice communication
                    </p>
                  </div>
                  <Switch
                    id="voiceRequired"
                    checked={formData.voiceRequired}
                    onCheckedChange={(checked) => handleInputChange('voiceRequired', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <Label htmlFor="requireApproval" className="cursor-pointer">
                      Require Join Approval
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review members before they join
                    </p>
                  </div>
                  <Switch
                    id="requireApproval"
                    checked={formData.requireApproval}
                    onCheckedChange={(checked) => handleInputChange('requireApproval', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules */}
          <Card className="animate-fadeInLeft animate-delay-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span>{creationType === 'team' ? 'Team' : 'Hub'} Rules</span>
              </CardTitle>
              <CardDescription>Set clear expectations for members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Add a rule..."
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                  className="bg-input-background"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addRule}
                  disabled={!newRule.trim() || rules.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {rules.length > 0 && (
                <div className="space-y-2">
                  {rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span className="flex-1 text-sm text-foreground">{rule}</span>
                      <button
                        onClick={() => removeRule(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {rules.length}/10 rules added
              </p>
            </CardContent>
          </Card>

          {/* Invite Members */}
          <Card className="animate-fadeInLeft animate-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Invite Initial Members (Optional)</span>
              </CardTitle>
              <CardDescription>Send invites to friends or known players</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="email"
                  placeholder="player@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                  className="bg-input-background"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addEmail}
                  disabled={!newEmail.trim() || !newEmail.includes('@') || inviteEmails.length >= 20}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {inviteEmails.length > 0 && (
                <div className="space-y-2">
                  {inviteEmails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{email}</span>
                      </div>
                      <button
                        onClick={() => removeEmail(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {inviteEmails.length}/20 invites added
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Preview & Actions */}
        <div className="space-y-6 lg:sticky lg:top-20 self-start">
          {/* Preview Card */}
          <Card className="animate-fadeInRight">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How your {creationType} will appear</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo/Icon Preview */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30">
                  {creationType === 'team' ? (
                    <Users className="h-12 w-12 text-primary" />
                  ) : (
                    <MessageCircle className="h-12 w-12 text-primary" />
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="text-center">
                <h3 className="font-medium text-foreground">
                  {formData.name || `My ${creationType === 'team' ? 'Team' : 'Hub'}`}
                  {creationType === 'team' && formData.tag && (
                    <Badge className="ml-2 bg-primary text-primary-foreground">
                      {formData.tag}
                    </Badge>
                  )}
                </h3>
                {formData.game && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {games.find(g => g.toLowerCase().replace(/\s+/g, '-') === formData.game) || 'Game'}
                  </p>
                )}
              </div>

              <Separator />

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="secondary">
                    {creationType === 'team' ? 'Team' : 'Social Hub'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Privacy</span>
                  <div className="flex items-center space-x-1">
                    {formData.privacy === 'public' && <Globe className="h-3 w-3 text-emerald-400" />}
                    {formData.privacy === 'approval' && <Eye className="h-3 w-3 text-amber-400" />}
                    {formData.privacy === 'private' && <Lock className="h-3 w-3 text-primary" />}
                    <span className="font-medium text-foreground capitalize">{formData.privacy}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Members</span>
                  <span className="font-medium text-foreground capitalize">{formData.maxMembers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Region</span>
                  <span className="font-medium text-foreground">
                    {formData.region.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
                {formData.minMMR && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min MMR</span>
                    <span className="font-medium text-primary">{formData.minMMR}+</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trust Score</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-amber-400" />
                    <span className="font-medium text-foreground">{formData.minTrustScore}%+</span>
                  </div>
                </div>
              </div>

              {tags.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              {formData.description && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {formData.description}
                  </p>
                </>
              )}

              {rules.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">Rules ({rules.length})</p>
                    <ul className="space-y-1">
                      {rules.slice(0, 3).map((rule, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start space-x-2">
                          <div className="mt-1.5">
                            <div className="h-1 w-1 rounded-full bg-primary" />
                          </div>
                          <span className="line-clamp-1">{rule}</span>
                        </li>
                      ))}
                      {rules.length > 3 && (
                        <li className="text-xs text-primary">+{rules.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="animate-fadeInRight animate-delay-100">
            <CardContent className="pt-6 space-y-3">
              {!isFormValid && (
                <div className="p-3 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-foreground">
                      Please fill in all required fields (Name, Game, and Description)
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                disabled={!isFormValid}
                onClick={handleCreate}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Create {creationType === 'team' ? 'Team' : 'Hub'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate('hubs')}
              >
                Cancel
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {inviteEmails.length > 0 && `${inviteEmails.length} invite(s) will be sent after creation`}
              </p>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="animate-fadeInRight animate-delay-200">
            <CardHeader>
              <CardTitle className="text-base">Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Add clear rules to set expectations
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Use tags to help others find your {creationType}
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Set appropriate requirements for skill level
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  A good description attracts the right members
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
