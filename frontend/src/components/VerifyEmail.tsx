import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface VerifyEmailProps {
  onNavigate: (tab: string) => void;
}

export function VerifyEmail({ onNavigate }: VerifyEmailProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [tokenExpired, setTokenExpired] = useState(false);

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token found in this link.");
      return;
    }

    fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully.");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
          if (data.code === "TOKEN_EXPIRED") {
            setTokenExpired(true);
          }
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not connect to the server. Please try again.");
      });
  }, []);

  const handleResend = async () => {
    if (!resendEmail.trim()) return;
    setResendStatus("loading");
    setResendMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus("sent");
        setResendMessage(data.message);
      } else {
        setResendStatus("error");
        setResendMessage(data.message || "Failed to resend. Please try again.");
      }
    } catch {
      setResendStatus("error");
      setResendMessage("Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">WannaBet</h1>
          <p className="text-muted-foreground text-sm mt-1">Email Verification</p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {status === "loading" && (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              )}
              {status === "error" && (
                <XCircle className="h-12 w-12 text-red-400" />
              )}
            </div>
            <CardTitle className="text-xl">
              {status === "loading" && "Verifying your email..."}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{message}</p>

            {status === "success" && (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => onNavigate("login")}
              >
                Go to Login
              </Button>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate("home")}
                >
                  Back to Home
                </Button>

                {/* Resend section */}
                <div className="border-t border-border pt-4 space-y-3 text-left">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Resend verification email
                  </p>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    className="w-full"
                    disabled={resendStatus === "loading" || resendStatus === "sent"}
                    onClick={handleResend}
                  >
                    {resendStatus === "loading" ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                    ) : resendStatus === "sent" ? (
                      "Email Sent!"
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>
                  {resendMessage && (
                    <Alert className={resendStatus === "error" ? "border-destructive/50 text-destructive" : "border-emerald-600/50 text-emerald-400"}>
                      <AlertDescription>{resendMessage}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
