"use client";
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Pokedex } from "./pokedex";
import { Skeleton } from "./skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// ============================================================================
// Types
// ============================================================================

interface PuzzleResult {
  id: number;
  game: string;
  puzzle_number: number;
  time_seconds: number | null;
  guesses: number | null;
  created_at: string;
}

// ============================================================================
// Constants
// ============================================================================

const GAMES = ["Queens", "Tango", "Patches", "Zip", "Wend", "Pinpoint"];

// TODO: fill in legacy values
const legacyValues: Record<string, { pb: string; streak: number }> = {
  Queens: { pb: "0:05", streak: 190 },
  Tango: { pb: "0:18", streak: 190 },
  Patches: { pb: "0:09", streak: 48 },
  Zip: { pb: "0:04", streak: 190 },
  Wend: { pb: "0:10", streak: 49 },
  Pinpoint: { pb: "1 guess", streak: 190 },
};

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Formats a total duration, scaling up through minutes → hours → days.
 * Leading zero units are suppressed: "0d" is never shown until there is at
 * least one full day, and "0h" is never shown until there is at least one hour.
 *
 * < 3600 s  →  "Xm Ys"   (e.g. "47m 32s")
 * < 86400 s →  "Xh Ym"   (e.g. "3h 12m")
 * ≥ 86400 s →  "Xd Yh Zm" (e.g. "1d 4h 7m")
 */
function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isPinpoint(game: string): boolean {
  return game === "Pinpoint";
}

/**
 * Calculate streak by puzzle_number continuity.
 * Sorts by puzzle_number descending and counts backwards from the most recent
 * entry until the first gap (non-consecutive puzzle number). Duplicate puzzle
 * numbers are collapsed — only unique numbers matter.
 */
function calculateStreak(results: PuzzleResult[]): number {
  if (results.length === 0) return 0;

  // Deduplicate and sort puzzle numbers descending
  const puzzleNumbers = [
    ...new Set(results.map((r) => r.puzzle_number)),
  ].sort((a, b) => b - a);

  let streak = 1;
  for (let i = 1; i < puzzleNumbers.length; i++) {
    if (puzzleNumbers[i - 1] - puzzleNumbers[i] === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Pinpoint streak derivation logic:
 *
 * Pinpoint cannot always be completed — if you fail to guess within 5 tries,
 * there is no share text and therefore no DB entry. A missing Pinpoint entry
 * should NOT break the Pinpoint streak.
 *
 * Instead of tracking Pinpoint streak independently by its own puzzle numbers,
 * we derive it from the Queens streak. Queens is used as the source of truth
 * for "days played" because all five games share the same daily puzzle number.
 * If the Queens streak is unbroken for N consecutive puzzle numbers, the
 * Pinpoint streak is also considered N — missing Pinpoint entries within that
 * range are assumed to be failed attempts, not skipped days.
 *
 * The streak only resets when the Queens (timed game) streak resets, indicating
 * the player genuinely missed a day.
 */
function calculatePinpointStreak(
  grouped: Record<string, PuzzleResult[]>,
): number {
  const queensResults = grouped["Queens"] || [];
  return calculateStreak(queensResults);
}

function calculateStats(
  results: PuzzleResult[],
  game: string,
  grouped: Record<string, PuzzleResult[]>,
) {
  if (results.length === 0) return null;

  const legacy = legacyValues[game];
  // Calculated streak from DB + legacy streak constant = true current streak
  const calculatedStreak = isPinpoint(game)
    ? calculatePinpointStreak(grouped)
    : calculateStreak(results);
  const totalStreak = calculatedStreak + legacy.streak;

  if (isPinpoint(game)) {
    const guesses = results
      .map((r) => r.guesses)
      .filter((g): g is number => g !== null);
    if (guesses.length === 0) return null;
    const best = Math.min(...guesses);
    const avg = guesses.reduce((a, b) => a + b, 0) / guesses.length;
    return {
      best: `${best} guess${best !== 1 ? "es" : ""}`,
      average: `${avg.toFixed(1)} guesses`,
      total: null,
      gamesTracked: results.length,
      streak: totalStreak,
    };
  } else {
    const times = results
      .map((r) => r.time_seconds)
      .filter((t): t is number => t !== null);
    if (times.length === 0) return null;
    const best = Math.min(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const total = times.reduce((a, b) => a + b, 0);
    return {
      best: formatTime(best),
      average: formatTime(Math.round(avg)),
      total: formatTime(total),
      gamesTracked: results.length,
      streak: totalStreak,
    };
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-lg" />
        ))}
      </div>
      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Chart skeleton */}
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 p-4 rounded-xl border ${
        accent
          ? "border-red-500/30 bg-red-950/20"
          : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60"
      }`}
    >
      <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-neutral-400 dark:text-neutral-500">
        {label}
      </span>
      <span
        className={`text-xl font-bold ${accent ? "text-red-400" : "text-neutral-900 dark:text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}

function LegacyBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] uppercase font-bold tracking-widest text-amber-500">
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        className="shrink-0"
      >
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 3V5.5L6.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      Pre-tracking
    </span>
  );
}

