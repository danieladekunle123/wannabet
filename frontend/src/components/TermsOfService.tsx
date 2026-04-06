import React from "react";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface TermsOfServiceProps {
  onNavigate?: (tab: string) => void;
}

const sections = [
  {
    number: "1",
    title: "Eligibility",
    content: [
      "You must be at least 18 years old to use WannaBet.",
      "By creating an account, you confirm that you are of legal age and that peer-to-peer skill wagering is permitted in your jurisdiction.",
      "WannaBet is not available in jurisdictions where such activity is prohibited by law. It is your responsibility to verify local laws before participating.",
    ],
  },
  {
    number: "2",
    title: "Nature of the Platform",
    content: [
      "WannaBet is a peer-to-peer (P2P) skill wagering platform. We do not operate as a bookmaker, casino, or gambling service.",
      "All wagers are placed directly between users based on gaming skill. WannaBet provides the infrastructure, escrow, and dispute resolution services.",
      "WannaBet takes a small platform fee from completed matches as described in the Wallet & Payments section.",
    ],
  },
  {
    number: "3",
    title: "User Accounts",
    content: [
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You may not share, sell, or transfer your account to another person.",
      "You must provide accurate information during registration. False identity claims may result in immediate suspension.",
      "Each user may maintain only one account. Duplicate accounts are prohibited.",
    ],
  },
  {
    number: "4",
    title: "Wallet & Payments",
    content: [
      "WannaBet maintains a virtual wallet for each user to facilitate wagers.",
      "Deposits are processed via Stripe. Minimum deposit and withdrawal amounts may apply.",
      "Withdrawals are subject to identity verification (KYC) where required by law.",
      "WannaBet charges a platform fee (currently 5%) on the pot of each completed wager match.",
      "Funds in your wallet are held securely and are not commingled with WannaBet's operational funds.",
    ],
  },
  {
    number: "5",
    title: "Escrow & Match Settlement",
    content: [
      "When a wager match is accepted, both parties' funds are placed into escrow.",
      "Funds are released automatically upon match result submission and confirmation.",
      "In the event of a dispute, funds remain in escrow until the matter is resolved by WannaBet's moderation team.",
      "WannaBet's decision on dispute outcomes is final unless overturned following a formal appeal.",
    ],
  },
  {
    number: "6",
    title: "Match Integrity",
    content: [
      "All participants must play their matches fairly and to the best of their ability.",
      "Match manipulation, sandbagging, collusion, or any form of cheating is strictly prohibited.",
      "Use of unauthorised software, exploits, macros, or external assistance tools during a match constitutes a violation.",
      "Matches must be conducted using the agreed game, settings, and format.",
    ],
  },
  {
    number: "7",
    title: "Dispute Resolution",
    content: [
      "If a match result is contested, either party may raise a dispute within 24 hours of the scheduled match end time.",
      "Disputes must be supported by evidence (screenshots, video clips, in-game data, etc.).",
      "WannaBet moderators will review submitted evidence and issue a ruling, typically within 48–72 hours.",
      "Repeated bad-faith disputes may result in account penalties.",
    ],
  },
  {
    number: "8",
    title: "Trust Score",
    content: [
      "WannaBet uses a Trust Score system to reflect user reliability and conduct.",
      "Trust Scores are affected by match completions, dispute outcomes, payment history, and community reports.",
      "A low Trust Score may restrict access to certain match types or platform features.",
      "Trust Score calculations are automated and WannaBet reserves the right to adjust scoring logic at any time.",
    ],
  },
  {
    number: "9",
    title: "Prohibited Activities",
    content: [
      "The following are strictly prohibited: account boosting for profit, use of multiple accounts, harassment or abuse of other users, fraudulent payment activity, exploiting platform bugs for financial gain, impersonating WannaBet staff or other users.",
      "Violations may result in immediate account suspension, forfeiture of wallet balance, and/or a permanent ban.",
    ],
  },
  {
    number: "10",
    title: "Account Suspension & Termination",
    content: [
      "WannaBet reserves the right to suspend or permanently ban any account in violation of these Terms.",
      "Users may appeal a suspension by contacting support within 14 days of the action.",
      "Upon termination, any pending funds in escrow will be handled at WannaBet's discretion, subject to dispute review.",
      "Funds in a terminated wallet may be forfeited if linked to fraudulent or prohibited activity.",
    ],
  },
  {
    number: "11",
    title: "Limitation of Liability",
    content: [
      'WannaBet provides its services on an "as is" basis. We do not guarantee uninterrupted availability or error-free operation.',
      "WannaBet is not liable for losses arising from platform outages, match cancellations, or user disputes beyond the escrow held.",
      "To the maximum extent permitted by law, WannaBet's total liability to any user shall not exceed the amount held in their wallet at the time of the event giving rise to the claim.",
    ],
  },
  {
    number: "12",
    title: "Changes to Terms",
    content: [
      "WannaBet may update these Terms at any time. Continued use of the platform after changes constitutes acceptance.",
      "Material changes will be communicated via in-app notification or email.",
    ],
  },
  {
    number: "13",
    title: "Contact",
    content: [
      "For questions about these Terms, please contact us at: danieladekunle123@gmail.com",
    ],
  },
];

export function TermsOfService({ onNavigate }: TermsOfServiceProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => onNavigate?.("settings")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Terms of Service
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Last updated: May 2025
          </p>
          <Badge variant="outline" className="mt-3 text-xs">
            By using WannaBet, you agree to these Terms
          </Badge>
        </div>

        {/* Intro */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Welcome to{" "}
              <span className="text-foreground font-semibold">WannaBet</span> —
              a competitive peer-to-peer skill wagering platform for esports.
              These Terms of Service ("Terms") govern your access to and use of
              our platform, including all features, services, and content.
              Please read them carefully before creating an account or placing
              any wagers.
            </p>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <Card key={idx} className="border-border/60">
              <CardHeader className="pb-3 pt-5">
                <CardTitle className="flex items-center gap-3 text-base">
                  <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {section.number}
                  </span>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <ul className="space-y-2">
                  {section.content.map((point, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground leading-relaxed flex gap-2"
                    >
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              {idx < sections.length - 1 && (
                <Separator className="opacity-30" />
              )}
            </Card>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-xs text-muted-foreground pb-8">
          <p>
            Questions? Contact us at{" "}
            <a
              href="mailto:danieladekunle123@gmail.com"
              className="text-primary hover:underline"
            >
              danieladekunle123@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
