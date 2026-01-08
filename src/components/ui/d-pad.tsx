"use client";

interface DPadProps {
    onNext: () => void;
    onPrev: () => void;
}

export function DPad({ onNext, onPrev }: DPadProps) {
    return (
        <div className="relative w-32 h-32 flex items-center justify-center translate-x-4">
            <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg overflow-visible">
                <defs>
                    <linearGradient id="padGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
                        <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                {/* Rounded Cross Shape with Border */}
                <path
                    d="M 35,5 A 5,5 0 0 1 40,0 H 60 A 5,5 0 0 1 65,5 V 35 H 95 A 5,5 0 0 1 100,40 V 60 A 5,5 0 0 1 95,65 H 65 V 95 A 5,5 0 0 1 60,100 H 40 A 5,5 0 0 1 35,95 V 65 H 5 A 5,5 0 0 1 0,60 V 40 A 5,5 0 0 1 5,35 H 35 Z"
                    fill="rgb(38, 38, 38)"
                    stroke="rgba(163, 163, 163, 0.3)"
                    strokeWidth="1"
                />
                {/* Gradient Overlay */}
                <path
                    d="M 35,5 A 5,5 0 0 1 40,0 H 60 A 5,5 0 0 1 65,5 V 35 H 95 A 5,5 0 0 1 100,40 V 60 A 5,5 0 0 1 95,65 H 65 V 95 A 5,5 0 0 1 60,100 H 40 A 5,5 0 0 1 35,95 V 65 H 5 A 5,5 0 0 1 0,60 V 40 A 5,5 0 0 1 5,35 H 35 Z"
                    fill="url(#padGradient)"
                    pointerEvents="none"
                />
            </svg>

            {/* Logical Buttons (Invisible but interactive) */}
            <button
                onClick={onPrev}
                className="absolute left-1 w-10 h-10 z-10 cursor-pointer"
                aria-label="Previous"
            />
            <button
                onClick={onNext}
                className="absolute right-1 w-10 h-10 z-10 cursor-pointer"
                aria-label="Next"
            />
        </div>
    );
}