interface ChartDataPoint {
  puzzle_number: number;
  value: number;
  rollingAvg: number | null;
  date: string;
  id: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
  game: string;
}

function ChartTooltip({ active, payload, game }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-white">
        #{data.puzzle_number}
      </p>
      <p className="text-[10px] text-neutral-400">{data.date}</p>
      <p className="text-sm font-bold text-red-400 mt-1">
        {isPinpoint(game)
          ? data.value === 6 ? "Didn't Guess" : `${data.value} guess${data.value !== 1 ? "es" : ""}`
          : formatTime(data.value)}
      </p>
      {data.rollingAvg !== null && (
        <p className="text-[10px] text-orange-400 mt-0.5">
          7-day Average:{" "}
          {isPinpoint(game)
            ? data.rollingAvg.toFixed(1)
            : formatTime(Math.round(data.rollingAvg))}
        </p>
      )}
    </div>
  );
}

const TIMED_GAMES = GAMES.filter((g) => !isPinpoint(g));

function OverviewTab({
  grouped,
}: {
  grouped: Record<string, PuzzleResult[]>;
}) {
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  const totalTimeToday = useMemo(() => {
    let sum = 0;
    for (const game of TIMED_GAMES) {
      for (const r of grouped[game] ?? []) {
        if (
          r.time_seconds !== null &&
          new Date(r.created_at).toLocaleDateString("en-CA") === todayStr
        ) {
          sum += r.time_seconds;
        }
      }
    }
    return sum;
  }, [grouped, todayStr]);

  const totalTimeAllTime = useMemo(() => {
    let sum = 0;
    for (const game of TIMED_GAMES) {
      for (const r of grouped[game] ?? []) {
        if (r.time_seconds !== null) sum += r.time_seconds;
      }
    }
    return sum;
  }, [grouped]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Total time summary */}
      <div>
        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3">
          Total Time
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Today"
            value={totalTimeToday > 0 ? formatTime(totalTimeToday) : "—"}
            accent
          />
          <StatCard
            label="All Time"
            value={totalTimeAllTime > 0 ? formatDuration(totalTimeAllTime) : "—"}
          />
        </div>
      </div>

      {/* Per-game latest results */}
      <div>
        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3">
          Latest Results
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GAMES.map((game) => {
            const results = grouped[game];
            if (!results || results.length === 0) {
              return (
                <div
                  key={game}
                  className="flex flex-col gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60"
                >
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {game}
                  </span>
                  <span className="text-xs text-neutral-400">No data yet</span>
                </div>
              );
            }
            const latest = results.reduce((a, b) =>
              new Date(a.created_at) > new Date(b.created_at) ? a : b,
            );
            const value = isPinpoint(game)
              ? `${latest.guesses} guess${latest.guesses !== 1 ? "es" : ""}`
              : latest.time_seconds !== null
                ? formatTime(latest.time_seconds)
                : "—";
            return (
              <div
                key={game}
                className="flex flex-col gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:border-red-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {game}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-md">
                    #{latest.puzzle_number}
                  </span>
                </div>
                <span className="text-2xl font-bold text-red-400">{value}</span>
                <span className="text-[10px] text-neutral-400">
                  {formatDate(latest.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function GameTab({
  game,
  results,
  grouped,
}: {
  game: string;
  results: PuzzleResult[];
  grouped: Record<string, PuzzleResult[]>;
}) {
  const [selectedPoint, setSelectedPoint] = useState<PuzzleResult | null>(null);

  const stats = useMemo(
    () => calculateStats(results, game, grouped),
    [results, game, grouped],
  );
  const legacy = legacyValues[game];

  const extendedResults = useMemo(() => {
    let baseData = [...results];
    
    if (isPinpoint(game) && grouped["Queens"]) {
      const pinpointPuzzleNumbers = new Set(results.map((r) => r.puzzle_number));
      const queensResults = grouped["Queens"];
      
      queensResults.forEach(qr => {
        if (!pinpointPuzzleNumbers.has(qr.puzzle_number)) {
           baseData.push({
             id: -qr.puzzle_number,
             game: "Pinpoint",
             puzzle_number: qr.puzzle_number,
             time_seconds: null,
             guesses: 6,
             created_at: qr.created_at
           });
        }
      });
    }
    return baseData.sort((a, b) => a.puzzle_number - b.puzzle_number);
  }, [results, game, grouped]);

  const chartData = useMemo((): ChartDataPoint[] => {
    const raw = extendedResults.map((r) => ({
      puzzle_number: r.puzzle_number,
      value: isPinpoint(game) ? (r.guesses ?? 0) : (r.time_seconds ?? 0),
      date: formatDate(r.created_at),
      id: r.id,
      rollingAvg: null as number | null,
    }));

    // Compute 7-day rolling average
    const WINDOW = 7;
    for (let i = 0; i < raw.length; i++) {
      const windowStart = Math.max(0, i - WINDOW + 1);
      const windowSlice = raw.slice(windowStart, i + 1);

      // For Pinpoint, exclude "failed" (value=6) entries from the average
      const validValues = isPinpoint(game)
        ? windowSlice.filter((d) => d.value !== 6 && d.value > 0).map((d) => d.value)
        : windowSlice.map((d) => d.value);

      if (validValues.length > 0) {
        raw[i].rollingAvg =
          validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
      }
    }

    return raw;
  }, [extendedResults, game]);

  const average = useMemo(() => {
    const validData = isPinpoint(game) ? chartData.filter(d => d.value !== 6 && d.value > 0) : chartData;
    if (validData.length === 0) return 0;
    return (
      validData.reduce((sum, d) => sum + d.value, 0) / validData.length
    );
  }, [chartData, game]);

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-16 text-neutral-400"
      >
        No data available for {game}.
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Best" value={stats.best} accent />
        <StatCard
          label="Average"
          value={stats.average}
        />
        {stats.total !== null && (
          <StatCard label="Total Time" value={stats.total} />
        )}
        <StatCard label="Games Tracked" value={String(stats.gamesTracked)} />
        <StatCard
          label="Current Streak"
          value={`${stats.streak} day${stats.streak !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Legacy Values */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-500/15 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <LegacyBadge />
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
            Stats from before automated tracking
          </span>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500/60">
              Personal Best
            </span>
            <span className="text-sm font-bold text-amber-400">
              {legacy.pb}
            </span>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
        <h4 className="text-[10px] uppercase font-bold tracking-[0.15em] text-neutral-400 dark:text-neutral-500 mb-4">
          {isPinpoint(game) ? "Guesses" : "Time"} by Puzzle
        </h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <XAxis
              dataKey="puzzle_number"
              tick={{ fill: "#737373", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#404040" }}
              label={{
                value: "Puzzle #",
                position: "insideBottomRight",
                offset: -5,
                fill: "#737373",
                fontSize: 10,
              }}
            />
            <YAxis
              tick={{ fill: "#737373", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#404040" }}
              tickFormatter={(val: number) =>
                isPinpoint(game) ? (val === 6 ? "Failed" : String(val)) : formatTime(val)
              }
              domain={isPinpoint(game) ? [0, 6] : ["auto", "auto"]}
              label={{
                value: isPinpoint(game) ? "Guesses" : "Time",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                fill: "#737373",
                fontSize: 10,
              }}
            />
            <Tooltip
              content={<ChartTooltip game={game} />}
              cursor={{ stroke: "#525252", strokeDasharray: "4 4" }}
            />
            <ReferenceLine
              y={average}
              stroke="#f87171"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              label={{
                value: `Avg: ${isPinpoint(game) ? average.toFixed(1) : formatTime(Math.round(average))}`,
                position: "insideTopRight",
                fill: "#f87171",
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="rollingAvg"
              name="7-Day Avg"
              stroke="#fb923c"
              strokeWidth={2}
              strokeOpacity={0.7}
              dot={false}
              activeDot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Result"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "#1c1c1c",
                stroke: "#ef4444",
                strokeWidth: 2,
                cursor: "pointer",
              }}
              activeDot={{
                r: 6,
                fill: "#ef4444",
                stroke: "#fff",
                strokeWidth: 2,
                cursor: "pointer",
                onClick: (_: any, payload: any) => {
                  const point = extendedResults.find(
                    (r) =>
                      r.puzzle_number === payload?.payload?.puzzle_number || r.puzzle_number === payload?.puzzle_number,
                  );
                  if (point) setSelectedPoint(point);
                },
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Card */}
      {selectedPoint && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-6 p-4 rounded-xl border border-red-500/20 bg-red-950/10"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Selected
            </span>
            <span className="text-lg font-bold text-white">
              {selectedPoint.game} #{selectedPoint.puzzle_number}
            </span>
          </div>
          <div className="h-10 w-px bg-neutral-700" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Date
            </span>
            <span className="text-sm text-neutral-300">
              {formatDate(selectedPoint.created_at)}
            </span>
          </div>
          <div className="h-10 w-px bg-neutral-700" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              {isPinpoint(game) ? "Guesses" : "Time"}
            </span>
            <span className="text-sm font-bold text-red-400">
              {isPinpoint(game)
                ? selectedPoint.guesses === 6 ? "Didn't guess" : `${selectedPoint.guesses} guess${selectedPoint.guesses !== 1 ? "es" : ""}`
                : selectedPoint.time_seconds !== null
                  ? formatTime(selectedPoint.time_seconds)
                  : "—"}
            </span>
          </div>
          <button
            onClick={() => setSelectedPoint(null)}
            className="ml-auto text-neutral-500 hover:text-white transition-colors text-xs"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function LinkedInPuzzles() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const { data: grouped, isPending } = useQuery<
    Record<string, PuzzleResult[]>
  >({
    queryKey: ["linkedin-puzzles"],
    queryFn: async () => {
      const response = await fetch(
        "https://linkedin-puzzles.mdunne697.workers.dev/results",
      );
      if (!response.ok) throw new Error("Failed to fetch puzzle results");
      const data: PuzzleResult[] = await response.json();
      return data.reduce(
        (acc: Record<string, PuzzleResult[]>, result: PuzzleResult) => {
          if (!acc[result.game]) acc[result.game] = [];
          acc[result.game].push(result);
          return acc;
        },
        {},
      );
    },
    staleTime: 60000,
  });

  const tabs = [
    { key: null, label: "Overview" },
    ...GAMES.map((g) => ({ key: g, label: g })),
  ];

  return (
    <div className="min-h-screen w-full bg-white dark:bg-neutral-950 p-4 md:p-8">
      <Pokedex>
        {/* Left Column — Static Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="md:w-[38%] p-6 md:p-8 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700 relative"
        >
          {/* Spacer to clear the Pokedex header bar */}
          <div className="h-14 shrink-0" />
          <div className="max-w-[500px] text-center">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2">
              LinkedIn Puzzles
            </h1>
            <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Daily Puzzle Statistics
            </h2>
            <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8">
              Updated Daily
            </span>

            <div className="prose prose-neutral dark:prose-invert">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                Every day, LinkedIn publishes a set of daily puzzles. They say, “One of the best ways to deepen and reignite relationships at work is simply by having fun together. So we're excited to roll out a series of thinking-oriented games that allow you to do just that.” I love learning and solving problems, and I think that succeeding at something challenging is more rewarding than succeeding at an easy task. This is a philosophy I carry in my daily life, and likely why I enjoy solving the LinkedIn puzzles so much.
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mt-4">
                The games I play daily are <strong>Queens</strong>, <strong>Tango</strong>, <strong>Patches</strong>, <strong>Zip</strong>, <strong>Wend</strong>, and <strong>Pinpoint</strong>. I particularly like how with the LinkedIn puzzles, there is a leaderboard with your connections, so you can see how you did compared to them every day. However, there is some cool information that they don't publish, so I have decided to track it myself.
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mt-4">
                This page uses a Cloudflare Worker to receive my LinkedIn puzzle results. After finishing a puzzle, I share the result to HTTP Shortcuts on Android, which sends it to my database. The stats are then pulled from the database and displayed here.
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mt-4">
                Select a game tab to see detailed stats, personal bests,
                streaks, and a graph of every puzzle result over time.
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mt-4">
                One thing this page is missing is a way to quantify my results against those of other people. I encourage you to connect with me on LinkedIn to see my results, as I think they are quite good.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column — Interactive Content */}
        <div className="md:w-[62%] p-6 pt-24 md:p-8 md:pt-24">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full h-full"
          >
            {isPending ? (
              <LoadingSkeleton />
            ) : (
              <div className="flex flex-col gap-6">
                {/* Tab Bar */}
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.label}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        activeTab === tab.key
                          ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === null ? (
                  <OverviewTab grouped={grouped || {}} />
                ) : (
                  <GameTab
                    key={activeTab}
                    game={activeTab}
                    results={grouped?.[activeTab] || []}
                    grouped={grouped || {}}
                  />
                )}
              </div>
            )}
          </motion.div>
        </div>
      </Pokedex>
      {/* Mobile Spacer */}
      <div className="h-32 w-full shrink-0 md:hidden" />
    </div>
  );
}
