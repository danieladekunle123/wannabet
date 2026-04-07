import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Gamepad2,
  Image as ImageIcon,
  MapPin,
  Trophy,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import { usePresence } from "../context/PresenceContext";
import { StatusDot } from "./StatusDot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  cancelEvent,
  editEvent,
  getEventBySourceId,
  joinEvent,
  leaveEvent,
  startEvent,
  submitMatchResult,
  uploadMatchEvidence,
  type EventRecord,
} from "../services/eventsService";
import { uploadFile } from "../services/uploadService";

type ViewMatchProps = {
  eventId: string;
  onBack: () => void;
  onOpenChat?: (eventId: string) => void;
};

type MatchStatus =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "disputed"
  | "archived";

const statusLabel: Record<MatchStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  disputed: "Disputed",
  archived: "Archived",
};

const statusClasses: Record<MatchStatus, string> = {
  upcoming: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  ongoing: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  completed: "bg-zinc-500/15 text-zinc-200 border-zinc-500/30",
  disputed: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  archived: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function toStatus(value: string | undefined): MatchStatus {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "ongoing") return "ongoing";
  if (normalized === "completed") return "completed";
  if (normalized === "disputed") return "disputed";
  if (normalized === "archived") return "archived";
  return "upcoming";
}

export function ViewMatch({ eventId, onBack, onOpenChat }: ViewMatchProps) {
  const { user } = useAuth();
  const { currency, rates } = useCurrency();
  const { watchUsers, socket } = usePresence();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [winnerId, setWinnerId] = useState("");
  const [score, setScore] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasSubmittedResult, setHasSubmittedResult] = useState(false);
  const [resultSubmitNotice, setResultSubmitNotice] = useState<{
    tone: "success" | "info" | "warning";
    text: string;
  } | null>(null);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const source = await getEventBySourceId(eventId);
      setEvent(source);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load match";
      setError(message);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [eventId]);

  // Real-time: refresh when any event is updated
  useEffect(() => {
    if (!socket) return;
    const handler = () => void refresh();
    socket.on("event:updated", handler);
    return () => {
      socket.off("event:updated", handler);
    };
  }, [socket, eventId]);

  useEffect(() => {
    setHasSubmittedResult(false);
    setResultSubmitNotice(null);
  }, [eventId]);

  const participants = event?.participants ?? [];

  useEffect(() => {
    if (participants.length) watchUsers(participants.map((p) => p.id));
  }, [participants, watchUsers]);
  const currentUserId = user?.id;
  const status = toStatus(event?.status);

  const winner = useMemo(() => {
    if (!event?.reportedWinnerId) return null;
    return participants.find((p) => p.id === event.reportedWinnerId) ?? null;
  }, [event?.reportedWinnerId, participants]);

  const isHost = useMemo(() => {
    if (!event || !currentUserId) return false;
    return event.hostId === currentUserId;
  }, [event, currentUserId]);

  const isParticipant = useMemo(() => {
    if (!currentUserId) return false;
    return participants.some((p) => p.id === currentUserId);
  }, [participants, currentUserId]);

  const canJoin = !!event && status === "upcoming" && !isParticipant;
  const canLeave = !!event && status === "upcoming" && isParticipant && !isHost;
  const canStart = !!event && status === "upcoming" && isHost;
  // Allow cancel: upcoming OR no opponents yet (no joiner on a match; no one registered on a tournament)
  const noOpponents =
    event?.sourceType === "match"
      ? (event?.participants?.length ?? 0) <= 1
      : (event?.participants?.length ?? 0) === 0;
  const canCancel =
    !!event &&
    isHost &&
    !["cancelled", "completed"].includes(status) &&
    (status === "upcoming" || noOpponents);
  const canSubmitResult =
    !!event &&
    status === "ongoing" &&
    isParticipant &&
    event.canReportResult !== false;
  const canUploadEvidence = !!event && status === "disputed" && isParticipant;

  const currentUserWon =
    !!currentUserId &&
    !!event?.reportedWinnerId &&
    event.reportedWinnerId === currentUserId;

  const currentUserLost =
    !!currentUserId &&
    !!event?.reportedWinnerId &&
    event.reportedWinnerId !== currentUserId &&
    isParticipant;

  const runAction = async (action: () => Promise<unknown>) => {
    if (!event) return;
    try {
      setBusy(true);
      setError(null);
      await action();
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!event || !winnerId || busy || hasSubmittedResult) return;

    try {
      setBusy(true);
      setError(null);
      setResultSubmitNotice(null);

      const payload = await submitMatchResult({
        sourceId: event.sourceId,
        winnerId,
        score,
      });

      const submitStatus =
        typeof payload?.status === "string" ? payload.status : "pending";

      if (submitStatus === "completed") {
        setResultSubmitNotice({
          tone: "success",
          text: "Match results submitted and finalized.",
        });
      } else if (submitStatus === "disputed") {
        setResultSubmitNotice({
          tone: "warning",
          text: "Match results submitted. Submissions conflict and the match is now disputed.",
        });
      } else {
        setResultSubmitNotice({
          tone: "info",
          text: "Match results submitted. Waiting for the other participant to submit.",
        });
      }

      setHasSubmittedResult(true);
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit result";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] p-6 text-zinc-300">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-200"
        >
          Back
        </button>
        Loading match...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[50vh] p-6 text-zinc-300">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-200"
        >
          Back
        </button>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error ?? "Match not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] space-y-5 p-6 text-zinc-100">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-200"
        >
          Back
        </button>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
        >
          {statusLabel[status]}
        </span>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {cancelNotice ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {cancelNotice}
        </div>
      ) : null}

      {/* Match info card */}
      <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
        <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
        {event.description ? (
          <p className="mt-2 text-sm text-zinc-300">{event.description}</p>
        ) : null}

        <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            <span>{participants.length} participants</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span>
              {event.startTime
                ? new Date(event.startTime).toLocaleDateString()
                : "Date TBD"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span>
              {event.startTime
                ? new Date(event.startTime).toLocaleTimeString()
                : "Time TBD"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-zinc-400" />
            <span>
              {event.wagerAmount > 0
                ? `${formatCurrencyFromEur(event.wagerAmount, currency, rates)} wager`
                : "No wager"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {canJoin ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(() =>
                  joinEvent(event.sourceType, event.sourceId),
                )
              }
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              Join Match
            </button>
          ) : null}

          {canLeave ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(() =>
                  leaveEvent(event.sourceType, event.sourceId),
                )
              }
              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              Leave Match
            </button>
          ) : null}

          {canStart ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(() =>
                  startEvent(event.sourceType, event.sourceId),
                )
              }
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              Start Match
            </button>
          ) : null}

          {canCancel ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-medium text-rose-200 disabled:opacity-60"
                >
                  Cancel Match
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel "{event.title}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently cancel the match. All participants
                    will be removed and any escrowed funds will be refunded.
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Match</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() =>
                      void runAction(async () => {
                        await cancelEvent(event.sourceType, event.sourceId);
                        setCancelNotice(
                          "Match cancelled. Any escrowed funds have been refunded.",
                        );
                      })
                    }
                  >
                    Yes, Cancel Match
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}

          {onOpenChat ? (
            <button
              type="button"
              onClick={() => onOpenChat(event.id)}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium"
            >
              Open Match Chat
            </button>
          ) : null}
        </div>
      </section>

      {/* Submit Result */}
      {canSubmitResult ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
          <h2 className="text-lg font-semibold">Submit Result</h2>
          <p className="mt-1 text-sm text-zinc-300">
            Both players must submit matching results to finalize the match.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-300">Winner</span>
              <Select value={winnerId} onValueChange={setWinnerId}>
                <SelectTrigger className="w-full border-white/15 bg-zinc-900 text-zinc-100">
                  <SelectValue placeholder="Select winner" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-zinc-300">Score (optional)</span>
              <input
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g. 2-1"
                className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={busy || !winnerId || hasSubmittedResult}
            onClick={() => void handleSubmitResult()}
            className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
              hasSubmittedResult
                ? "bg-zinc-700 text-zinc-300"
                : "bg-emerald-600 text-white"
            }`}
          >
            {hasSubmittedResult
              ? "Result Submitted"
              : busy
                ? "Submitting..."
                : "Submit Result"}
          </button>

          {resultSubmitNotice ? (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                resultSubmitNotice.tone === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : resultSubmitNotice.tone === "warning"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-300"
              }`}
            >
              {resultSubmitNotice.text}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Dispute Evidence */}
      {canUploadEvidence ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
          <h2 className="text-lg font-semibold">Dispute Evidence</h2>
          <p className="mt-1 text-sm text-zinc-300">
            Upload images and notes to help moderators resolve this dispute.
          </p>

          <div className="mt-4 grid gap-3">
            {/* Image upload */}
            <div className="text-sm">
              <span className="mb-2 block text-zinc-300">
                Screenshots / Images
              </span>

              {/* Drop zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-white/20 bg-zinc-900/60 px-4 py-6 text-zinc-400 transition hover:border-amber-500/50 hover:text-amber-300"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">
                  Click to add PNG / JPG / WebP (max 10 MB each)
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setEvidenceImages((prev) => [...prev, ...files]);
                  setImageUploadError(null);
                  // reset so same file can be re-selected
                  e.target.value = "";
                }}
              />

              {/* Pending images */}
              {evidenceImages.length > 0 && (
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {evidenceImages.map((file, i) => (
                    <li
                      key={i}
                      className="relative rounded-lg border border-white/10 bg-zinc-800 p-1"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-24 w-full rounded object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-zinc-300 hover:text-white"
                        onClick={() =>
                          setEvidenceImages((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="mt-1 truncate px-1 text-xs text-zinc-400">
                        {file.name}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Already uploaded */}
              {uploadedImageUrls.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-zinc-400">
                    Uploaded ({uploadedImageUrls.length})
                  </p>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {uploadedImageUrls.map((url) => (
                      <li
                        key={url}
                        className="rounded-lg border border-emerald-500/20 bg-zinc-800 p-1"
                      >
                        <img
                          src={url}
                          alt="evidence"
                          className="h-24 w-full rounded object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {imageUploadError && (
                <p className="mt-2 text-xs text-rose-400">{imageUploadError}</p>
              )}
            </div>

            {/* URL link */}
            <label className="text-sm">
              <span className="mb-1 block text-zinc-300">
                Evidence URL (optional)
              </span>
              <input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-zinc-300">Note (optional)</span>
              <textarea
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                placeholder="Describe the evidence"
                className="min-h-24 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={busy || imageUploading}
            onClick={async () => {
              setImageUploadError(null);
              const newUrls: string[] = [];

              if (evidenceImages.length > 0) {
                setImageUploading(true);
                for (const file of evidenceImages) {
                  try {
                    const fileUrl = await uploadFile(file, "evidence");
                    newUrls.push(fileUrl);
                  } catch (err) {
                    const msg =
                      err instanceof Error ? err.message : "Upload failed";
                    setImageUploadError(msg);
                    setImageUploading(false);
                    return;
                  }
                }
                setUploadedImageUrls((prev) => [...prev, ...newUrls]);
                setEvidenceImages([]);
                setImageUploading(false);
              }

              // Also submit text / URL evidence if provided
              const text = [evidenceUrl, evidenceNote]
                .filter(Boolean)
                .join("\n");
              if (text) {
                void runAction(() =>
                  uploadMatchEvidence({
                    sourceId: event.sourceId,
                    evidenceUrl: text,
                  }),
                );
              }
            }}
            className="mt-4 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {imageUploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Submit Evidence
              </>
            )}
          </button>
        </section>
      ) : null}

      {/* Completed Match Summary */}
      {status === "completed" || status === "archived" ? (
        <section
          className={`rounded-2xl border p-5 ${
            currentUserWon
              ? "border-emerald-500/40 bg-emerald-950/30"
              : currentUserLost
                ? "border-rose-500/40 bg-rose-950/20"
                : "border-white/10 bg-zinc-950/60"
          }`}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">Match Summary</h2>
            {isParticipant ? (
              currentUserWon ? (
                <span className="flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> VICTORY
                </span>
              ) : currentUserLost ? (
                <span className="flex items-center gap-2 rounded-full border border-rose-500/50 bg-rose-500/15 px-3 py-1 text-sm font-semibold text-rose-300">
                  <XCircle className="h-4 w-4" /> DEFEAT
                </span>
              ) : null
            ) : null}
          </div>

          {/* Participants head-to-head */}
          {participants.length >= 2 ? (
            <div className="mb-6 flex items-center justify-center gap-8">
              {[0, 1]
                .map((idx) => {
                  const p = participants[idx];
                  const isWinner = p?.id === event.reportedWinnerId;
                  return (
                    <div
                      key={p?.id ?? idx}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-lg font-bold ${
                          isWinner
                            ? "border-amber-400 bg-amber-500/20 text-amber-300"
                            : "border-white/20 bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {(p?.username ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="max-w-[100px] truncate text-center text-sm font-medium text-zinc-200">
                        {p?.username ?? "Unknown"}
                        {p?.id === currentUserId ? (
                          <span className="ml-1 text-xs text-zinc-400">
                            (you)
                          </span>
                        ) : null}
                      </span>
                      {p?.id && (
                        <StatusDot
                          userId={p.id}
                          size="sm"
                          showLabel
                          className="justify-center text-zinc-400"
                        />
                      )}
                      {isWinner ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                          <Crown className="h-3 w-3" /> Winner
                        </span>
                      ) : event.reportedWinnerId ? (
                        <span className="text-xs text-zinc-500">Loss</span>
                      ) : null}
                    </div>
                  );
                })
                .reduce<React.ReactNode[]>((acc, el, idx) => {
                  if (idx === 0) return [el];
                  return [
                    ...acc,
                    <span
                      key="vs"
                      className="mt-[-24px] text-2xl font-bold text-zinc-500"
                    >
                      VS
                    </span>,
                    el,
                  ];
                }, [])}
            </div>
          ) : null}

          {/* Match info grid */}
          <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 shrink-0 text-zinc-400" />
              <span className="font-medium text-zinc-100">{event.game}</span>
            </div>
            {event.region ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                <span>{event.region}</span>
              </div>
            ) : null}
            {event.startTime ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                <span>{new Date(event.startTime).toLocaleDateString()}</span>
              </div>
            ) : null}
            {event.startTime ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-zinc-400" />
                <span>{new Date(event.startTime).toLocaleTimeString()}</span>
              </div>
            ) : null}
            {event.wagerAmount > 0 ? (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="font-semibold text-purple-300">
                  {formatCurrencyFromEur(event.wagerAmount, currency, rates)}{" "}
                  wager
                </span>
              </div>
            ) : null}
            {event.prizePool > 0 ? (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="font-semibold text-amber-300">
                  {formatCurrencyFromEur(event.prizePool, currency, rates)}{" "}
                  prize pool
                </span>
              </div>
            ) : null}
          </div>

          {/* All players result list */}
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-900/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Users className="h-4 w-4 text-zinc-400" /> Players
            </h3>
            <div className="space-y-2">
              {participants.map((p) => {
                const isWinner = p.id === event.reportedWinnerId;
                const isYou = p.id === currentUserId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                      isWinner
                        ? "bg-amber-500/10 text-amber-200"
                        : "bg-zinc-800/60 text-zinc-300"
                    }`}
                  >
                    <span className="font-medium">
                      {p.username}
                      {isYou ? (
                        <span className="ml-2 text-xs text-zinc-400">
                          (you)
                        </span>
                      ) : null}
                    </span>
                    {isWinner ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
                        <Crown className="h-3 w-3" /> Winner
                      </span>
                    ) : event.reportedWinnerId ? (
                      <span className="rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-400">
                        Loss
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {!event.reportedWinnerId ? (
            <p className="mt-4 text-sm text-zinc-400">
              Results are being processed or were not submitted.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Host Quick Edit */}
      {status === "upcoming" && isHost ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
          <h2 className="text-lg font-semibold">Host Quick Edit</h2>
          <p className="mt-1 text-sm text-zinc-300">
            Update the title or description before the match begins.
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const title = window.prompt("New title", event.title)?.trim();
              if (!title) return;
              const description =
                window.prompt("New description", event.description ?? "") ?? "";
              void runAction(() =>
                editEvent(event.sourceType, event.sourceId, {
                  title,
                  description,
                }),
              );
            }}
            className="mt-4 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            Edit Match Info
          </button>
        </section>
      ) : null}
    </div>
  );
}

export default ViewMatch;
