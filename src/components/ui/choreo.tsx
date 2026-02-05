import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Pokedex } from './pokedex';

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
}

interface TrajFile {
    name?: string;
    version?: number;
    trajectory: {
        samples: Array<Sample>;
    };
}

// ============================================================================
// Constants
// ============================================================================

const FIELD_LENGTH_M = 16.54;
const FIELD_WIDTH_M = 8.21;
const SCALE = 100; // 1 meter = 100 SVG units
const SVG_WIDTH = FIELD_LENGTH_M * SCALE; // 1654
const SVG_HEIGHT = FIELD_WIDTH_M * SCALE; // 821

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
    const redHeading = normalizeRotation(Math.PI - sample.heading);

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

const FieldGrid: React.FC<FieldGridProps> = ({ showGrid = true }) => {
    const gridLines: React.ReactNode[] = [];

    if (showGrid) {
        // Vertical lines (every 1 meter)
        for (let x = 0; x <= FIELD_LENGTH_M; x++) {
            const { svgX } = metersToSvg(x, 0);
            gridLines.push(
                <line
                    key={`v-${x}`}
                    x1={svgX}
                    y1={0}
                    x2={svgX}
                    y2={SVG_HEIGHT}
                    stroke="#666"
                    strokeWidth={1}
                    strokeOpacity={0.3}
                />
            );
        }

        // Horizontal lines (every 1 meter)
        for (let y = 0; y <= FIELD_WIDTH_M; y++) {
            const { svgY } = metersToSvg(0, y);
            gridLines.push(
                <line
                    key={`h-${y}`}
                    x1={0}
                    y1={svgY}
                    x2={SVG_WIDTH}
                    y2={svgY}
                    stroke="#666"
                    strokeWidth={1}
                    strokeOpacity={0.3}
                />
            );
        }

        // Center line
        gridLines.push(
            <line
                key="center"
                x1={SVG_WIDTH / 2}
                y1={0}
                x2={SVG_WIDTH / 2}
                y2={SVG_HEIGHT}
                stroke="#fff"
                strokeWidth={2}
                strokeOpacity={0.5}
            />
        );
    }

    return (
        <>
            {/* Field background */}
            <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#5a5a5a" />
            {gridLines}
            {/* Alliance station indicators */}
            <rect x={0} y={0} width={30} height={SVG_HEIGHT} fill="#3366cc" opacity={0.3} />
            <rect x={SVG_WIDTH - 30} y={0} width={30} height={SVG_HEIGHT} fill="#cc3333" opacity={0.3} />
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
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px',
                marginBottom: '4px',
            }}
        >
            {/* Color swatch */}
            <div
                style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: trajectory.color,
                    borderRadius: '3px',
                    flexShrink: 0,
                }}
            />

            {/* Filename */}
            <span
                style={{
                    flex: 1,
                    color: '#fff',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
                title={trajectory.filename}
            >
                {trajectory.filename}
            </span>

            {/* Alliance dropdown */}
            <select
                value={trajectory.alliance}
                onChange={(e) => onAllianceChange(trajectory.id, e.target.value as 'blue' | 'red')}
                style={{
                    padding: '4px 8px',
                    backgroundColor: trajectory.alliance === 'blue' ? '#3366cc' : '#cc3333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                }}
            >
                <option value="blue">Blue Alliance</option>
                <option value="red">Red Alliance</option>
            </select>

            {/* Remove button */}
            <button
                onClick={() => onRemove(trajectory.id)}
                style={{
                    padding: '4px 8px',
                    backgroundColor: '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                }}
                title="Remove trajectory"
            >
                ✕
            </button>
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

    // Calculate max time across all trajectories
    const maxTime = useMemo(() => {
        if (trajectories.length === 0) return 0;
        return Math.max(
            ...trajectories.map((t) => {
                if (t.samples.length === 0) return 0;
                return t.samples[t.samples.length - 1].t;
            })
        );
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

                    const color = COLOR_PALETTE[colorIndexRef.current % COLOR_PALETTE.length];
                    colorIndexRef.current++;

                    newTrajectories.push({
                        id: generateId(),
                        filename: file.name,
                        alliance: 'blue',
                        originalSamples,
                        samples: originalSamples,
                        color,
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
            prev.map((t) => {
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
    React.useEffect(() => {
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
        <Pokedex>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '80px 20px 20px 20px',
                    backgroundColor: '#1a1a1a',
                    width: '100%',
                    height: '100%',
                    minHeight: '80vh',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <h1 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>Choreo Trajectory Visualizer</h1>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <label
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#4a9eff',
                                color: '#fff',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            Upload .traj files
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".traj,.json"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </label>

                        {trajectories.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#cc3333',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Error messages */}
                {errors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {errors.map((error, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#cc3333',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                }}
                            >
                                {error}
                            </div>
                        ))}
                    </div>
                )}

                {/* Time Scrubber */}
                {trajectories.length > 0 && maxTime > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            backgroundColor: '#2a2a2a',
                            borderRadius: '6px',
                        }}
                    >
                        <button
                            onClick={togglePlay}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: isPlaying ? '#cc3333' : '#4daf4a',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                padding: 0,
                            }}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <span style={{ color: '#fff', fontSize: '14px', minWidth: '80px' }}>
                            Time: {currentTime.toFixed(2)}s
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={maxTime}
                            step={0.02}
                            value={currentTime}
                            onChange={handleTimeChange}
                            style={{
                                flex: 1,
                                height: '8px',
                                cursor: 'pointer',
                            }}
                        />
                        <span style={{ color: '#888', fontSize: '13px' }}>/ {maxTime.toFixed(2)}s</span>
                    </div>
                )}

                {/* Main content area */}
                <div
                    style={{
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Field visualization */}
                    <div
                        style={{
                            flex: '1 1 400px',
                            backgroundColor: '#2a2a2a',
                            borderRadius: '8px',
                            padding: '12px',
                            overflow: 'hidden',
                        }}
                    >
                        {trajectories.length === 0 ? (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '400px',
                                    color: '#888',
                                    fontSize: '16px',
                                }}
                            >
                                No trajectories loaded. Upload .traj files to visualize.
                            </div>
                        ) : (
                            <svg
                                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '70vh',
                                }}
                                preserveAspectRatio="xMidYMid meet"
                            >
                                {/* Field background and grid */}
                                <FieldGrid showGrid={true} />

                                {/* Trajectory paths */}
                                {trajectories.map((trajectory) => (
                                    <TrajectoryPath key={`path-${trajectory.id}`} trajectory={trajectory} />
                                ))}

                                {/* Robot visualizations at current time */}
                                {trajectories.map((trajectory) => {
                                    const pose = getPoseAtTime(trajectory.samples, currentTime);
                                    return (
                                        <RobotVisualization key={`robot-${trajectory.id}`} pose={pose} color={trajectory.color} />
                                    );
                                })}
                            </svg>
                        )}
                    </div>

                    {/* Legend / Trajectory list */}
                    {trajectories.length > 0 && (
                        <div
                            style={{
                                flex: '0 0 280px',
                                backgroundColor: '#2a2a2a',
                                borderRadius: '8px',
                                padding: '12px',
                                maxHeight: '70vh',
                                overflowY: 'auto',
                            }}
                        >
                            <h3 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '16px' }}>Trajectories</h3>
                            {trajectories.map((trajectory) => (
                                <LegendItem
                                    key={trajectory.id}
                                    trajectory={trajectory}
                                    onAllianceChange={handleAllianceChange}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Info footer */}
                <div style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
                    Field: {FIELD_LENGTH_M}m × {FIELD_WIDTH_M}m | Robot: {ROBOT_SIZE_M}m × {ROBOT_SIZE_M}m | Blue
                    Alliance origin at bottom-left
                </div>
            </div>
        </Pokedex>
    );
};

export default ChoreoOverlayPage;
