import React from "react";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto animate-fadeInUp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">WannaBet?</span>
            <span className="hidden sm:inline">•</span>
            <span>© 2025</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm">Version 1.0.0</span>
          </div>

          {onNavigate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Button
                variant="link"
                className="text-muted-foreground hover:text-primary p-0 text-xs h-auto"
                onClick={() => onNavigate("terms-of-service")}
              >
                Terms of Service
              </Button>
              <span>•</span>
              <Button
                variant="link"
                className="text-muted-foreground hover:text-primary p-0 text-xs h-auto"
                onClick={() => onNavigate("privacy-policy")}
              >
                Privacy Policy
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-primary fill-primary animate-pulse" />
            <span>for the esports community</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
