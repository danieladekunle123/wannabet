import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Search,
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Gavel,
  TrendingUp,
  DollarSign,
  Trophy,
  Target,
  MessageSquare,
  Flag,
  Eye,
  UserX,
  AlertCircle,
  FileText,
  Activity,
  Users,
  Upload,
  Link as LinkIcon,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Hash,
  ArrowLeft,
  Download,
  Paperclip,
  Image as ImageIcon,
  Video,
  FileWarning,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

interface InvestigationCase {
  id: string;
  playerId: string;
  playerName: string;
  status: "active" | "under-review" | "escalated" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  createdAt: string;
  lastUpdated: string;
  category: string;
}

interface MatchRecord {
  id: string;
  game: string;
  opponent: string;
  result: "win" | "loss";
  wagerAmount: number;
  date: string;
  duration: string;
  suspicious: boolean;
  notes: string;
}

interface ChatLog {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  message: string;
  flagged: boolean;
  severity?: "low" | "medium" | "high";
}

interface Report {
  id: string;
  reportedBy: string;
  reason: string;
  description: string;
  timestamp: string;
  matchId?: string;
  status: "pending" | "reviewed" | "actioned";
  evidence: string[];
}

export function ModeratorInvestigate({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [investigationNote, setInvestigationNote] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<string>("");
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);

  const investigationCase: InvestigationCase = {
    id: "INV-2024-001",
    playerId: "P-45892",
    playerName: "ShadyPlayer99",
    status: "under-review",
    priority: "high",
    assignedTo: "You",
    createdAt: "2024-03-01",
    lastUpdated: "2 hours ago",
    category: "Suspected Match Fixing",
  };

  const playerInfo = {
    username: "ShadyPlayer99",
    email: "player@email.com",
    accountCreated: "2024-01-15",
    lastLogin: "2 hours ago",
    lastIP: "192.168.1.105",
    location: "Los Angeles, CA",
    trustScore: 45.2,
    totalMatches: 89,
    wins: 23,
    losses: 66,
    winRate: 25.8,
    totalEarnings: -580,
    totalWagered: 4200,
    avgWagerSize: 47,
    mmr: 1120,
    status: "warned",
    reports: 7,
    suspensions: 2,
    warnings: 4,
    verificationStatus: "unverified",
    paymentMethod: "PayPal (ending in 1234)",
    linkedAccounts: ["Discord", "Steam"],
    deviceFingerprint: "D-89AFE234",
    referralCode: "SHADY99",
  };

  const matchHistory: MatchRecord[] = [
    {
      id: "M-001",
      game: "CS2",
      opponent: "ProGamer23",
      result: "loss",
      wagerAmount: 50,
      date: "2024-03-05",
      duration: "45m",
      suspicious: true,
      notes: "Unusual betting pattern detected",
    },
    {
      id: "M-002",
      game: "Valorant",
      opponent: "TeamAlpha",
      result: "loss",
      wagerAmount: 100,
      date: "2024-03-04",
      duration: "32m",
      suspicious: true,
      notes: "Match ended suspiciously early",
    },
    {
      id: "M-003",
      game: "League of Legends",
      opponent: "MidLaneKing",
      result: "win",
      wagerAmount: 25,
      date: "2024-03-03",
      duration: "52m",
      suspicious: false,
      notes: "Normal match progression",
    },
    {
      id: "M-004",
      game: "CS2",
      opponent: "SkillMaster",
      result: "loss",
      wagerAmount: 75,
      date: "2024-03-02",
      duration: "28m",
      suspicious: true,
      notes: "Player disconnected mid-match",
    },
    {
      id: "M-005",
      game: "Valorant",
      opponent: "EsportsLegend",
      result: "loss",
      wagerAmount: 60,
      date: "2024-03-01",
      duration: "38m",
      suspicious: false,
      notes: "",
    },
  ];

  const chatLogs: ChatLog[] = [
    {
      id: "C-001",
      timestamp: "2024-03-05 14:23",
      from: "ShadyPlayer99",
      to: "ProGamer23",
      message: "Want to throw this match? I'll split the earnings",
      flagged: true,
      severity: "high",
    },
    {
      id: "C-002",
      timestamp: "2024-03-05 14:25",
      from: "ProGamer23",
      to: "ShadyPlayer99",
      message: "No thanks, reported",
      flagged: false,
    },
    {
      id: "C-003",
      timestamp: "2024-03-04 19:45",
      from: "ShadyPlayer99",
      to: "TeamAlpha",
      message: "You're terrible at this game",
      flagged: true,
      severity: "medium",
    },
    {
      id: "C-004",
      timestamp: "2024-03-03 12:10",
      from: "ShadyPlayer99",
      to: "MidLaneKing",
      message: "Good game!",
      flagged: false,
    },
    {
      id: "C-005",
      timestamp: "2024-03-02 16:30",
      from: "ShadyPlayer99",
      to: "SkillMaster",
      message: "My internet is lagging...",
      flagged: true,
      severity: "low",
    },
  ];

  const reports: Report[] = [
    {
      id: "R-001",
      reportedBy: "ProGamer23",
      reason: "Match Fixing Attempt",
      description:
        "Player attempted to convince me to throw the match for profit sharing. Screenshot attached.",
      timestamp: "2024-03-05 14:30",
      matchId: "M-001",
      status: "reviewed",
      evidence: ["screenshot_001.png", "chat_log.txt"],
    },
    {
      id: "R-002",
      reportedBy: "TeamAlpha",
      reason: "Toxic Behavior",
      description: "Player was extremely toxic in chat throughout the match.",
      timestamp: "2024-03-04 20:15",
      matchId: "M-002",
      status: "reviewed",
      evidence: ["chat_log_002.txt"],
    },
    {
      id: "R-003",
      reportedBy: "SkillMaster",
      reason: "Suspected Intentional Disconnect",
      description:
        "Player disconnected when losing, causing match to be voided.",
      timestamp: "2024-03-02 17:00",
      matchId: "M-004",
      status: "pending",
      evidence: ["match_replay.mp4"],
    },
    {
      id: "R-004",
      reportedBy: "RandomUser",
      reason: "Harassment",
      description:
        "Received threatening messages after declining match invitation.",
      timestamp: "2024-02-28 11:22",
      status: "actioned",
      evidence: ["dm_screenshot.png"],
    },
  ];

  const behavioralData = [
    { week: "Week 1", matches: 12, winRate: 45, reportsReceived: 0 },
    { week: "Week 2", matches: 18, winRate: 38, reportsReceived: 1 },
    { week: "Week 3", matches: 24, winRate: 28, reportsReceived: 2 },
    { week: "Week 4", matches: 19, winRate: 21, reportsReceived: 3 },
    { week: "Week 5", matches: 16, winRate: 26, reportsReceived: 1 },
  ];

  const wagerPatternData = [
    { date: "Mar 1", amount: 60, outcome: "loss" },
    { date: "Mar 2", amount: 75, outcome: "loss" },
    { date: "Mar 3", amount: 25, outcome: "win" },
    { date: "Mar 4", amount: 100, outcome: "loss" },
    { date: "Mar 5", amount: 50, outcome: "loss" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-900/20 text-red-300 border-red-900/30";
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "under-review":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "escalated":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "closed":
        return "bg-muted/20 text-muted-foreground border-muted/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const handleCloseCase = () => {
    console.log("Closing investigation case:", investigationCase.id);
  };
  const handleEscalateCase = () => {
    console.log("Escalating investigation case:", investigationCase.id);
  };
  const handleTakeAction = () => {
    console.log("Taking action:", actionType, "with note:", investigationNote);
  };

  return (
    <div className="min-h-full pt-16 lg:pl-64 bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="border-primary/30 hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Eye className="h-8 w-8 text-primary" />
                  Investigation: {investigationCase.id}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Detailed investigation for player{" "}
                  <span className="text-foreground font-semibold">
                    {investigationCase.playerName}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(investigationCase.priority)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                {investigationCase.priority.toUpperCase()} PRIORITY
              </Badge>
              <Badge className={getStatusColor(investigationCase.status)}>
                {investigationCase.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Case ID
                  </div>
                  <div className="font-semibold text-foreground">
                    {investigationCase.id}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Category
                  </div>
                  <div className="font-semibold text-foreground">
                    {investigationCase.category}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Assigned To
                  </div>
                  <div className="font-semibold text-foreground">
                    {investigationCase.assignedTo}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Created
                  </div>
                  <div className="font-semibold text-foreground">
                    {investigationCase.createdAt}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Last Updated
                  </div>
                  <div className="font-semibold text-foreground">
                    {investigationCase.lastUpdated}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-muted/50">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="matches"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Match History
              </TabsTrigger>
              <TabsTrigger
                value="communications"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Communications
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Flag className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger
                value="evidence"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="h-4 w-4 mr-2" />
                Evidence
              </TabsTrigger>
              <TabsTrigger
                value="action"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Gavel className="h-4 w-4 mr-2" />
                Take Action
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div />
            </TabsContent>
            <TabsContent value="matches" className="space-y-6">
              <div />
            </TabsContent>
            <TabsContent value="communications" className="space-y-6">
              <div />
            </TabsContent>
            <TabsContent value="reports" className="space-y-6">
              <div />
            </TabsContent>
            <TabsContent value="evidence" className="space-y-6">
              <div />
            </TabsContent>
            <TabsContent value="action" className="space-y-6">
              <div />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

export default ModeratorInvestigate;
