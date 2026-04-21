import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription } from "./ui/alert";
import { Eye, EyeOff, Mail, Lock, Crown } from "lucide-react";
import { Footer } from "./Footer";
import { useAuth } from "./AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

interface LoginProps {
  onNavigate: (tab: string) => void;
  onSwitchToSignup: () => void;
}

export function Login({ onNavigate, onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent">("idle");
  const { login } = useAuth();
  const googleRedirectUri = window.location.origin;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setEmailUnverified(false);

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      onNavigate("home");
    } catch (err: any) {
      if (err.code === "EMAIL_NOT_VERIFIED" || err.message?.includes("verify your email")) {
        setEmailUnverified(true);
      }
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || resendStatus !== "idle") return;
    setResendStatus("loading");
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? ""}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    // Simulate social login
    setTimeout(() => {
      console.log(`${provider} login successful!`);
      onNavigate("home");
      setIsLoading(false);
    }, 1000);
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    redirect_uri: googleRedirectUri,
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL ?? ""}/auth/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: codeResponse.code,
              redirectUri: googleRedirectUri,
              mode: "signin",
            }),
          },
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Google login failed");
        }

        localStorage.setItem("token", data.token);
        window.location.reload();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Google login cancelled or failed");
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col animate-fadeIn relative">
      {/* Animated Background Gradients & Graphics */}
      <div className="gradient-blobs">
        <div className="gradient-blob gradient-blob-1" />
        <div className="gradient-blob gradient-blob-2" />
        <div className="gradient-blob gradient-blob-3" />
        <div className="gradient-blob gradient-blob-4" />
        <div className="gradient-blob gradient-blob-5" />
      </div>

      <div className="geometric-shapes">
        <div className="geometric-shape geometric-shape-1" />
        <div className="geometric-shape geometric-shape-2" />
        <div className="geometric-shape geometric-shape-3" />
        <div className="geometric-shape geometric-shape-4" />
      </div>

      <div className="grid-overlay" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center space-y-2 animate-fadeInDown">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">WannaBet?</h1>
            </div>
            <p className="text-muted-foreground">
              Welcome back! Sign in to your account
            </p>
          </div>

          <Card className="border-border bg-card/50 backdrop-blur-sm animate-scaleIn hover-lift transition-all duration-300">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-foreground">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-border hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                  onClick={() => googleLogin()}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-muted/30 border-border focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-muted/30 border-border focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="text-primary hover:text-primary/80 p-0 text-sm"
                  >
                    Forgot password?
                  </Button>
                </div>

                {error && (
                  <Alert className="border-destructive/50 text-destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {emailUnverified && (
                  <div className="text-center text-sm space-y-1">
                    <p className="text-muted-foreground">
                      Didn't get the email?
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary p-0 h-auto"
                      disabled={resendStatus !== "idle"}
                      onClick={handleResendVerification}
                    >
                      {resendStatus === "loading"
                        ? "Sending..."
                        : resendStatus === "sent"
                          ? "Verification email sent!"
                          : "Resend verification email"}
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center">
                <span className="text-muted-foreground">
                  Don't have an account?{" "}
                </span>
                <Button
                  variant="link"
                  className="text-primary hover:text-primary/80 p-0"
                  onClick={onSwitchToSignup}
                >
                  Sign up
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 p-0 text-xs"
              onClick={() => onNavigate("terms-of-service")}
            >
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 p-0 text-xs"
              onClick={() => onNavigate("privacy-policy")}
            >
              Privacy Policy
            </Button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
