import React, { useState } from "react";
import { Search, Plus, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { MobileMenu } from "./MobileMenu";
import { useTheme } from "./ThemeContext";

interface NavigationProps {
  onNavigate?: (page: string, query?: string) => void;
  onSignOut?: () => void;
}

// Color mapping for theme glow effects
const themeGlowColors = {
  red: { rgb: "229, 9, 20", hex: "#E50914" },
  orange: { rgb: "255, 140, 0", hex: "#FF8C00" },
  green: { rgb: "16, 185, 129", hex: "#10B981" },
  blue: { rgb: "59, 130, 246", hex: "#3B82F6" },
  purple: { rgb: "168, 85, 247", hex: "#A855F7" },
  pink: { rgb: "236, 72, 153", hex: "#EC4899" },
};

export function Navigation({ onNavigate, onSignOut }: NavigationProps) {
  const { color } = useTheme();
  const glowColor = themeGlowColors[color];
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim() && onNavigate) {
      onNavigate("search-results", searchQuery.trim());
      setSearchQuery("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border animate-fadeInDown">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <div
            className="flex items-center space-x-2 cursor-pointer transition-transform duration-300 hover:scale-105"
            onClick={() => onNavigate?.("home")}
          >
            <div
              className="bg-primary rounded-lg p-2 transition-all duration-300"
              style={{
                boxShadow: `0 0 10px rgba(${glowColor.rgb}, 0.3)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 20px rgba(${glowColor.rgb}, 0.6)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 10px rgba(${glowColor.rgb}, 0.3)`;
              }}
            >
              <Crown className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              WannaBet?
            </span>
          </div>

          {/* Main Navigation - Hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-6">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              onClick={() => onNavigate?.("create-match")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Match
            </Button>
          </div>
        </div>

        {/* Search bar - Hidden on mobile */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full flex items-center">
            <Input
              placeholder="Search matches, players, games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-11 bg-muted/50 border-border focus:border-primary w-full"
            />
            <Button
              size="icon"
              variant="default"
              onClick={handleSearch}
              className="absolute right-0.5 h-8 w-8 bg-primary hover:bg-primary/70 hover:scale-110 hover-glow text-primary-foreground shadow-sm transition-all duration-300"
              type="button"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          <NotificationsDropdown onNavigate={onNavigate} />
          <div className="hidden lg:flex items-center">
            <ProfileDropdown onNavigate={onNavigate} onSignOut={onSignOut} />
          </div>
          <MobileMenu onNavigate={onNavigate} onSignOut={onSignOut} />
        </div>
      </div>
    </nav>
  );
}
