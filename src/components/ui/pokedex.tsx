import { ReactNode } from "react";

interface PokedexProps {
  children: ReactNode;
}

export function Pokedex({ children }: PokedexProps) {
  return (
    <div
      className="max-w-6xl mx-auto bg-neutral-50 dark:bg-neutral-900 rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[80vh] border-8 border-red-700 relative"
      style={{
        clipPath:
          "polygon(0 0, 46% 0, 46.5% 0.1px, 47% 0.4px, 47.5% 1px, 48% 2px, 48.5% 4px, 49% 7px, 49.5% 12px, 49.8% 18px, 50% 28px, 50.2% 38px, 50.5% 44px, 51% 50px, 51.5% 53px, 52% 54.5px, 53% 55.5px, 55% 56px, 100% 56px, 100% 100%, 0 100%)",
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
