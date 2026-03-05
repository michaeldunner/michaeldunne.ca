import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion } from "motion/react";
import { Pokedex } from './pokedex';
import fieldImage from '../../assets/field.svg';
import { cn } from "../../lib/utils";
import { IconX, IconPlayerPlayFilled, IconPlayerPauseFilled } from "@tabler/icons-react";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Sample {
    t: number;
    x: number;
    y: number;
    heading: number;
    vx: number;
    vy: number;
    omega: number;
}

interface Trajectory {
    id: string;
    filename: string;
    alliance: 'blue' | 'red';
    originalSamples: Sample[];
    samples: Sample[];
    color: string;
    splits: number[];
    splitDelays: number[];
}

interface SplitTimeInfo {
    trajTime: number;
    delay: number;
}

interface TrajFile {
    name?: string;
    version?: number;
    trajectory: {
        samples: Array<Sample>;
        splits?: number[];
    };
}

// ============================================================================
// Constants
// ============================================================================

const FIELD_LENGTH_M = 16.54;
const FIELD_WIDTH_M = 8.07;
const SCALE = 100; // 1 meter = 100 SVG units
const SVG_WIDTH = FIELD_LENGTH_M * SCALE; // 1654
const SVG_HEIGHT = FIELD_WIDTH_M * SCALE; // 807
const FIELD_IMAGE_SCALE = 0.995; // Scale field image from center

const ROBOT_SIZE_M = 0.75;
const ROBOT_SIZE_SVG = ROBOT_SIZE_M * SCALE; // 75

const PATH_STROKE_WIDTH = 5; // 0.05m = 5 SVG units
const PATH_OPACITY = 0.4;

