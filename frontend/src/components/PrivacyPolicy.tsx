import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface PrivacyPolicyProps {
  onNavigate?: (tab: string) => void;
}

const sections = [
  {
    number: "1",
    title: "Information We Collect",
    content: [
      "Account information: username, display name, email address, date of birth, and profile image.",
      "Activity data: matches played, wagers placed, results, Trust Score history, and dispute records.",
      "Financial data: transaction history and wallet balance. We do not store full card numbers — payment processing is handled by Stripe.",
      "Technical data: IP address, device type, browser, and general location (country/region) for security and fraud prevention.",
      "Communications: messages sent through our platform (used for dispute resolution and moderation).",
    ],
  },
  {
    number: "2",
    title: "How We Use Your Information",
    content: [
      "To operate and secure your account, including authentication and fraud detection.",
      "To facilitate match creation, result reporting, escrow, and payouts.",
      "To calculate and display your Trust Score.",
      "To comply with legal obligations, including identity verification where required.",
      "To communicate platform updates, policy changes, and account notices.",
      "To improve platform features using anonymised, aggregated usage data.",
    ],
  },
  {
    number: "3",
    title: "AI & Moderation",
    content: [
      "WannaBet may use automated systems to assist in detecting prohibited behaviour, match manipulation, and policy violations.",
      "AI-assisted tools do not make final decisions. All significant account actions (suspensions, dispute rulings) are reviewed by a human moderator.",
      "We do not use your personal data to train third-party AI models.",
    ],
  },
  {
    number: "4",
    title: "Payments & Stripe",
    content: [
      "All payment processing is handled by Stripe, a PCI-DSS compliant payment provider.",
      "WannaBet does not store your full card number, CVV, or bank credentials.",
      "Stripe's privacy practices are governed by their own privacy policy, available at stripe.com/privacy.",
    ],
  },
  {
    number: "5",
    title: "Data Sharing",
    content: [
      "We do not sell your personal data to third parties.",
      "We may share data with trusted service providers (e.g., Stripe for payments, cloud infrastructure providers) solely to operate the platform.",
      "We may disclose data to law enforcement or regulators when required by applicable law or to prevent fraud and harm.",
      "Aggregated, anonymised data may be shared publicly or with partners for analytics and research.",
    ],
  },
  {
    number: "6",
    title: "Data Retention",
    content: [
      "Account data is retained while your account is active.",
      "Upon account deletion, personal data is removed within 30 days, except where retention is required by law (e.g., financial transaction records).",
      "Dispute records and moderation logs may be retained for up to 3 years for audit and legal compliance purposes.",
    ],
  },
  {
    number: "7",
    title: "Security",
    content: [
      "We use industry-standard security measures including encrypted connections (HTTPS/TLS), hashed passwords, and access controls.",
      "While we take data protection seriously, no system is completely impenetrable. We encourage you to use a strong, unique password and enable any available account security features.",
      "In the event of a data breach affecting your personal information, we will notify you in accordance with applicable law.",
    ],
  },
  {
    number: "8",
    title: "Your Rights",
    content: [
      "You have the right to access the personal data we hold about you.",
      "You may request corrections to inaccurate data at any time through your account settings.",
      "You may request account deletion at any time. Some data may be retained for legal compliance.",
      "You may opt out of non-essential communications through your notification preferences.",
      "To exercise your rights, contact us at danieladekunle123@gmail.com.",
    ],
  },
  {
    number: "9",
    title: "Cookies",
    content: [
      "WannaBet uses cookies and similar technologies for authentication, session management, and basic analytics.",
      "Essential cookies are required for the platform to function. You may disable non-essential cookies through your browser settings, though this may affect your experience.",
    ],
  },
  {
    number: "10",
    title: "Children Under 18",
    content: [
      "WannaBet is strictly intended for users aged 18 and over.",
      "We do not knowingly collect data from users under 18. If we become aware that a minor has created an account, it will be suspended immediately and data deleted.",
      "If you believe a minor is using our platform, please contact us at danieladekunle123@gmail.com.",
    ],
  },
  {
    number: "11",
    title: "Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. Material changes will be communicated via in-app notification or email.",
      "Continued use of the platform following any updates constitutes your acceptance of the revised policy.",
    ],
  },
  {
    number: "12",
    title: "Contact",
    content: [
      "If you have questions, concerns, or requests regarding this Privacy Policy, please contact us at: danieladekunle123@gmail.com",
    ],
  },
];

export function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
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
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Last updated: May 2025
          </p>
          <Badge variant="outline" className="mt-3 text-xs">
            Your privacy matters to us
          </Badge>
        </div>

        {/* Intro */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              At <span className="text-foreground font-semibold">WannaBet</span>
              , we are committed to protecting your personal data. This Privacy
              Policy explains what information we collect, how we use it, and
              the choices available to you. By using WannaBet, you agree to the
              practices described in this policy.
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
