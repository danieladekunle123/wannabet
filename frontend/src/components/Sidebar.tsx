import React from 'react';
import { Home, Users, DollarSign, Swords, Trophy, MessageCircle, Wallet, Settings, Shield, Star, Gamepad2, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut?: () => void;
}

export function Sidebar({ activeTab, onTabChange, onSignOut }: SidebarProps) {
  const navigationSections = [
    {
      items: [
        { id: 'home', label: 'Home', icon: Home }
      ]
    },
    {
      label: 'Compete',
      icon: Swords,
      items: [
        { id: 'lobbies', label: 'Lobbies', icon: Gamepad2, badge: '143' },
        { id: 'wagers', label: 'Wagers', icon: DollarSign },
        { id: 'tournaments', label: 'Tournaments', icon: Trophy, badge: 'NEW' },
        { id: 'scrims', label: 'Scrims', icon: Swords }
      ]
    },
    {
      label: 'Community',
      icon: Users,
      items: [
        { id: 'hubs', label: 'Social Hubs', icon: Users, badge: '5' },
        { id: 'messages', label: 'Messages', icon: MessageCircle, badge: '12' }
      ]
    },
    {
      label: 'Progress',
      icon: TrendingUp,
      items: [
        { id: 'leaderboards', label: 'Leaderboards', icon: Star },
        { id: 'stats', label: 'My Stats', icon: TrendingUp }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border border-b-0 h-screen sticky top-0 flex flex-col animate-fadeInLeft relative sidebar-gradient-fade overflow-hidden">
      <div className="p-4 space-y-2 relative z-[1] pb-6" data-slot="sidebar-content">
        {/* Main Navigation */}
        <div className="space-y-3">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.label && (
                <div className="px-3 py-2 flex items-center space-x-2">
                  {section.icon && <section.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {section.label}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className={`w-full justify-between h-10 px-3 transition-all duration-300 hover:scale-105 hover:translate-x-1 ${
                      activeTab === item.id 
                        ? 'bg-primary/20 text-primary border-primary/50' 
                        : 'text-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                    onClick={() => onTabChange(item.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge 
                        className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                          item.badge === 'NEW' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Wallet Section */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 hover:translate-x-1"
            onClick={() => onTabChange('wallet-escrow')}
          >
            <Wallet className="h-4 w-4" />
            <span className="flex-1 text-left">Wallet</span>
            <Badge className="bg-emerald-600 text-white text-xs animate-pulse">
              <Shield className="h-3 w-3 mr-1" />
              Escrow
            </Badge>
          </Button>
          
          <div className="pl-7 text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Available Credits:</span>
              <span className="text-emerald-400 font-medium">2,450</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>In Escrow:</span>
              <span className="text-amber-400 font-medium">500</span>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Settings */}
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 hover:translate-x-1"
          onClick={() => onTabChange('settings')}
        >
          <Settings className="h-4 w-4 transition-transform duration-300 hover:rotate-90" />
          <span>Settings</span>
        </Button>
      </div>

      {/* Social Hubs Preview */}
      <div className="flex-1 px-4 pb-4 relative z-[1]" data-slot="sidebar-content">
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Active Hubs</span>
          </div>
          
          <div className="space-y-2">
            {[
              { name: 'Pro Scrims', members: 247, online: 23 },
              { name: 'Valorant Masters', members: 1.2, online: 156 },
              { name: 'CS2 Legends', members: 892, online: 67 },
            ].map((hub, i) => (
              <div key={i} className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="flex-1 text-foreground">{hub.name}</span>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>{hub.online}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Score */}
        <div className="mt-4 bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-foreground">Trust Score</span>
            </div>
            <Badge className="bg-emerald-600 text-white">98.5%</Badge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Excellent reputation • Low disputes
          </div>
        </div>
      </div>
    </aside>
  );
}