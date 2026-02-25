import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { User, Mail, Phone, Calendar, MapPin, Shield, Edit2, Camera, Check, X, Sun, Moon, Palette, Link2, Gamepad2, MessageSquare, Twitch, Youtube, Twitter, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useTheme } from './ThemeContext';

interface AccountSettingsProps {
  onNavigate?: (tab: string) => void;
}

export function AccountSettings({ onNavigate }: AccountSettingsProps) {
  const { mode, color, setMode, setColor } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: 'EliteGamer',
    displayName: 'Elite Gamer',
    email: 'elite.gamer@wannabet.com',
    phone: '+1 (555) 123-4567',
    country: 'United States',
    bio: 'Professional esports competitor | CS2 & Valorant | Top 100 Global',
  });

  const handleSave = () => {
    setIsEditing(false);
    // Save logic here
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.('settings')}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account preferences
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profile Information</span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Your public profile information visible to other players
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary/50">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  EG
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-xl">{formData.displayName}</h3>
                <Badge className="bg-emerald-600 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">@{formData.username}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since January 2024
              </p>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!isEditing}
                className="bg-input-background"
              />
              <p className="text-xs text-muted-foreground">
                Your unique identifier on WannaBet
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={!isEditing}
                className="bg-input-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10 bg-input-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10 bg-input-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10 bg-input-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-border"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Customization */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2 text-primary" />
            Theme Customization
          </CardTitle>
          <CardDescription>
            Personalize your WannaBet? experience with custom themes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark/Light Mode Toggle */}
          <div className="space-y-3">
            <Label>Appearance Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('light')}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  mode === 'light'
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border bg-muted/30 hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Sun className={`h-6 w-6 ${mode === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${mode === 'light' ? 'text-primary' : 'text-foreground'}`}>
                    Light Mode
                  </span>
                </div>
                {mode === 'light' && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>

              <button
                onClick={() => setMode('dark')}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  mode === 'dark'
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border bg-muted/30 hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Moon className={`h-6 w-6 ${mode === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${mode === 'dark' ? 'text-primary' : 'text-foreground'}`}>
                    Dark Mode
                  </span>
                </div>
                {mode === 'dark' && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            </div>
          </div>

          <Separator />

          {/* Color Theme Selection */}
          <div className="space-y-3">
            <Label>Accent Color</Label>
            <p className="text-sm text-muted-foreground">
              Choose your preferred accent color for buttons, links, and highlights
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { name: 'red', label: 'Red', color: '#E50914' },
                { name: 'orange', label: 'Orange', color: '#FF8C00' },
                { name: 'green', label: 'Green', color: '#10B981' },
                { name: 'blue', label: 'Blue', color: '#3B82F6' },
                { name: 'purple', label: 'Purple', color: '#A855F7' },
                { name: 'pink', label: 'Pink', color: '#EC4899' },
              ].map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setColor(theme.name as any)}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-110 ${
                    color === theme.name
                      ? 'border-primary shadow-lg'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  style={{
                    backgroundColor: color === theme.name ? `${theme.color}15` : 'transparent',
                  }}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background"
                      style={{
                        backgroundColor: theme.color,
                        ringColor: color === theme.name ? theme.color : 'transparent',
                      }}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {theme.label}
                    </span>
                  </div>
                  {color === theme.name && (
                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link2 className="h-5 w-5 mr-2 text-primary" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Link your gaming platforms and social accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gaming Platforms */}
          <div className="space-y-3">
            <Label>Gaming Platforms</Label>
            <div className="space-y-3">
              {[
                { name: 'Steam', icon: Gamepad2, connected: true, username: 'EliteGamer2024', color: '#171a21' },
                { name: 'Epic Games', icon: Gamepad2, connected: true, username: 'EliteGamer', color: '#2a2a2a' },
                { name: 'Battle.net', icon: Gamepad2, connected: false, username: null, color: '#148eff' },
                { name: 'Xbox Live', icon: Gamepad2, connected: false, username: null, color: '#107c10' },
                { name: 'PlayStation', icon: Gamepad2, connected: false, username: null, color: '#003791' },
              ].map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${platform.color}20` }}
                    >
                      <platform.icon className="h-5 w-5" style={{ color: platform.color }} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground">{platform.name}</h4>
                        {platform.connected && (
                          <Badge className="bg-emerald-600 text-white text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      {platform.connected ? (
                        <p className="text-sm text-muted-foreground">{platform.username}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {platform.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Social Media */}
          <div className="space-y-3">
            <Label>Social Media</Label>
            <div className="space-y-3">
              {[
                { name: 'Discord', icon: MessageSquare, connected: true, username: 'EliteGamer#1234', color: '#5865f2' },
                { name: 'Twitch', icon: Twitch, connected: true, username: 'EliteGamerTV', color: '#9146ff' },
                { name: 'YouTube', icon: Youtube, connected: false, username: null, color: '#ff0000' },
                { name: 'Twitter', icon: Twitter, connected: false, username: null, color: '#1da1f2' },
              ].map((social) => (
                <div
                  key={social.name}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${social.color}20` }}
                    >
                      <social.icon className="h-5 w-5" style={{ color: social.color }} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground">{social.name}</h4>
                        {social.connected && (
                          <Badge className="bg-emerald-600 text-white text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      {social.connected ? (
                        <p className="text-sm text-muted-foreground">{social.username}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {social.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Preferences */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle>Account Preferences</CardTitle>
          <CardDescription>
            Customize your account settings and visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to all users
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Online Status</Label>
              <p className="text-sm text-muted-foreground">
                Let others see when you're online
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Match History</Label>
              <p className="text-sm text-muted-foreground">
                Display your recent matches on your profile
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Friend Requests</Label>
              <p className="text-sm text-muted-foreground">
                Let other players send you friend requests
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 hover-lift">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-amber-500/30 rounded-lg bg-amber-500/5">
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">Deactivate Account</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Temporarily disable your account. You can reactivate anytime.
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Profile hidden from other users</li>
                <li>• Easy to reactivate by logging back in</li>
                <li>• All data preserved for your return</li>
              </ul>
            </div>
            <Button 
              variant="outline" 
              className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 shrink-0"
              onClick={() => onNavigate?.('deactivate-account')}
            >
              Deactivate
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Permanently delete your account and all data. This cannot be undone.
              </p>
              <ul className="text-xs text-destructive space-y-0.5">
                <li>• All data permanently deleted</li>
                <li>• Cannot be recovered or reactivated</li>
                <li>• Irreversible action</li>
              </ul>
            </div>
            <Button 
              variant="destructive" 
              className="bg-destructive hover:bg-destructive/90 shrink-0"
              onClick={() => onNavigate?.('delete-account')}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}