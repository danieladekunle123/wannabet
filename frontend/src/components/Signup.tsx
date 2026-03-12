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
import { Progress } from "./ui/progress";
import { Eye, EyeOff, Mail, Lock, User, Check, X, Crown } from "lucide-react";
import { Footer } from "./Footer";
import { useAuth } from "./AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

interface SignupProps {
  onNavigate: (tab: string) => void;
  onSwitchToLogin: () => void;
}

export function Signup({ onNavigate, onSwitchToLogin }: SignupProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [wantsNewsletters, setWantsNewsletters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const googleRedirectUri = window.location.origin;

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;
    return { strength, checks };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthPercentage = (passwordStrength.strength / 5) * 100;
  const strengthColor =
    strengthPercentage < 40
      ? "bg-red-500"
      : strengthPercentage < 80
        ? "bg-yellow-500"
        : "bg-green-500";

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signup(formData.email, formData.username, formData.password);
      onNavigate("onboarding");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    setIsLoading(true);
    // Simulate social signup
    setTimeout(() => {
      console.log(`${provider} signup successful!`);
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
        const res = await fetch("http://localhost:4000/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: codeResponse.code,
            redirectUri: googleRedirectUri,
            mode: "signup",
          }),
        });

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
    <div className="min-h-screen bg-background flex flex-col relative">
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
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">WannaBet?</h1>
            </div>
            <p className="text-muted-foreground">
              Join the ultimate esports wagering platform
            </p>
          </div>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-foreground">
                Create Account
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Sign up to start competing and earning
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Social Signup Buttons */}
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
                  Sign up with Google
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or sign up with email
                  </span>
                </div>
              </div>

              {/* Email/Password Signup Form */}
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      className="pl-10 bg-muted/30 border-border focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
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
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
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

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={strengthPercentage}
                          className="flex-1 h-1"
                        />
                        <span className="text-xs text-muted-foreground">
                          {strengthPercentage < 40
                            ? "Weak"
                            : strengthPercentage < 80
                              ? "Medium"
                              : "Strong"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div
                          className={`flex items-center space-x-1 ${passwordStrength.checks.length ? "text-emerald-400" : "text-muted-foreground"}`}
                        >
                          {passwordStrength.checks.length ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>8+ characters</span>
                        </div>
                        <div
                          className={`flex items-center space-x-1 ${passwordStrength.checks.uppercase ? "text-emerald-400" : "text-muted-foreground"}`}
                        >
                          {passwordStrength.checks.uppercase ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Uppercase</span>
                        </div>
                        <div
                          className={`flex items-center space-x-1 ${passwordStrength.checks.lowercase ? "text-emerald-400" : "text-muted-foreground"}`}
                        >
                          {passwordStrength.checks.lowercase ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Lowercase</span>
                        </div>
                        <div
                          className={`flex items-center space-x-1 ${passwordStrength.checks.number ? "text-emerald-400" : "text-muted-foreground"}`}
                        >
                          {passwordStrength.checks.number ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="pl-10 pr-10 bg-muted/30 border-border focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-400 flex items-center space-x-1">
                        <X className="h-3 w-3" />
                        <span>Passwords do not match</span>
                      </p>
                    )}
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword && (
                      <p className="text-xs text-emerald-400 flex items-center space-x-1">
                        <Check className="h-3 w-3" />
                        <span>Passwords match</span>
                      </p>
                    )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) =>
                        setAgreedToTerms(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      I agree to the{" "}
                      <Button
                        variant="link"
                        className="text-primary hover:text-primary/80 p-0 text-sm h-auto"
                      >
                        Terms of Service
                      </Button>{" "}
                      and{" "}
                      <Button
                        variant="link"
                        className="text-primary hover:text-primary/80 p-0 text-sm h-auto"
                      >
                        Privacy Policy
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={wantsNewsletters}
                      onCheckedChange={(checked) =>
                        setWantsNewsletters(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="newsletter"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Send me updates about tournaments and promotions
                    </Label>
                  </div>
                </div>

                {error && (
                  <Alert className="border-destructive/50 text-destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/50"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p>
                  Connect your gaming accounts after signing up to unlock full
                  platform features
                </p>
              </div>

              <div className="text-center">
                <span className="text-muted-foreground">
                  Already have an account?{" "}
                </span>
                <Button
                  variant="link"
                  className="text-primary hover:text-primary/80 p-0"
                  onClick={onSwitchToLogin}
                >
                  Sign in
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            By creating an account, you confirm that you are 18+ years old and
            agree to our community guidelines.
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
