import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Bug,
  Upload,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface ReportBugProps {
  onNavigate?: (tab: string) => void;
}

interface BugReportRecord {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  imageUrl: string | null;
  adminNote: string | null;
  createdAt: string;
}

export function ReportBug({ onNavigate }: ReportBugProps) {
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    severity: "",
    description: "",
    steps: "",
  });

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const [myReports, setMyReports] = useState<BugReportRecord[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const fetchMyReports = async () => {
    if (!token) return;
    setReportsLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/bug-reports/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyReports(data as BugReportRecord[]);
      }
    } catch {
      // ignore
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    void fetchMyReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setScreenshot(null);
      setScreenshotPreview(null);
      return;
    }
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = new FormData();
      body.append("title", formData.title);
      body.append("category", formData.category);
      body.append("severity", formData.severity);
      body.append("description", formData.description);
      if (formData.steps) body.append("steps", formData.steps);
      if (screenshot) body.append("screenshot", screenshot);

      const res = await fetch(`${API_URL}/users/bug-reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message || "Failed to submit report",
        );
      }

      const data = (await res.json()) as { id: string };
      setSubmittedId(data.id);
      void fetchMyReports();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      severity: "",
      description: "",
      steps: "",
    });
    setScreenshot(null);
    setScreenshotPreview(null);
    setSubmittedId(null);
    setSubmitError(null);
  };

  const severityColor = (s: string) => {
    if (s === "critical") return "bg-red-600 text-white";
    if (s === "high") return "bg-orange-600 text-white";
    if (s === "medium") return "bg-amber-600 text-white";
    return "bg-blue-600 text-white";
  };

  const statusColor = (s: string) => {
    if (s === "fixed" || s === "closed") return "bg-emerald-600 text-white";
    if (s === "investigating") return "bg-amber-600 text-white";
    return "bg-muted text-muted-foreground border border-border";
  };

  // Success screen
  if (submittedId) {
    return (
      <div className="space-y-6 animate-fadeInUp">
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
            <h1 className="mb-2">Report a Bug</h1>
            <p className="text-muted-foreground">
              Help us improve WannaBet by reporting issues
            </p>
          </div>
        </div>

        <Card className="border-emerald-600/50 bg-gradient-to-br from-emerald-600/10 to-transparent">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mb-2">Bug Report Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for helping us improve WannaBet. We've received your
              report and our team will investigate it shortly.
            </p>
            <div className="space-y-3">
              <div className="p-4 border border-border rounded-lg bg-card text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Report ID
                  </span>
                  <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                    #{submittedId.slice(0, 8).toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Track your report status in "Your Recent Reports" below
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={resetForm}
                >
                  Report Another Bug
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setSubmittedId(null)}
                >
                  View My Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="mb-2">Report a Bug</h1>
          <p className="text-muted-foreground">
            Help us improve WannaBet by reporting issues you encounter
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Bug className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Before Reporting
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Please include as much detail as possible to help us reproduce
                and fix the bug faster.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bug Report Form */}
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-6"
      >
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle>Bug Details</CardTitle>
            <CardDescription>
              Provide information about the bug you encountered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Bug Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="bg-input-background"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui">User Interface</SelectItem>
                    <SelectItem value="match">Match/Lobby</SelectItem>
                    <SelectItem value="wallet">Wallet/Payments</SelectItem>
                    <SelectItem value="tournament">Tournaments</SelectItem>
                    <SelectItem value="messaging">Messaging</SelectItem>
                    <SelectItem value="profile">Profile/Account</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) =>
                    setFormData({ ...formData, severity: value })
                  }
                  required
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">
                      Critical - App Unusable
                    </SelectItem>
                    <SelectItem value="high">
                      High - Major Feature Broken
                    </SelectItem>
                    <SelectItem value="medium">
                      Medium - Feature Partially Working
                    </SelectItem>
                    <SelectItem value="low">Low - Minor Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="Describe what happened and what you expected to happen..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Steps to Reproduce</Label>
              <textarea
                id="steps"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe that..."
                value={formData.steps}
                onChange={(e) =>
                  setFormData({ ...formData, steps: e.target.value })
                }
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                List the steps to reproduce the bug
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle>Screenshot</CardTitle>
            <CardDescription>
              Attach a screenshot to help us understand the issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />

              {screenshotPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full max-h-64 object-contain bg-muted/20"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={() => handleFileChange(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    {screenshot?.name}
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Browser:</p>
                <p className="text-foreground font-medium">
                  {navigator.userAgent.includes("Chrome")
                    ? "Chrome"
                    : navigator.userAgent.includes("Firefox")
                      ? "Firefox"
                      : navigator.userAgent.includes("Safari")
                        ? "Safari"
                        : "Unknown"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Platform:</p>
                <p className="text-foreground font-medium">
                  {navigator.platform || "Unknown"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Screen Resolution:</p>
                <p className="text-foreground font-medium">
                  {window.screen.width}x{window.screen.height}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Time of Issue:</p>
                <p className="text-foreground font-medium">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {submitError && (
          <p className="text-sm text-red-400 text-center">{submitError}</p>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            className="border-border"
            onClick={() => onNavigate?.("settings")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={
              submitting ||
              !formData.title ||
              !formData.category ||
              !formData.severity ||
              !formData.description
            }
          >
            {submitting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Submitting…
              </>
            ) : (
              <>
                <Bug className="h-4 w-4 mr-2" />
                Submit Bug Report
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Recent Reports */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle>Your Recent Reports</CardTitle>
          <CardDescription>
            Track the status of your submitted bug reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <p className="text-sm text-muted-foreground">Loading reports…</p>
          ) : myReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reports submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {myReports.map((report, index) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="space-y-2 flex-1 min-w-0 mr-3">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className="text-xs font-mono shrink-0"
                      >
                        #{report.id.slice(0, 8).toUpperCase()}
                      </Badge>
                      <h4 className="font-medium text-foreground truncate">
                        {report.title}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground flex-wrap gap-y-1">
                      <span>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{report.category}</span>
                      <span>•</span>
                      <Badge
                        className={`text-xs ${severityColor(report.severity)}`}
                      >
                        {report.severity}
                      </Badge>
                    </div>
                    {report.adminNote && (
                      <p className="text-xs text-primary italic mt-1">
                        Admin note: {report.adminNote}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`text-xs flex items-center shrink-0 ${statusColor(report.status)}`}
                  >
                    {(report.status === "fixed" ||
                      report.status === "closed") && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {report.status === "investigating" && (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {report.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
