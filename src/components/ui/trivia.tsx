import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Pokedex } from "./pokedex";

// ─── Constants ──────────────────────────────────────────────
const API_BASE = "https://trivia-buzzer.mdunne697.workers.dev";
const POLL_INTERVAL_MS = 1500;

// ─── Interfaces ─────────────────────────────────────────────

interface CreateRoomResponse {
  room_id: string;
  join_code: string;
}

interface AnswerEntry {
  player_name: string;
  answer: string;
  submitted_at: string;
}

interface HostRoomState {
  status: "open" | "closed";
  answers: AnswerEntry[];
}

interface PlayerRoomState {
  status: "open" | "closed";
  answer_count: number;
}

interface ApiError {
  error: string;
}

// ─── Custom error for 410 Gone ──────────────────────────────

class RoomEndedError extends Error {
  constructor() {
    super("This room has ended");
    this.name = "RoomEndedError";
  }
}

// ─── Helpers ────────────────────────────────────────────────

/** Uppercase + trim a join code for consistency */
function sanitizeJoinCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Trim whitespace from both ends of a string */
function trimField(value: string): string {
  return value.trim();
}

/** Format time relative to the first answer's timestamp */
function formatRelativeToFirst(
  submittedAt: string,
  firstSubmittedAt: string,
  isFirst: boolean,
): string {
  if (isFirst) return "";

  const submitted = new Date(submittedAt).getTime();
  const first = new Date(firstSubmittedAt).getTime();
  const diffMs = submitted - first;

  if (diffMs < 0) return "+0.00s";

  const seconds = diffMs / 1000;
  if (seconds < 60) return `+${seconds.toFixed(2)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds - minutes * 60;
  return `+${minutes}m ${remainingSeconds.toFixed(1)}s`;
}

/** Generic fetch wrapper with typed JSON response */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 410) {
    throw new RoomEndedError();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiError;
      if (body.error) message = body.error;
    } catch {
      // body isn't JSON, use default message
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Room Ended Panel ───────────────────────────────────────

function RoomEndedPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 pb-2">
        This room has ended
      </h1>
      <p className="text-neutral-400 text-sm">
        The host has closed this session.
      </p>
    </div>
  );
}

// ─── Host View ──────────────────────────────────────────────

function HostView() {
  const [apiKey, setApiKey] = useState("");
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<HostRoomState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingBuzzer, setTogglingBuzzer] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);
  const [covered, setCovered] = useState(true);

  const authHeaders = useCallback(
    (): Record<string, string> => ({
      Authorization: `Bearer ${apiKey.trim()}`,
    }),
    [apiKey],
  );

  // ── Create Room ───────────────────────────────────────────
  async function handleCreateRoom() {
    if (!apiKey.trim()) {
      setError("Enter your host API key first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CreateRoomResponse>("/api/create-room", {
        method: "POST",
        headers: authHeaders(),
      });
      setJoinCode(data.join_code);
    } catch (err) {
      if (err instanceof RoomEndedError) {
        setRoomEnded(true);
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  // ── Open / Close Buzzer ───────────────────────────────────
  async function handleToggleBuzzer() {
    if (!joinCode) return;

    const isCurrentlyOpen = roomState?.status === "open";
    const endpoint = isCurrentlyOpen ? "/api/close-buzzer" : "/api/open-buzzer";

    setTogglingBuzzer(true);
    setError(null);
    try {
      await apiFetch(endpoint, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ join_code: joinCode }),
      });
      // When closing the buzzer, reset covered so next round starts covered
      if (isCurrentlyOpen) {
        setCovered(true);
      }
    } catch (err) {
      if (err instanceof RoomEndedError) {
        setRoomEnded(true);
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to toggle buzzer");
    } finally {
      setTogglingBuzzer(false);
    }
  }

  // ── Poll room state ───────────────────────────────────────
  useEffect(() => {
    if (!joinCode || !apiKey.trim() || roomEnded) return;

    let cancelled = false;

    async function poll() {
      try {
        const data = await apiFetch<HostRoomState>(
          `/api/room-state?join_code=${joinCode}`,
          { headers: { Authorization: `Bearer ${apiKey.trim()}` } },
        );
        if (!cancelled) {
          setRoomState(data);
          setError(null);
        }
      } catch (err) {
        if (err instanceof RoomEndedError && !cancelled) {
          setRoomEnded(true);
        }
        // Silently retry on other poll failures
      }
    }

    void poll(); // initial fetch
    const id = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [joinCode, apiKey, roomEnded]);

  // ── Render ────────────────────────────────────────────────
  const isOpen = roomState?.status === "open";
  const answers = roomState?.answers ?? [];
  const firstAnswerTime = answers.length > 0 ? answers[0].submitted_at : null;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-neutral-950 p-4 md:p-8">
      <Pokedex>
        <div className="w-full p-8 pt-24 bg-white dark:bg-neutral-900 min-h-[60vh]">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center text-center w-full"
          >
            {roomEnded ? (
              <RoomEndedPanel />
            ) : (
              <>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2 pb-2 text-center">
                  Trivia Buzzer
                </h1>
                <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1 text-center">
                  Host Dashboard
                </h2>
                <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8 mx-auto">
                  LIVE
                </span>

                {/* Step 1: API key + create room */}
                {!joinCode && (
                  <div className="max-w-md w-full space-y-4 text-left mx-auto">
                    <div>
                      <label
                        className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2"
                        htmlFor="host-api-key"
                      >
                        Host API Key
                      </label>
                      <input
                        id="host-api-key"
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                        type="password"
                        placeholder="Paste your secret key…"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                    <button
                      id="create-room-btn"
                      className={`w-full px-6 py-3 font-bold rounded-xl transition-all ${
                        loading || !apiKey.trim()
                          ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                      }`}
                      onClick={handleCreateRoom}
                      disabled={loading || !apiKey.trim()}
                    >
                      {loading ? "Creating…" : "Create Room"}
                    </button>
                    {error && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Room active */}
                {joinCode && (
                  <div className="space-y-6 max-w-2xl w-full mx-auto text-left">
                    {/* Join code display */}
                    <div className="bg-neutral-100 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-6 flex flex-col items-center gap-2">
                      <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                        Join Code
                      </span>
                      <span className="text-5xl font-black tracking-[0.2em] font-mono text-red-600 select-all">
                        {joinCode}
                      </span>
                    </div>

                    {/* Toolbar: status + toggle */}
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                      {roomState ? (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isOpen
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                              : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOpen
                                ? "bg-green-500 animate-pulse"
                                : "bg-red-500"
                            }`}
                          />
                          {isOpen ? "Buzzer Open" : "Buzzer Closed"}
                        </span>
                      ) : (
                        <div className="h-7 w-28 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                      )}

                      <button
                        id="toggle-buzzer-btn"
                        className={`px-6 py-3 font-bold rounded-xl transition-all ${
                          togglingBuzzer
                            ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                        }`}
                        onClick={handleToggleBuzzer}
                        disabled={togglingBuzzer}
                      >
                        {togglingBuzzer
                          ? "…"
                          : isOpen
                            ? "Close Buzzer"
                            : "Open Buzzer"}
                      </button>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                      </div>
                    )}

                    {/* Divider + answer section */}
                    <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800" />
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">
                      Answers ({answers.length})
                    </div>

                    {roomState === null ? (
                      <div className="space-y-3">
                        <div className="h-4 w-3/4 mx-auto rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                        <div className="h-4 w-1/2 mx-auto rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                        <div className="h-4 w-3/4 mx-auto rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                      </div>
                    ) : answers.length === 0 ? (
                      <div className="text-center text-neutral-400 text-sm py-8">
                        {isOpen
                          ? "Waiting for answers…"
                          : "Open the buzzer to start a round"}
                      </div>
                    ) : covered ? (
                      /* Cover panel — hides answers, shows count */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center gap-4 mx-auto w-full"
                      >
                        <span className="text-5xl font-bold text-red-600">
                          {answers.length}
                        </span>
                        <span className="text-neutral-500 text-lg font-semibold">
                          locked in
                        </span>
                        <button
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                          onClick={() => setCovered(false)}
                        >
                          Reveal
                        </button>
                      </motion.div>
                    ) : (
                      /* Revealed answer feed */
                      <div className="space-y-2 w-full">
                        <div className="flex justify-end mb-2">
                          <button
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-500 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-all"
                            onClick={() => setCovered(true)}
                          >
                            Cover
                          </button>
                        </div>
                        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                          {answers.map((a, i) => (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-3"
                              key={`${a.player_name}-${a.submitted_at}`}
                            >
                              <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold shrink-0">
                                {i + 1}
                              </div>
                              <span className="font-bold text-sm text-neutral-700 dark:text-neutral-200 min-w-[60px]">
                                {a.player_name}
                              </span>
                              <span className="flex-1 text-sm text-neutral-500 dark:text-neutral-400 break-words">
                                {a.answer}
                              </span>
                              {firstAnswerTime && (
                                <span className="text-xs font-medium text-neutral-400 tabular-nums whitespace-nowrap">
                                  {formatRelativeToFirst(
                                    a.submitted_at,
                                    firstAnswerTime,
                                    i === 0,
                                  )}
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </Pokedex>
      {/* Mobile Spacer */}
      <div className="h-32 w-full shrink-0 md:hidden" />
    </div>
  );
}

// ─── Player View ────────────────────────────────────────────

function PlayerView() {
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [answer, setAnswer] = useState("");
  const [roomStatus, setRoomStatus] = useState<"open" | "closed" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomEnded, setRoomEnded] = useState(false);

  const answerInputRef = useRef<HTMLInputElement>(null);
  const prevStatusRef = useRef<"open" | "closed" | null>(null);

  // ── Join the room ─────────────────────────────────────────
  function handleJoin() {
    const name = trimField(playerName);
    const code = sanitizeJoinCode(joinCode);
    if (!name || !code) {
      setError("Enter both your name and join code.");
      return;
    }
    setPlayerName(name);
    setJoinCode(code);
    setJoined(true);
    setError(null);
  }

  // ── Poll room state ───────────────────────────────────────
  useEffect(() => {
    if (!joined || roomEnded) return;

    let cancelled = false;

    async function poll() {
      try {
        const data = await apiFetch<PlayerRoomState>(
          `/api/room-state?join_code=${sanitizeJoinCode(joinCode)}`,
        );
        if (!cancelled) {
          setRoomStatus(data.status);
          // Reset submission state when a new round opens
          if (
            data.status === "open" &&
            prevStatusRef.current === "closed"
          ) {
            setSubmitted(false);
            setAnswer("");
            setError(null);
          }
          prevStatusRef.current = data.status;
        }
      } catch (err) {
        if (err instanceof RoomEndedError && !cancelled) {
          setRoomEnded(true);
        }
        // Silently retry on other failures
      }
    }

    void poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [joined, joinCode, roomEnded]);

  // ── Auto-focus the input when buzzer opens ────────────────
  useEffect(() => {
    if (roomStatus === "open" && !submitted) {
      // Small delay so the DOM updates before focus
      requestAnimationFrame(() => {
        answerInputRef.current?.focus();
      });
    }
  }, [roomStatus, submitted]);

  // ── Submit answer ─────────────────────────────────────────
  async function handleSubmit() {
    const trimmedAnswer = trimField(answer);
    if (!trimmedAnswer) return;

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({
          join_code: sanitizeJoinCode(joinCode),
          player_name: trimField(playerName),
          answer: trimmedAnswer,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof RoomEndedError) {
        setRoomEnded(true);
        return;
      }
      const msg = err instanceof Error ? err.message : "Submission failed";
      // Handle known error states gracefully
      if (msg.includes("Already submitted") || msg.includes("409")) {
        setSubmitted(true);
      } else if (msg.includes("Buzzer is closed") || msg.includes("403")) {
        setError("The buzzer closed before your answer got in. Wait for the next round!");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !submitting && !submitted) {
      void handleSubmit();
    }
  }

  // ── Render ────────────────────────────────────────────────
  const isOpen = roomStatus === "open";
  const isLoading = roomStatus === null;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-neutral-950 p-4 md:p-8">
      <Pokedex>
        <div className="w-full p-8 pt-24 bg-white dark:bg-neutral-900 min-h-[60vh]">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center text-center w-full"
          >
            {roomEnded ? (
              <RoomEndedPanel />
            ) : !joined ? (
              <>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2 pb-2 text-center">
                  Trivia Buzzer
                </h1>
                <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1 text-center">
                  Join a Game
                </h2>
                <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8 mx-auto">
                  PLAYER
                </span>

                <div className="max-w-md w-full space-y-4 text-left mx-auto">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label
                        className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2"
                        htmlFor="player-name"
                      >
                        Your Name
                      </label>
                      <input
                        id="player-name"
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                        type="text"
                        placeholder="e.g. Alex"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={30}
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2"
                        htmlFor="join-code"
                      >
                        Join Code
                      </label>
                      <input
                        id="join-code"
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 uppercase tracking-widest"
                        type="text"
                        placeholder="e.g. ABCD"
                        value={joinCode}
                        onChange={(e) =>
                          setJoinCode(e.target.value.toUpperCase())
                        }
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <button
                    id="join-room-btn"
                    className={`w-full px-6 py-3 font-bold rounded-xl transition-all ${
                      !playerName.trim() || !joinCode.trim()
                        ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                    }`}
                    onClick={handleJoin}
                    disabled={!playerName.trim() || !joinCode.trim()}
                  >
                    Join
                  </button>
                  {error && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                      {error}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Joined state */
              <>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2 pb-2 text-center">
                  Trivia Buzzer
                </h1>
                <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-6 text-center">
                  Playing as {playerName}
                </h2>

                <div className="max-w-md w-full mx-auto text-left">
                  {/* Loading state */}
                  {isLoading && (
                    <div className="space-y-4 py-8">
                      <div className="h-4 w-3/4 mx-auto rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                      <div className="h-4 w-1/2 mx-auto rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                      <div className="h-4 w-2/3 mx-auto rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                    </div>
                  )}

                  {/* Buzzer closed — waiting */}
                  {roomStatus === "closed" && !submitted && (
                    <div className="flex flex-col items-center gap-4 py-10">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                        <div
                          className="w-3 h-3 rounded-full bg-red-400 animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-3 h-3 rounded-full bg-red-400 animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <span className="text-neutral-400 text-sm uppercase tracking-wider font-semibold text-center">
                        Waiting for the host to open the buzzer…
                      </span>
                    </div>
                  )}

                  {/* Buzzer open + not yet submitted */}
                  {isOpen && !submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-center w-full">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider border border-green-200 dark:border-green-800">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          Buzzer Open — GO!
                        </span>
                      </div>
                      <div>
                        <label
                          className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2"
                          htmlFor="answer-input"
                        >
                          Your Answer
                        </label>
                        <input
                          ref={answerInputRef}
                          id="answer-input"
                          className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                          type="text"
                          placeholder="Type your answer…"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          onKeyDown={handleKeyDown}
                          disabled={submitting}
                          maxLength={200}
                          autoComplete="off"
                        />
                      </div>
                      <button
                        id="submit-answer-btn"
                        className={`w-full px-6 py-3 font-bold rounded-xl transition-all ${
                          submitting || !answer.trim()
                            ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                        }`}
                        onClick={handleSubmit}
                        disabled={submitting || !answer.trim()}
                      >
                        {submitting ? "Submitting…" : "Lock In"}
                      </button>
                    </motion.div>
                  )}

                  {/* Submitted confirmation */}
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-3 py-10"
                    >
                      <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-2xl border-4 border-green-200 dark:border-green-800">
                        ✓
                      </div>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        Locked in ✓
                      </span>
                    </motion.div>
                  )}

                  {error && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                      {error}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </Pokedex>
      {/* Mobile Spacer */}
      <div className="h-32 w-full shrink-0 md:hidden" />
    </div>
  );
}

// ─── Exported Wrapper Components ────────────────────────────

/** Host view — mounted at /trivia-buzzer/host */
export function TriviaHost() {
  return <HostView />;
}

/** Player view — mounted at /trivia-buzzer */
export default function TriviaBuzzer() {
  return <PlayerView />;
}
