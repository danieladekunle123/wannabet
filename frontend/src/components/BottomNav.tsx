import React from 'react';
import { Home, User, MessageCircle, Settings } from 'lucide-react';
import { Badge } from './ui/badge';
import { useTheme } from './ThemeContext';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  messageCount?: number;
}

// Color mapping for theme colors
const themeColors = {
  red: '#E50914',
  orange: '#FF8C00',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#A855F7',
  pink: '#EC4899',
};

// Reticle/Crosshair Icon Component
function ReticleIcon({ className }: { className?: string }) {
  const { color } = useTheme();
  const centerColor = themeColors[color];
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Inner circle */}
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Top line */}
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Bottom line */}
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Left line */}
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Right line */}
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Center crosshair - dynamically themed */}
      <line x1="12" y1="9" x2="12" y2="15" stroke={centerColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" stroke={centerColor} strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Center dot for extra emphasis */}
      <circle cx="12" cy="12" r="1" fill={centerColor} />
    </svg>
  );
}

export function BottomNav({ activeTab, onNavigate, messageCount = 12 }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'my-profile', label: 'Profile', icon: User },
    { id: 'create-match', label: 'Create', icon: ReticleIcon },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: messageCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCreateButton = item.id === 'create-match';

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center relative transition-all duration-200 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
              )}

              {/* Icon Container */}
              <div className="relative">
                <Icon className="h-5 w-5" />
                
                {/* Badge for messages */}
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs border border-card">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>

              {/* Label */}
              <span className="text-xs mt-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}