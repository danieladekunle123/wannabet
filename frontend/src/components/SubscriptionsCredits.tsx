import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Crown,
  Check,
  Zap,
  Shield,
  Star,
  Gift,
  TrendingUp,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";

interface SubscriptionsCreditsProps {
  onNavigate?: (tab: string) => void;
}

export function SubscriptionsCredits({
  onNavigate,
}: SubscriptionsCreditsProps) {
  const { currency, rates } = useCurrency();
  const subscriptionTiers = [
    {
      name: "Free",
      price: 0,
      period: "forever",
      description: "Perfect for casual players",
      features: [
        "Access to public lobbies",
        "Basic matchmaking",
        "5% transaction fee",
        "Community support",
        "Match history (30 days)",
      ],
      current: false,
    },
    {
      name: "Pro",
      price: 9.99,
      period: "month",
      description: "For serious competitors",
      features: [
        "All Free features",
        "Priority matchmaking",
        "2.5% transaction fee",
        "Priority support",
        "Unlimited match history",
        "Custom profile badge",
        "Tournament entry discounts",
      ],
      current: true,
      popular: true,
    },
    {
      name: "Elite",
      price: 24.99,
      period: "month",
      description: "For professional players",
      features: [
        "All Pro features",
        "VIP matchmaking",
        "0% transaction fee",
        "Dedicated support",
        "Exclusive tournaments",
        "Elite profile badge",
        "Team management tools",
        "Advanced analytics",
        "Private scrims hosting",
      ],
      current: false,
      premium: true,
    },
  ];

  const creditPackages = [
    { amount: 100, price: 10, bonus: 0 },
    { amount: 250, price: 25, bonus: 10 },
    { amount: 500, price: 50, bonus: 25, popular: true },
    { amount: 1000, price: 100, bonus: 100 },
  ];

  const purchaseHistory = [
    {
      id: 1,
      type: "subscription",
      item: "Pro Monthly",
      amount: 9.99,
      date: "Dec 1, 2024",
      status: "active",
    },
    {
      id: 2,
      type: "credits",
      item: "500 Credits + 25 Bonus",
      amount: 50,
      date: "Nov 28, 2024",
      status: "completed",
    },
    {
      id: 3,
      type: "credits",
      item: "250 Credits + 10 Bonus",
      amount: 25,
      date: "Nov 15, 2024",
      status: "completed",
    },
  ];

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
          <h1 className="mb-2">Subscriptions & Credits</h1>
          <p className="text-muted-foreground">
            Manage your subscription and purchase credits
          </p>
        </div>
      </div>

      {/* Current Subscription */}
      <Card className="border-primary/50 hover-lift bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-primary" />
                Current Subscription
              </CardTitle>
              <CardDescription>Pro Plan</CardDescription>
            </div>
            <Badge className="bg-primary text-primary-foreground">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-foreground">
              {formatCurrencyFromEur(9.99, currency, rates)}
            </span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next billing date:</span>
              <span className="font-medium text-foreground">
                January 1, 2025
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment method:</span>
              <span className="font-medium text-foreground">•••• 4242</span>
            </div>
          </div>

          <Separator />

          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1 border-primary/50 text-primary hover:bg-primary/10"
            >
              Change Plan
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div>
        <h2 className="mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {subscriptionTiers.map((tier, index) => (
            <Card
              key={tier.name}
              className={`border-border/50 hover-lift relative ${
                tier.popular
                  ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent"
                  : ""
              } ${tier.premium ? "border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-transparent" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              {tier.premium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{tier.name}</span>
                  {tier.current && (
                    <Badge className="bg-emerald-600 text-white text-xs">
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="pt-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-foreground">
                      {formatCurrencyFromEur(tier.price, currency, rates)}
                    </span>
                    <span className="text-muted-foreground">
                      /{tier.period}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    tier.current
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : tier.premium
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                  disabled={tier.current}
                >
                  {tier.current
                    ? "Current Plan"
                    : tier.price === 0
                      ? "Downgrade"
                      : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit Packages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2>Credit Packages</h2>
          <Badge className="bg-emerald-600 text-white">
            <Zap className="h-3 w-3 mr-1" />
            Instant Delivery
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {creditPackages.map((pkg, index) => (
            <Card
              key={pkg.amount}
              className={`border-border/50 hover-lift flex flex-col ${
                pkg.popular
                  ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent relative"
                  : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    Best Value
                  </Badge>
                </div>
              )}
              <CardHeader className="flex-grow-0">
                <CardTitle className="text-2xl">{pkg.amount}</CardTitle>
                <CardDescription>Credits</CardDescription>
                <div className="h-8 flex items-start pt-2">
                  {pkg.bonus > 0 ? (
                    <Badge className="bg-emerald-600 text-white w-fit">
                      <Gift className="h-3 w-3 mr-1" />+{pkg.bonus} Bonus
                    </Badge>
                  ) : (
                    <Badge className="bg-muted/50 text-muted-foreground w-fit border border-border/50">
                      <Gift className="h-3 w-3 mr-1" />
                      No Bonus
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow justify-end space-y-4">
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrencyFromEur(pkg.price, currency, rates)}
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Purchase
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Purchase History */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Purchase History
          </CardTitle>
          <CardDescription>
            View your subscription and credit purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {purchaseHistory.map((purchase, index) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      purchase.type === "subscription"
                        ? "bg-primary/20"
                        : "bg-emerald-600/20"
                    }`}
                  >
                    {purchase.type === "subscription" ? (
                      <Crown className="h-4 w-4 text-primary" />
                    ) : (
                      <Zap className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {purchase.item}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {purchase.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">
                    {formatCurrencyFromEur(purchase.amount, currency, rates)}
                  </div>
                  <Badge
                    className={`text-xs ${
                      purchase.status === "active"
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {purchase.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits Info */}
      <Card className="border-border/50 hover-lift bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-primary" />
            Subscription Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-medium text-foreground">Lower Fees</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Save up to 5% on every transaction with premium subscriptions
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-medium text-foreground">Priority Access</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Get matched faster with priority queue placement
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Gift className="h-5 w-5 text-primary" />
                <h4 className="font-medium text-foreground">
                  Exclusive Events
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Access subscriber-only tournaments and special events
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
