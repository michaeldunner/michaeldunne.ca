import { ReactNode } from "react";

interface PokedexProps {
    children: ReactNode;
}

export function Pokedex({ children }: PokedexProps) {
    return (
        <div
            className="w-full bg-neutral-50 dark:bg-neutral-900 rounded-3xl overflow-hidden flex flex-col md:flex-row border-8 border-red-700 relative"
            style={{
                clipPath:
                    "polygon(0 0, 43% 0, 45% 56px, 100% 56px, 100% 100%, 0 100%)",
            }}
        >
            {/* Top Decoration */}
            <div className="absolute top-0 left-0 w-full h-14 bg-red-700 flex items-center justify-start gap-4 px-6 z-20">
                <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white shadow-[0_0_10px_#60a5fa] animate-pulse"></div>
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-900 border border-red-950"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400 border border-green-600"></div>
                </div>
            </div>

            {children}
        </div>
    );
}
