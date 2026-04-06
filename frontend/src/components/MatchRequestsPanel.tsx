import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AlertCircle, Calendar, Check, Clock, UserPlus, X } from "lucide-react";
import {
  getIncomingMatchRequests,
  respondToMatchRequest,
  type IncomingMatchRequest,
} from "../services/eventsService";

export function MatchRequestsPanel({
  onNavigate,
}: {
  onNavigate?: (tab: string, query?: string) => void;
}) {
  const [requests, setRequests] = useState<IncomingMatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIncomingMatchRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getIncomingMatchRequests();
        if (!cancelled) setRequests(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load requests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAction = async (
    requestId: string,
    action: "accept" | "decline",
  ) => {
    try {
      setBusyRequestId(requestId);
      setError(null);
      await respondToMatchRequest(requestId, action);
      await loadRequests();
    } catch (err: any) {
      setError(err?.message || `Failed to ${action} request`);
    } finally {
      setBusyRequestId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading requests...</div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No incoming match requests.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id} className="border-border/50">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2 flex-wrap">
                {request.game || "Match request"}
                <Badge variant="outline">Best of {request.rounds || 1}</Badge>
                <Badge variant="outline" className="capitalize">
                  {request.matchType}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                From{" "}
                {request.sender?.profile?.displayName ||
                  request.sender?.username ||
                  request.senderId}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {request.scheduledDate || "TBD"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {request.scheduledTime || "TBD"}
                </span>
                <span>{request.region || "Global"}</span>
                {request.wagerAmount > 0 && (
                  <span>Wager: EUR {request.wagerAmount}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Pending</Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={busyRequestId === request.id}
                onClick={() => handleAction(request.id, "decline")}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                disabled={busyRequestId === request.id}
                onClick={() => handleAction(request.id, "accept")}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate?.("my-events", "requests")}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Open
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
