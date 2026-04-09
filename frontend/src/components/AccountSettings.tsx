import React, { useEffect, useState } from "react";
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
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit2,
  Camera,
  Check,
  X,
  Sun,
  Moon,
  Palette,
  Link2,
  Gamepad2,
  MessageSquare,
  Twitch,
  Youtube,
  Twitter,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useTheme } from "./ThemeContext";
import { useAuth } from "./AuthContext";
import { UserAvatar } from "./UserAvatar";
import { GifPicker } from "./GifPicker";
import api from "../lib/api";
import { uploadFile } from "../services/uploadService";
import { usePresence, type UserStatus } from "../context/PresenceContext";

interface AccountSettingsProps {
  onNavigate?: (tab: string) => void;
}

export function AccountSettings({ onNavigate }: AccountSettingsProps) {
  const { mode, color, setMode, setColor } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const { user, refreshUser, logout } = useAuth();
  const { setManualStatus, getStatus } = usePresence();
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [dangerLoading, setDangerLoading] = useState(false);
  const [dangerError, setDangerError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL ?? "";

  async function handleDeactivate() {
    setDangerLoading(true);
    setDangerError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/me/deactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message);
      logout();
    } catch (err: any) {
      setDangerError(err.message || "Failed to deactivate account");
    } finally {
      setDangerLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDangerLoading(true);
    setDangerError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation: "DELETE MY ACCOUNT" }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      logout();
    } catch (err: any) {
      setDangerError(err.message || "Failed to delete account");
    } finally {
      setDangerLoading(false);
    }
  }
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [countries, setCountries] = useState<
    Array<{
      name: string;
      code: string;
      flag: string;
      region: string;
      timezones: string[];
      matchmakingRegion: string;
    }>
  >([]);
  const [regions, setRegions] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const GIPHY_API_KEY =
    import.meta.env.VITE_GIPHY_API_KEY || "wYChZ0CXRzFrNp3kVR2bzsAqFHeBWyh2";

  const [formData, setFormData] = useState(() => ({
    username: user?.username ?? "",
    displayName: user?.profile?.displayName ?? user?.username ?? "",
    email: user?.email ?? "",
    phone: "",
    country: user?.profile?.country ?? "",
    region: user?.profile?.region ?? "",
    bio: "",
  }));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.getCountriesAndRegions();
        if (cancelled) return;
        setCountries(Array.isArray(data.countries) ? data.countries : []);
        setRegions(Array.isArray(data.regions) ? data.regions : []);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = () => {
    (async () => {
      try {
        // update username/display name on account
        await api.updateMyAccount({
          username: formData.username,
          displayName: formData.displayName,
        });

        // update profile fields managed in settings
        await api.updateMyProfile({
          bio: formData.bio,
          country: formData.country || null,
          region: formData.region || null,
        });

        // refresh global user
        await refreshUser();
        setIsEditing(false);
      } catch (err: any) {
        console.error(err);
        // TODO: show user-facing error
      }
    })();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: user?.username ?? "",
      displayName: user?.profile?.displayName ?? user?.username ?? "",
      email: user?.email ?? "",
      phone: "",
      country: user?.profile?.country ?? "",
      region: user?.profile?.region ?? "",
      bio: "",
    });
  };

  const selectedCountry =
    countries.find((country) => country.code === formData.country) || null;

  const handleAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadFile(file, "profile");
      await api.setMyProfileImageUrl(url);
      await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleGifSelected = async (gifUrl: string) => {
    try {
      await api.setMyProfileImageUrl(gifUrl);
      await refreshUser();
      setShowGifPicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {showGifPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Choose Profile GIF
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGifPicker(false)}
              >
                Close
              </Button>
            </div>
            <GifPicker apiKey={GIPHY_API_KEY} onSelect={handleGifSelected} />
          </div>
        </div>
      )}

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
          <h1 className="mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account preferences
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profile Information</span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Your public profile information visible to other players
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <UserAvatar
                className="h-24 w-24 border-2 border-primary/50"
                name={user?.profile?.displayName || user?.username}
                username={user?.username}
                imageUrl={user?.profileImageUrl || user?.avatarUrl}
              />
              {isEditing && (
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-xl">{formData.displayName}</h3>
                <Badge className="bg-emerald-600 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                @{formData.username}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since January 2024
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isUploadingAvatar ? "Uploading..." : "Upload Image"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowGifPicker(true)}
              >
                Choose GIF
              </Button>
            </div>
          )}

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled={!isEditing}
                className="bg-input-background"
              />
              <p className="text-xs text-muted-foreground">
                Your unique identifier on WannaBet
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                disabled={!isEditing}
                className="bg-input-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!isEditing}
                  className="pl-10 bg-input-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={!isEditing}
                  className="pl-10 bg-input-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    country: value === "none" ? "" : value,
                  })
                }
                disabled={!isEditing}
              >
                <SelectTrigger id="country" className="bg-input-background">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">Prefer not to say</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCountry?.flag && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <img
                    src={selectedCountry.flag}
                    alt={`${selectedCountry.name} flag`}
                    className="h-3 w-5 rounded-sm object-cover"
                  />
                  <span>{selectedCountry.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Matchmaking Region</Label>
              <Select
                value={formData.region || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    region: value === "none" ? "" : value,
                  })
                }
                disabled={!isEditing}
              >
                <SelectTrigger id="region" className="bg-input-background">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auto-detect</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              disabled={!isEditing}
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-border"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Customization */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2 text-primary" />
            Theme Customization
          </CardTitle>
          <CardDescription>
            Personalize your WannaBet? experience with custom themes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark/Light Mode Toggle */}
          <div className="space-y-3">
            <Label>Appearance Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("light")}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  mode === "light"
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-border bg-muted/30 hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Sun
                    className={`h-6 w-6 ${mode === "light" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-sm font-medium ${mode === "light" ? "text-primary" : "text-foreground"}`}
                  >
                    Light Mode
                  </span>
                </div>
                {mode === "light" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>

              <button
                onClick={() => setMode("dark")}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  mode === "dark"
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-border bg-muted/30 hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Moon
                    className={`h-6 w-6 ${mode === "dark" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-sm font-medium ${mode === "dark" ? "text-primary" : "text-foreground"}`}
                  >
                    Dark Mode
                  </span>
                </div>
                {mode === "dark" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            </div>
          </div>

          <Separator />

          {/* Color Theme Selection */}
          <div className="space-y-3">
            <Label>Accent Color</Label>
            <p className="text-sm text-muted-foreground">
              Choose your preferred accent color for buttons, links, and
              highlights
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { name: "red", label: "Red", color: "#E50914" },
                { name: "orange", label: "Orange", color: "#FF8C00" },
                { name: "green", label: "Green", color: "#10B981" },
                { name: "blue", label: "Blue", color: "#3B82F6" },
                { name: "purple", label: "Purple", color: "#A855F7" },
                { name: "pink", label: "Pink", color: "#EC4899" },
              ].map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setColor(theme.name as any)}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-110 ${
                    color === theme.name
                      ? "border-primary shadow-lg"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  style={{
                    backgroundColor:
                      color === theme.name ? `${theme.color}15` : "transparent",
                  }}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background"
                      style={{
                        backgroundColor: theme.color,
                        ringColor:
                          color === theme.name ? theme.color : "transparent",
                      }}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {theme.label}
                    </span>
                  </div>
                  {color === theme.name && (
                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Preferences */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle>Account Preferences</CardTitle>
          <CardDescription>
            Customize your account settings and visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Set Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Set Status</Label>
              <p className="text-sm text-muted-foreground">
                Choose how you appear to others
              </p>
            </div>
            <Select
              value={user ? getStatus(user.id) : "offline"}
              onValueChange={(val) => setManualStatus(val as UserStatus)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </SelectItem>
                <SelectItem value="idle">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    Idle
                  </span>
                </SelectItem>
                <SelectItem value="dnd">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Do Not Disturb
                  </span>
                </SelectItem>
                <SelectItem value="offline">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Appear Offline
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to all users
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Online Status</Label>
              <p className="text-sm text-muted-foreground">
                Let others see when you're online
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Match History</Label>
              <p className="text-sm text-muted-foreground">
                Display your recent matches on your profile
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Friend Requests</Label>
              <p className="text-sm text-muted-foreground">
                Let other players send you friend requests
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 hover-lift">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-amber-500/30 rounded-lg bg-amber-500/5">
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">
                Deactivate Account
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Temporarily disable your account. You can reactivate anytime.
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Profile hidden from other users</li>
                <li>• Easy to reactivate by logging back in</li>
                <li>• All data preserved for your return</li>
              </ul>
            </div>
            <Button
              variant="outline"
              className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 shrink-0"
              onClick={() => {
                setDangerError("");
                setShowDeactivateDialog(true);
              }}
            >
              Deactivate
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">
                Delete Account
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Permanently delete your account and all data. This cannot be
                undone.
              </p>
              <ul className="text-xs text-destructive space-y-0.5">
                <li>• All data permanently deleted</li>
                <li>• Cannot be recovered or reactivated</li>
                <li>• Irreversible action</li>
              </ul>
            </div>
            <Button
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90 shrink-0"
              onClick={() => {
                setDangerError("");
                setDeleteConfirmText("");
                setShowDeleteDialog(true);
              }}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate confirmation */}
      <AlertDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile will be hidden from other users. You can reactivate
              at any time by logging back in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dangerError && (
            <p className="text-sm text-destructive px-1">{dangerError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dangerLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={dangerLoading}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                void handleDeactivate();
              }}
            >
              {dangerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Deactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Permanently delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data.
              This action <strong>cannot be undone</strong>.
              <br />
              <br />
              Type <strong>DELETE MY ACCOUNT</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            className="mt-1"
          />
          {dangerError && (
            <p className="text-sm text-destructive px-1">{dangerError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dangerLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={
                dangerLoading || deleteConfirmText !== "DELETE MY ACCOUNT"
              }
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                void handleDeleteAccount();
              }}
            >
              {dangerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