const COLOR_PALETTE = [
    '#e41a1c',
    '#377eb8',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#ffff33',
    '#a65628',
    '#f781bf',
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize a rotation angle to [-π, π]
 */
function normalizeRotation(rotation: number): number {
    let r = rotation;
    while (r > Math.PI) r -= 2 * Math.PI;
    while (r < -Math.PI) r += 2 * Math.PI;
    return r;
}

/**
 * Apply WPILib FlipUtil transformation for Red Alliance
 * This is a 180° rotation around the field center
 */
function flipSampleToRed(sample: Sample): Sample {
    const redX = FIELD_LENGTH_M - sample.x;
    const redY = FIELD_WIDTH_M - sample.y;
    const redHeading = normalizeRotation(Math.PI + sample.heading);

    return {
        ...sample,
        x: redX,
        y: redY,
        heading: redHeading,
    };
}

/**
 * Transform samples based on alliance
 */
function transformSamples(originalSamples: Sample[], alliance: 'blue' | 'red'): Sample[] {
    if (alliance === 'blue') {
        return originalSamples;
    }
    return originalSamples.map(flipSampleToRed);
}

/**
 * Convert meters to SVG coordinates
 * SVG Y-axis is flipped (0 at top)
 */
function metersToSvg(x: number, y: number): { svgX: number; svgY: number } {
    return {
        svgX: x * SCALE,
        svgY: SVG_HEIGHT - y * SCALE,
    };
}

/**
 * Linear interpolation between two values
 */
function lerp(a: number, b: number, alpha: number): number {
    return a + (b - a) * alpha;
}

/**
 * Interpolate rotation with proper wrapping
 */
function lerpRotation(r1: number, r2: number, alpha: number): number {
    let deltaRotation = r2 - r1;
    while (deltaRotation > Math.PI) deltaRotation -= 2 * Math.PI;
    while (deltaRotation < -Math.PI) deltaRotation += 2 * Math.PI;
    return r1 + deltaRotation * alpha;
}

/**
 * Get the pose at a specific time for a trajectory
 */
function getPoseAtTime(samples: Sample[], time: number): { x: number, y: number, heading: number } {
    if (samples.length === 0) {
        return { x: 0, y: 0, heading: 0 };
    }

    // Before first sample
    if (time <= samples[0].t) {
        return { x: samples[0].x, y: samples[0].y, heading: samples[0].heading };
    }

    // After last sample
    if (time >= samples[samples.length - 1].t) {
        return { x: samples[samples.length - 1].x, y: samples[samples.length - 1].y, heading: samples[samples.length - 1].heading };
    }

    // Find bracketing samples
    for (let i = 0; i < samples.length - 1; i++) {
        const s1 = samples[i];
        const s2 = samples[i + 1];

        if (time >= s1.t && time <= s2.t) {
            // Exact match
            if (time === s1.t) return { x: s1.x, y: s1.y, heading: s1.heading };
            if (time === s2.t) return { x: s2.x, y: s2.y, heading: s2.heading };

            // Interpolate
            const alpha = (time - s1.t) / (s2.t - s1.t);
            return {
                x: lerp(s1.x, s2.x, alpha),
                y: lerp(s1.y, s2.y, alpha),
                heading: lerpRotation(s1.heading, s2.heading, alpha),
            };
        }
    }

    // Fallback (shouldn't reach here)
    return { x: samples[samples.length - 1].x, y: samples[samples.length - 1].y, heading: samples[samples.length - 1].heading };
}

/**
 * Validate a .traj file structure
 */
function validateTrajFile(data: unknown): data is TrajFile {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;

    // Check for nested trajectory object
    if (!obj.trajectory || typeof obj.trajectory !== 'object') return false;
    const traj = obj.trajectory as Record<string, unknown>;

    if (!Array.isArray(traj.samples)) return false;
    if (traj.samples.length === 0) return false;

    // Validate first sample structure
    const sample = traj.samples[0];
    if (typeof sample !== 'object' || sample === null) return false;
    const s = sample as Record<string, unknown>;

    if (typeof s.t !== 'number') return false;
    if (typeof s.x !== 'number') return false;
    if (typeof s.y !== 'number') return false;
    if (typeof s.heading !== 'number') return false;

    return true;
}

/**
 * Generate a unique ID for a trajectory
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Compute the split time info array for a trajectory.
 * Returns one entry per non-zero split: { trajTime, delay }.
 */
function getSplitTimeInfos(traj: Trajectory): SplitTimeInfo[] {
    const infos: SplitTimeInfo[] = [];
    for (let i = 1; i < traj.splits.length; i++) {
        const sampleIndex = traj.splits[i];
        if (sampleIndex < traj.samples.length) {
            infos.push({
                trajTime: traj.samples[sampleIndex].t,
                delay: traj.splitDelays[i - 1] || 0,
            });
        }
    }
    return infos;
}

/**
 * Map a virtual timeline time (which includes delay gaps) to the effective
 * trajectory time. During a delay gap, returns the split point's trajectory
 * time so the robot holds still.
 */
function getEffectiveTrajectoryTime(currentTime: number, splitInfos: SplitTimeInfo[]): number {
    const EPS = 1e-9;
    let accumulatedDelay = 0;

    for (const info of splitInfos) {
        const gapStart = info.trajTime + accumulatedDelay;
        const gapEnd = gapStart + info.delay;

        if (currentTime < gapStart - EPS) {
            // Before this split's gap — subtract all accumulated delays so far
            return currentTime - accumulatedDelay;
        }

        if (currentTime < gapEnd + EPS) {
            // Inside this split's delay gap — hold at split time
            return info.trajTime;
        }

        accumulatedDelay += info.delay;
    }

    // Past all splits — subtract total accumulated delay
    return currentTime - accumulatedDelay;
}

/**
 * Compute the virtual timeline duration for a trajectory
 * (trajectory duration + sum of all delays)
 */
function getVirtualDuration(traj: Trajectory): number {
    if (traj.samples.length === 0) return 0;
    const trajDuration = traj.samples[traj.samples.length - 1].t;
    const totalDelay = traj.splitDelays.reduce((sum, d) => sum + d, 0);
    return trajDuration + totalDelay;
}

// ============================================================================
// Components
// ============================================================================

interface TrajectoryPathProps {
    trajectory: Trajectory;
}

const TrajectoryPath: React.FC<TrajectoryPathProps> = ({ trajectory }) => {
    const points = trajectory.samples
        .map((sample) => {
            const { svgX, svgY } = metersToSvg(sample.x, sample.y);
            return `${svgX},${svgY}`;
        })
        .join(' ');

    return (
        <polyline
            points={points}
            stroke={trajectory.color}
            strokeWidth={PATH_STROKE_WIDTH}
            strokeOpacity={PATH_OPACITY}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
};

interface RobotVisualizationProps {
    pose: { x: number; y: number; heading: number };
    color: string;
}

const RobotVisualization: React.FC<RobotVisualizationProps> = ({ pose, color }) => {
    const { svgX, svgY } = metersToSvg(pose.x, pose.y);

    // SVG rotation is in degrees, clockwise from positive X
    // WPILib rotation is counter-clockwise from positive X
    // SVG also has Y flipped, so we need to negate the rotation
    const rotationDeg = (-pose.heading * 180) / Math.PI;

    return (
        <g transform={`translate(${svgX}, ${svgY}) rotate(${rotationDeg})`}>
            <rect
                x={-ROBOT_SIZE_SVG / 2}
                y={-ROBOT_SIZE_SVG / 2}
                width={ROBOT_SIZE_SVG}
                height={ROBOT_SIZE_SVG}
                fill={color}
                stroke="#000"
                strokeWidth={2}
            />
            {/* Direction indicator - front of robot (positive X in robot frame) */}
            <polygon
                points={`${ROBOT_SIZE_SVG / 2},-10 ${ROBOT_SIZE_SVG / 2 + 15},0 ${ROBOT_SIZE_SVG / 2},10`}
                fill={color}
                stroke="#000"
                strokeWidth={1}
            />
        </g>
    );
};

interface FieldGridProps {
    showGrid?: boolean;
}

const FieldGrid: React.FC<FieldGridProps> = ({ showGrid = false }) => {
    const gridLines: React.ReactNode[] = [];

    if (showGrid) {
        // Vertical lines (every 1 meter)
        // for (let x = 0; x <= FIELD_LENGTH_M; x++) {
        //     const { svgX } = metersToSvg(x, 0);
        //     gridLines.push(
        //         <line
        //             key={`v-${x}`}
        //             x1={svgX}
        //             y1={0}
        //             x2={svgX}
        //             y2={SVG_HEIGHT}
        //             stroke="#666"
        //             strokeWidth={1}
        //             strokeOpacity={0.3}
        //         />
        //     );
        // }

        // // Horizontal lines (every 1 meter)
        // for (let y = 0; y <= FIELD_WIDTH_M; y++) {
        //     const { svgY } = metersToSvg(0, y);
        //     gridLines.push(
        //         <line
        //             key={`h-${y}`}
        //             x1={0}
        //             y1={svgY}
        //             x2={SVG_WIDTH}
        //             y2={svgY}
        //             stroke="#666"
        //             strokeWidth={1}
        //             strokeOpacity={0.3}
        //         />
        //     );
        // }

        // Center line
        // gridLines.push(
        //     <line
        //         key="center"
        //         x1={SVG_WIDTH / 2}
        //         y1={0}
        //         x2={SVG_WIDTH / 2}
        //         y2={SVG_HEIGHT}
        //         stroke="#fff"
        //         strokeWidth={2}
        //         strokeOpacity={0.5}
        //     />
        // );
    }

    // Field image dimensions from SVG viewBox (-0.5 -0.5 17.541 9.0692)
    // The image has a ~0.5m border around the 16.54x8.07m field
    const FIELD_SVG_WIDTH_M = 17.541;
    const FIELD_SVG_HEIGHT_M = 9.0692;

    const imgWidth = FIELD_SVG_WIDTH_M * SCALE * FIELD_IMAGE_SCALE;
    const imgHeight = FIELD_SVG_HEIGHT_M * SCALE * FIELD_IMAGE_SCALE;

    // Center the image on the canvas
    const imgX = (SVG_WIDTH - imgWidth) / 2;
    const imgY = (SVG_HEIGHT - imgHeight) / 2;

    return (
        <>
            {/* Field background */}
            <image
                href={fieldImage}
                x={imgX}
                y={imgY}
                width={imgWidth}
                height={imgHeight}
                preserveAspectRatio="none"
            />

            {gridLines}
            {/* Alliance station indicators */}
            {/* <rect x={0} y={0} width={30} height={SVG_HEIGHT} fill="#3366cc" opacity={0.3} />
            <rect x={SVG_WIDTH - 30} y={0} width={30} height={SVG_HEIGHT} fill="#cc3333" opacity={0.3} /> */}
        </>
    );
};

interface LegendItemProps {
    trajectory: Trajectory;
    onAllianceChange: (id: string, alliance: 'blue' | 'red') => void;
    onRemove: (id: string) => void;
}

const LegendItem: React.FC<LegendItemProps> = ({ trajectory, onAllianceChange, onRemove }) => {
    return (
        <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-700/50 rounded-xl shadow-sm hover:shadow-md transition-all group">
            {/* Color swatch */}
            <div
                className="w-4 h-4 rounded-md flex-shrink-0 shadow-inner"
                style={{ backgroundColor: trajectory.color }}
            />

            {/* Filename */}
            <span
                className="flex-1 text-neutral-900 dark:text-neutral-200 text-xs font-semibold truncate"
                title={trajectory.filename}
            >
                {trajectory.filename}
            </span>

            {/* Alliance dropdown */}
            <select
                value={trajectory.alliance}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onAllianceChange(trajectory.id, e.target.value as 'blue' | 'red')}
                className={cn(
                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border-none cursor-pointer outline-none transition-all shadow-sm",
                    trajectory.alliance === 'blue'
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                )}
            >
                <option value="blue" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Blue</option>
                <option value="red" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Red</option>
            </select>

            {/* Remove button */}
            <button
                onClick={() => onRemove(trajectory.id)}
                className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                title="Remove trajectory"
            >
                <IconX size={14} />
            </button>
        </div>
    );
};

interface SplitDelayControlsProps {
    trajectories: Trajectory[];
    onDelayChange: (trajectoryId: string, splitIndex: number, value: number) => void;
}

const SplitDelayControls: React.FC<SplitDelayControlsProps> = ({ trajectories, onDelayChange }) => {
    const trajsWithSplits = trajectories.filter(t => t.splits.length > 1);
    if (trajsWithSplits.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                SPLIT DELAYS
            </h3>
            {trajsWithSplits.map(traj => {
                const splitInfos = getSplitTimeInfos(traj);
                return (
                    <div key={traj.id} className="flex flex-col gap-2">
                        {trajsWithSplits.length > 1 && (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: traj.color }}
                                />
                                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 truncate">
                                    {traj.filename}
                                </span>
                            </div>
                        )}
                        {splitInfos.map((info, idx) => (
                            <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-700/50 rounded-xl">
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                                    Pause at T={info.trajTime.toFixed(2)}s
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={0}
                                        max={20}
                                        step={0.1}
                                        value={traj.splitDelays[idx]}
                                        onChange={(e) => onDelayChange(traj.id, idx, parseFloat(e.target.value))}
                                        className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        step={0.1}
                                        value={traj.splitDelays[idx]}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            if (!isNaN(v)) onDelayChange(traj.id, idx, Math.max(0, Math.min(20, v)));
                                        }}
                                        onBlur={(e) => {
                                            let v = parseFloat(e.target.value);
                                            if (isNaN(v)) v = 0;
                                            v = Math.max(0, Math.min(20, v));
                                            onDelayChange(traj.id, idx, v);
                                        }}
                                        className="w-16 px-2 py-1 text-xs font-mono text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                                    />
                                    <span className="text-[10px] text-neutral-400 font-medium">s</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

const ChoreoOverlayPage: React.FC = () => {
    const [trajectories, setTrajectories] = useState<Trajectory[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const lastFrameTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const colorIndexRef = useRef(0);

    // Calculate max time across all trajectories (virtual timeline including delays)
    const maxTime = useMemo(() => {
        if (trajectories.length === 0) return 0;
        return trajectories.reduce((max, t) => {
            return Math.max(max, getVirtualDuration(t));
        }, 0);
    }, [trajectories]);

    // Handle file upload
    const handleFileUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            const newTrajectories: Trajectory[] = [];
            const newErrors: string[] = [];

            for (const file of Array.from(files)) {
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);

                    if (!validateTrajFile(data)) {
                        newErrors.push(`Failed to load ${file.name}: Invalid Choreo trajectory file: Expected { trajectory: { samples: [...] } }`);
                        continue;
                    }

                    const originalSamples: Sample[] = data.trajectory.samples.map((s) => ({
                        t: s.t,
                        x: s.x,
                        y: s.y,
                        heading: s.heading,
                        vx: s.vx || 0,
                        vy: s.vy || 0,
                        omega: s.omega || 0,
                    }));

                    // Parse splits (default to [0] if absent)
                    const splits: number[] = Array.isArray(data.trajectory.splits)
                        ? data.trajectory.splits
                        : [0];
                    // One delay per non-zero split, initialized to 0
                    const splitDelays = new Array(Math.max(0, splits.length - 1)).fill(0);

                    const color = COLOR_PALETTE[colorIndexRef.current % COLOR_PALETTE.length];
                    colorIndexRef.current++;

                    newTrajectories.push({
                        id: generateId(),
                        filename: file.name,
                        alliance: 'blue',
                        originalSamples,
                        samples: originalSamples,
                        color,
                        splits,
                        splitDelays,
                    });
                } catch (err) {
                    newErrors.push(`Failed to load ${file.name}: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
                }
            }

            if (newTrajectories.length > 0) {
                setTrajectories((prev) => [...prev, ...newTrajectories]);
            }

            if (newErrors.length > 0) {
                setErrors((prev) => [...prev, ...newErrors]);
                // Auto-clear errors after 5 seconds
                setTimeout(() => {
                    setErrors((prev) => prev.filter((e) => !newErrors.includes(e)));
                }, 5000);
            }

            // Reset input to allow re-uploading same file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        []
    );

    // Handle alliance change
    const handleAllianceChange = useCallback((id: string, alliance: 'blue' | 'red') => {
        setTrajectories((prev) =>
            prev.map((t: Trajectory) => {
                if (t.id !== id) return t;
                return {
                    ...t,
                    alliance,
                    samples: transformSamples(t.originalSamples, alliance),
                };
            })
        );
    }, []);

    // Handle trajectory removal
    const handleRemove = useCallback((id: string) => {
        setTrajectories((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Handle split delay change
    const handleSplitDelayChange = useCallback((trajectoryId: string, splitIndex: number, value: number) => {
        setTrajectories((prev) =>
            prev.map((t) => {
                if (t.id !== trajectoryId) return t;
                const newDelays = [...t.splitDelays];
                newDelays[splitIndex] = value;
                return { ...t, splitDelays: newDelays };
            })
        );
    }, []);

    // Handle clear all
    const handleClearAll = useCallback(() => {
        setTrajectories([]);
        setCurrentTime(0);
        colorIndexRef.current = 0;
    }, []);

    // Handle time change
    const handleTimeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentTime(parseFloat(event.target.value));
        // Pause if user manually scrubbing
        // setIsPlaying(false); // Optional: usually good UX to pause on scrub, but user might want to drag while playing. Let's keep it running or not depending on pref. Standard video players often pause or seek.
        // Let's not force pause, but it might be jerky. Let's leave it.
    }, []);

    // Animation loop
    const animate = useCallback((time: number) => {
        if (lastFrameTimeRef.current !== 0) {
            const deltaTime = (time - lastFrameTimeRef.current) / 1000;
            setCurrentTime((prevTime) => {
                // We need to access maxTime here.
                // Since maxTime is calculated from trajectories, we should use a ref or ensure this closure is updated.
                // However, maxTime is in the dependency array of the parent scope, so we need to be careful.
                // A better way is to pass maxTime to this function or use it from scope if useCallback dependency implies it.

                // Actually, let's just use the scope variable 'maxTime' and add it to dependency.
                // But we can't fully trust state updates in rAF if we don't handle it right.
                // The logical maxTime is available in scope.

                const newTime = prevTime + deltaTime;
                if (newTime >= maxTime) {
                    setIsPlaying(false);
                    return maxTime;
                }
                return newTime;
            });
        }
        lastFrameTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [maxTime]);

    // Handle play toggle
    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => {
            const willPlay = !prev;
            if (willPlay && currentTime >= maxTime) {
                setCurrentTime(0);
            }
            return willPlay;
        });
    }, [currentTime, maxTime]);

    // Effect for animation
    useEffect(() => {
        if (isPlaying) {
            lastFrameTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(requestRef.current);
            lastFrameTimeRef.current = 0;
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, animate]);

    return (
        <div className="min-h-screen w-full bg-white dark:bg-neutral-950 p-4 md:p-8">
            <Pokedex>
                <div className="flex flex-col w-full">
                    {/* Main Split View */}
                    <div className="grid grid-cols-1 md:grid-cols-[2.5fr_1fr] items-stretch w-full border-b border-neutral-300 dark:border-neutral-700 h-auto">
                        {/* Left Column: Visualizer & Timeline */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="p-6 pt-24 md:p-8 md:pt-32 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700 relative"
                        >
                            <div className="flex-1 bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-xl overflow-hidden flex items-center justify-center min-h-[400px] md:min-h-[600px]">
                                <svg
                                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                                    className="w-full h-auto max-h-full"
                                    preserveAspectRatio="xMidYMid meet"
                                >
                                    <FieldGrid showGrid={true} />
                                    {trajectories.map((traj: Trajectory) => (
                                        <TrajectoryPath key={traj.id} trajectory={traj} />
                                    ))}
                                    {trajectories.map((traj: Trajectory) => {
                                        const splitInfos = getSplitTimeInfos(traj);
                                        const effectiveTime = getEffectiveTrajectoryTime(currentTime, splitInfos);
                                        const pose = getPoseAtTime(traj.samples, effectiveTime);
                                        return (
                                            <RobotVisualization
                                                key={`robot-${traj.id}`}
                                                pose={pose}
                                                color={traj.color}
                                            />
                                        );
                                    })}
                                </svg>
                            </div>

                            {/* Timeline Scrubber Component */}
                            <div className={`flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-lg transition-opacity ${trajectories.length > 0 ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}>
                                <button
                                    onClick={togglePlay}
                                    disabled={trajectories.length === 0}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shadow-lg bg-red-600 hover:bg-red-700 shadow-red-500/20 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:shadow-none`}
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? <IconPlayerPauseFilled size={20} /> : <IconPlayerPlayFilled size={20} />}
                                </button>
                                <div className="flex flex-col flex-1 gap-1">
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                                        <span>{currentTime.toFixed(2)}s</span>
                                        <span>{maxTime.toFixed(2)}s</span>
                                    </div>
                                    <div className="relative w-full">
                                        <input
                                            type="range"
                                            min={0}
                                            max={maxTime || 0.01}
                                            step={0.01}
                                            value={currentTime}
                                            onChange={handleTimeChange}
                                            disabled={trajectories.length === 0}
                                            className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600 disabled:cursor-not-allowed relative z-10"
                                        />
                                        {/* Split tick marks */}
                                        {maxTime > 0 && trajectories.map((traj) => {
                                            const splitInfos = getSplitTimeInfos(traj);
                                            if (splitInfos.length === 0) return null;
                                            let accDelay = 0;
                                            return splitInfos.map((info, idx) => {
                                                const virtualPos = info.trajTime + accDelay;
                                                accDelay += info.delay;
                                                const pct = (virtualPos / maxTime) * 100;
                                                return (
                                                    <div
                                                        key={`${traj.id}-split-${idx}`}
                                                        className="absolute top-0 w-0.5 h-full rounded-full pointer-events-none"
                                                        style={{
                                                            left: `${pct}%`,
                                                            backgroundColor: traj.color,
                                                            opacity: 0.6,
                                                        }}
                                                    />
                                                );
                                            });
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column: Controls & Legend */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                            className="p-8 pt-12 md:p-12 md:pt-32 bg-white dark:bg-neutral-900 flex flex-col gap-8 overflow-y-auto"
                        >
                            <div>
                                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2 leading-tight">
                                    Trajectory Visualizer
                                </h1>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                                    Upload .traj files from Choreo to visualize and compare mutliple paths at once.
                                </p>

                                <div className="flex flex-col gap-3">
                                    <label className="group relative flex items-center justify-center px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 cursor-pointer transition-all hover:-translate-y-1 active:scale-95 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <span className="relative z-10 flex items-center gap-2">
                                            UPLOAD TRAJECTORIES
                                        </span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".traj,.json"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>

                                    {trajectories.length > 0 && (
                                        <button
                                            onClick={handleClearAll}
                                            className="px-6 py-3 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-sm uppercase tracking-widest"
                                        >
                                            Clear Workspace
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Error Messages */}
                            {errors.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {errors.map((error: string, index: number) => (
                                        <div key={index} className="p-3 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium">
                                            {error}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Trajectories List */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                    TRAJECTORIES ({trajectories.length})
                                </h3>

                                {trajectories.length === 0 ? (
                                    <div className="py-12 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 italic text-sm">
                                        No files uploaded yet.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {trajectories.map((traj: Trajectory) => (
                                            <LegendItem
                                                key={traj.id}
                                                trajectory={traj}
                                                onAllianceChange={handleAllianceChange}
                                                onRemove={handleRemove}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Split Delay Controls */}
                            <SplitDelayControls
                                trajectories={trajectories}
                                onDelayChange={handleSplitDelayChange}
                            />
                        </motion.div>
                    </div>
                </div>
            </Pokedex>
        </div>
    );
};

export default ChoreoOverlayPage;
