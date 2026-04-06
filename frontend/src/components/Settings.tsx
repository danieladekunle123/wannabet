import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  useCurrency,
  type SupportedCurrency,
} from "../context/CurrencyContext";
import {
  ChevronRight,
  Settings as SettingsIcon,
  Wallet,
  CreditCard,
  Users,
  Lock,
  Eye,
  Globe,
  DollarSign,
  HelpCircle,
  Bug,
  MessageCircle,
  LogOut,
} from "lucide-react";

interface SettingsProps {
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
}

export function Settings({ onNavigate, onSignOut }: SettingsProps) {
  const { currency, setCurrency } = useCurrency();
  const settingsSections = [
    {
      label: "Account",
      items: [
        {
          id: "account-settings",
          icon: SettingsIcon,
          title: "Account Settings",
          description: "Manage your profile and preferences",
        },
        {
          id: "wallet-escrow",
          icon: Wallet,
          title: "Wallet & Escrow",
          description: "Manage funds and view transactions",
        },
      ],
    },
    {
      label: "Preferences",
      items: [
        {
          id: "privacy-security",
          icon: Lock,
          title: "Privacy & Security",
          description: "Security settings and privacy controls",
        },
        {
          id: "language",
          icon: Globe,
          title: "Language",
          description: "Choose your preferred language",
        },
      ],
    },
    {
      label: "Support",
      items: [
        {
          id: "help-center",
          icon: HelpCircle,
          title: "Help Center",
          description: "Browse FAQs and guides",
        },
        {
          id: "report-bug",
          icon: Bug,
          title: "Report a Bug",
          description: "Report issues and bugs",
        },
        {
          id: "contact-support",
          icon: MessageCircle,
          title: "Contact Support",
          description: "Get help from our team",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fadeInUp max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <div key={section.label} className="space-y-3">
          <h2 className="text-sm text-muted-foreground uppercase tracking-wider px-1">
            {section.label}
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              {section.items.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => onNavigate?.(item.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            {item.badge && (
                              <Badge className="bg-primary/20 text-primary text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                    </button>
                    {index < section.items.length - 1 && (
                      <div className="border-t border-border" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Currency Selector */}
      <div className="space-y-3">
        <h2 className="text-sm text-muted-foreground uppercase tracking-wider px-1">
          Currency
        </h2>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    Display Currency
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred currency
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(["EUR", "USD", "GBP"] as SupportedCurrency[]).map((cur) => (
                  <button
                    key={cur}
                    onClick={() => setCurrency(cur)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currency === cur
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:border-primary hover:bg-primary/10 text-muted-foreground"
                    }`}
                  >
                    {cur === "EUR"
                      ? "€ EUR"
                      : cur === "USD"
                        ? "$ USD"
                        : "£ GBP"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sign Out */}
      <Card className="border-destructive/50 hover-lift">
        <CardContent className="p-0">
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-destructive">Sign out</h3>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors flex-shrink-0" />
          </button>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>WannaBet? © 2024 • Version 1.0.0</p>
        <p className="mt-1">Made with ❤️ for the esports community</p>
      </div>
    </div>
  );
}
