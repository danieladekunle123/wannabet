import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Keyboard, Command, Search, Home, MessageCircle, Users, Trophy, Settings as SettingsIcon, Plus, ArrowLeft } from 'lucide-react';

interface KeyboardShortcutsProps {
  onNavigate?: (tab: string) => void;
}

export function KeyboardShortcuts({ onNavigate }: KeyboardShortcutsProps) {
  const shortcuts = [
    {
      category: 'Navigation',
      icon: Home,
      items: [
        { keys: ['G', 'H'], description: 'Go to Home' },
        { keys: ['G', 'L'], description: 'Go to Lobbies' },
        { keys: ['G', 'M'], description: 'Go to Messages' },
        { keys: ['G', 'T'], description: 'Go to Tournaments' },
        { keys: ['G', 'S'], description: 'Go to Stats' },
        { keys: ['G', 'E'], description: 'Go to Settings' },
      ],
    },
    {
      category: 'Actions',
      icon: Plus,
      items: [
        { keys: ['C'], description: 'Create new match' },
        { keys: ['N'], description: 'New message' },
        { keys: ['F'], description: 'Search/Filter' },
        { keys: ['R'], description: 'Refresh page' },
      ],
    },
    {
      category: 'Interface',
      icon: Command,
      items: [
        { keys: ['K'], description: 'Command palette', modifier: '⌘' },
        { keys: ['/'], description: 'Focus search' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['Esc'], description: 'Close modals/dialogs' },
        { keys: ['T'], description: 'Toggle theme', modifier: '⌘' },
      ],
    },
    {
      category: 'Messages',
      icon: MessageCircle,
      items: [
        { keys: ['↑', '↓'], description: 'Navigate conversations' },
        { keys: ['Enter'], description: 'Open conversation' },
        { keys: ['E'], description: 'Archive conversation', modifier: '⌘' },
        { keys: ['D'], description: 'Delete conversation', modifier: '⌘' },
      ],
    },
    {
      category: 'Teams & Hubs',
      icon: Users,
      items: [
        { keys: ['T', 'N'], description: 'Create new team' },
        { keys: ['H', 'J'], description: 'Join hub' },
        { keys: ['T', 'S'], description: 'Switch team' },
      ],
    },
    {
      category: 'Tournament',
      icon: Trophy,
      items: [
        { keys: ['J'], description: 'Join tournament' },
        { keys: ['B'], description: 'View bracket' },
        { keys: ['I'], description: 'Tournament info' },
      ],
    },
  ];

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
          <h1 className="mb-2">Keyboard Shortcuts</h1>
          <p className="text-muted-foreground">
            Master these shortcuts to navigate WannaBet like a pro
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-primary/50 hover-lift bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Keyboard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Pro Tip</p>
              <p className="text-sm text-muted-foreground mt-1">
                Press <Badge variant="outline" className="mx-1 px-2 py-0.5 text-xs">?</Badge> at any time to view this shortcuts guide, or 
                <Badge variant="outline" className="mx-1 px-2 py-0.5 text-xs">⌘ K</Badge> to open the command palette.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shortcuts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {shortcuts.map((section, sectionIndex) => {
          const IconComponent = section.icon;
          return (
            <Card
              key={section.category}
              className="border-border/50 hover-lift"
              style={{ animationDelay: `${sectionIndex * 0.1}s` }}
            >
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <IconComponent className="h-5 w-5 mr-2 text-primary" />
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((shortcut, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center space-x-1">
                          {shortcut.modifier && (
                            <>
                              <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                                {shortcut.modifier}
                              </Badge>
                              <span className="text-muted-foreground">+</span>
                            </>
                          )}
                          {shortcut.keys.map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              {keyIndex > 0 && (
                                <span className="text-muted-foreground text-xs">then</span>
                              )}
                              <Badge variant="outline" className="font-mono text-xs px-2 py-1 min-w-[32px] justify-center">
                                {key}
                              </Badge>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      {index < section.items.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform-specific Note */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Platform Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">macOS</h4>
              <p className="text-sm text-muted-foreground">
                Use <Badge variant="outline" className="mx-1 px-2 py-0.5 text-xs">⌘ Command</Badge> for system shortcuts
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Windows/Linux</h4>
              <p className="text-sm text-muted-foreground">
                Use <Badge variant="outline" className="mx-1 px-2 py-0.5 text-xs">Ctrl</Badge> instead of <Badge variant="outline" className="mx-1 px-2 py-0.5 text-xs">⌘</Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Shortcuts (Future Feature) */}
      <Card className="border-border/50 opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Custom Shortcuts</CardTitle>
            <Badge className="bg-muted text-muted-foreground">Coming Soon</Badge>
          </div>
          <CardDescription>
            Customize keyboard shortcuts to match your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature is coming soon. You'll be able to customize shortcuts to better suit your preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}