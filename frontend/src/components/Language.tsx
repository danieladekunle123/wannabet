import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Globe, Check, Search, Clock, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LanguageProps {
  onNavigate?: (tab: string) => void;
}

export function Language({ onNavigate }: LanguageProps) {
  const { i18n } = useTranslation();
  const supportedCodes = new Set(["en", "fr", "es"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.resolvedLanguage?.split("-")[0] || "en",
  );

  const languages = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      region: "US",
      supported: supportedCodes.has("en"),
      popular: true,
    },
    {
      code: "es",
      name: "Spanish",
      nativeName: "Español",
      region: "ES",
      supported: supportedCodes.has("es"),
      popular: true,
    },
    {
      code: "fr",
      name: "French",
      nativeName: "Français",
      region: "FR",
      supported: supportedCodes.has("fr"),
      popular: true,
    },
    {
      code: "de",
      name: "German",
      nativeName: "Deutsch",
      region: "DE",
      supported: supportedCodes.has("de"),
      popular: true,
    },
    {
      code: "pt",
      name: "Portuguese",
      nativeName: "Português",
      region: "BR",
      supported: supportedCodes.has("pt"),
      popular: true,
    },
    {
      code: "ru",
      name: "Russian",
      nativeName: "Русский",
      region: "RU",
      supported: supportedCodes.has("ru"),
      popular: true,
    },
    {
      code: "ja",
      name: "Japanese",
      nativeName: "日本語",
      region: "JP",
      supported: supportedCodes.has("ja"),
      popular: false,
    },
    {
      code: "ko",
      name: "Korean",
      nativeName: "한국어",
      region: "KR",
      supported: supportedCodes.has("ko"),
      popular: false,
    },
    {
      code: "zh",
      name: "Chinese (Simplified)",
      nativeName: "简体中文",
      region: "CN",
      supported: supportedCodes.has("zh"),
      popular: false,
    },
    {
      code: "zh-TW",
      name: "Chinese (Traditional)",
      nativeName: "繁體中文",
      region: "TW",
      supported: supportedCodes.has("zh-TW"),
      popular: false,
    },
    {
      code: "it",
      name: "Italian",
      nativeName: "Italiano",
      region: "IT",
      supported: supportedCodes.has("it"),
      popular: false,
    },
    {
      code: "nl",
      name: "Dutch",
      nativeName: "Nederlands",
      region: "NL",
      supported: supportedCodes.has("nl"),
      popular: false,
    },
    {
      code: "pl",
      name: "Polish",
      nativeName: "Polski",
      region: "PL",
      supported: supportedCodes.has("pl"),
      popular: false,
    },
    {
      code: "tr",
      name: "Turkish",
      nativeName: "Türkçe",
      region: "TR",
      supported: supportedCodes.has("tr"),
      popular: false,
    },
    {
      code: "ar",
      name: "Arabic",
      nativeName: "العربية",
      region: "SA",
      supported: false,
      popular: false,
    },
    {
      code: "hi",
      name: "Hindi",
      nativeName: "हिन्दी",
      region: "IN",
      supported: false,
      popular: false,
    },
  ];

  const activeCode =
    i18n.resolvedLanguage?.split("-")[0] ||
    i18n.language?.split("-")[0] ||
    "en";
  const currentLanguage =
    languages.find((lang) => lang.code === activeCode) || languages[0];

  const recentlyUsed = languages.filter((lang) =>
    ["en", "es", "fr"].includes(lang.code),
  );

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const popularLanguages = filteredLanguages.filter(
    (lang) => lang.popular && lang.supported,
  );
  const otherLanguages = filteredLanguages.filter(
    (lang) => !lang.popular && lang.supported,
  );
  const comingSoon = filteredLanguages.filter((lang) => !lang.supported);

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.("settings")}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="mb-2">Language Settings</h1>
          <p className="text-muted-foreground">
            Choose your preferred language for the WannaBet interface
          </p>
        </div>
      </div>

      {/* Current Language */}
      <Card className="border-primary/50 hover-lift bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-primary" />
                Current Language
              </CardTitle>
              <CardDescription>
                {currentLanguage?.nativeName || "English"}
              </CardDescription>
            </div>
            <Badge className="bg-primary text-primary-foreground">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All interface text, notifications, and communications will be
            displayed in English.
          </p>
        </CardContent>
      </Card>

      {/* Search Languages */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recently Used */}
      {!searchQuery && recentlyUsed.length > 0 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Recently Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {recentlyUsed.map((language) => (
                <button
                  key={language.code}
                  onClick={() => setSelectedLanguage(language.code)}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getFlagEmoji(language.region)}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {language.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language.nativeName}
                      </p>
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Languages */}
      {popularLanguages.length > 0 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle className="text-base">Popular Languages</CardTitle>
            <CardDescription>
              Most commonly used languages on WannaBet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {popularLanguages.map((language, index) => (
                <button
                  key={language.code}
                  onClick={() => setSelectedLanguage(language.code)}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all text-left animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getFlagEmoji(language.region)}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {language.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language.nativeName}
                      </p>
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Languages */}
      {otherLanguages.length > 0 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle className="text-base">All Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {otherLanguages.map((language, index) => (
                <button
                  key={language.code}
                  onClick={() => setSelectedLanguage(language.code)}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all text-left animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getFlagEmoji(language.region)}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {language.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language.nativeName}
                      </p>
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming Soon */}
      {comingSoon.length > 0 && (
        <Card className="border-border/50 opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Coming Soon</CardTitle>
              <Badge className="bg-muted text-muted-foreground">
                In Development
              </Badge>
            </div>
            <CardDescription>
              These languages are being translated and will be available soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {comingSoon.map((language, index) => (
                <div
                  key={language.code}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30 cursor-not-allowed"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl opacity-50">
                      {getFlagEmoji(language.region)}
                    </span>
                    <div>
                      <p className="font-medium text-muted-foreground">
                        {language.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language.nativeName}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-muted text-muted-foreground text-xs">
                    Soon
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Button */}
      <div className="flex justify-end">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={
            !supportedCodes.has(selectedLanguage) ||
            selectedLanguage === activeCode
          }
          onClick={async () => {
            const next = selectedLanguage.split("-")[0];
            if (!supportedCodes.has(next)) return;
            localStorage.setItem("i18nextLng", next);
            await i18n.changeLanguage(next);
          }}
        >
          <Check className="h-4 w-4 mr-2" />
          {selectedLanguage === activeCode
            ? "Language Applied"
            : "Apply Language"}
        </Button>
      </div>

      {/* Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Translation Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            WannaBet is localized by our community of players and professional
            translators. If you'd like to help translate WannaBet into your
            language, please contact our support team.
          </p>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Translation completion:
            </span>
            <span className="text-sm font-medium text-foreground">100%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get flag emoji from region code
function getFlagEmoji(region: string): string {
  const flagMap: Record<string, string> = {
    US: "🇺🇸",
    ES: "🇪🇸",
    FR: "🇫🇷",
    DE: "🇩🇪",
    BR: "🇧🇷",
    RU: "🇷🇺",
    JP: "🇯🇵",
    KR: "🇰🇷",
    CN: "🇨🇳",
    TW: "🇹🇼",
    IT: "🇮🇹",
    NL: "🇳🇱",
    PL: "🇵🇱",
    TR: "🇹🇷",
    SA: "🇸🇦",
    IN: "🇮🇳",
  };
  return flagMap[region] || "🌐";
}
