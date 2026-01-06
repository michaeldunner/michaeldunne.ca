"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import gyarados from "../../assets/gyarados_pixel_art.png";
import charizard from "../../assets/charizard_pixel_art.png";
import blastoise from "../../assets/blastoise_pixel_art.png";
import venusaur from "../../assets/venusaur_pixel_art.png";

const POKEMON_IMAGES = [
    { src: gyarados, name: "Gyarados" },
    { src: charizard, name: "Charizard" },
    { src: blastoise, name: "Blastoise" },
    { src: venusaur, name: "Venusaur" },
];

function Pool() {
    const [currentIdx, setCurrentIdx] = useState(0);

    // Auto-scroll logic
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIdx((prev) => (prev + 1) % POKEMON_IMAGES.length);
        }, 5000); // 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeft = x < rect.width / 2;

        if (isLeft) {
            setCurrentIdx(
                (prev) => (prev - 1 + POKEMON_IMAGES.length) % POKEMON_IMAGES.length,
            );
        } else {
            setCurrentIdx((prev) => (prev + 1) % POKEMON_IMAGES.length);
        }
    };

    return (
        <div className="h-full w-full bg-neutral-900 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto bg-white dark:bg-neutral-900 rounded-[30px] overflow-hidden flex flex-col md:flex-row min-h-[80vh] border-8 border-red-700 relative">
                {/* Top Decoration (Mobile) / Left Decoration */}
                <div className="absolute top-0 left-0 w-full md:w-[60px] md:h-full bg-red-700 flex md:flex-col items-center justify-center gap-4 p-2 z-20">
                    <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white shadow-[0_0_10px_#60a5fa] animate-pulse"></div>
                    <div className="w-3 h-3 rounded-full bg-red-900"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>

                {/* Left Col: Visuals (Sticky on Desktop) */}
                <div className="md:w-1/2 p-8 md:pl-24 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700">
                    <div
                        className="aspect-square bg-white dark:bg-black rounded-xl border-4 border-neutral-300 dark:border-neutral-600 flex items-center justify-center relative overflow-hidden cursor-pointer group"
                        onClick={handleImageClick}
                    >
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-10 pointer-events-none">
                            {[...Array(36)].map((_, i) => (
                                <div key={i} className="border border-green-500/20"></div>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentIdx}
                                src={POKEMON_IMAGES[currentIdx].src}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{ duration: 0.4 }}
                                className="w-[80%] h-[80%] object-contain rendering-pixelated z-10"
                            />
                        </AnimatePresence>

                        {/* Hint for click */}
                        <div className="absolute bottom-2 inset-x-0 flex justify-between px-2 opacity-0 group-hover:opacity-50 transition-opacity text-[10px] uppercase font-bold text-neutral-500 z-20 pointer-events-none">
                            <span>← Back</span>
                            <span>Forward →</span>
                        </div>

                        {/* Pagination indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                            {POKEMON_IMAGES.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIdx ? "bg-red-500" : "bg-neutral-300"}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                            <span className="text-xs font-bold text-blue-500 uppercase">
                                Height
                            </span>
                            <p className="text-2xl font-mono text-neutral-800 dark:text-neutral-200">
                                6.5m
                            </p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                            <span className="text-xs font-bold text-blue-500 uppercase">
                                Weight
                            </span>
                            <p className="text-2xl font-mono text-neutral-800 dark:text-neutral-200">
                                235kg
                            </p>
                        </div>
                    </div>

                    <div className="bg-neutral-800 text-green-400 font-mono p-4 rounded-lg text-sm">
                        &gt; READING_TIME: 5 MINS
                        <br />
                        &gt; TYPE: WATER / FLYING
                        <br />
                        &gt; STATUS: ONLINE
                    </div>
                </div>

                {/* Right Col: Content */}
                <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto">
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2">
                            #130 The Atrocious
                        </h1>
                        <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8">
                            Data Entry: 2026-01-06
                        </span>

                        <div className="prose prose-neutral dark:prose-invert">
                            <p>
                                Rarely seen in the wild, huge and vicious, it is capable of
                                destroying entire cities in a rage. In the coding world, this
                                represents technical debt left unchecked.
                            </p>
                            <p>
                                However, when tamed, it becomes a powerful ally. Refactoring
                                large codebases requires the same patience as training a
                                Magikarp. It seems useless at first—small commits, minor
                                tweaks—but eventually, it evolves into something majestic.
                            </p>
                            <h3>Research Notes</h3>
                            <p>
                                Recent studies show that automated testing reduces the "Rage"
                                status effect by 45%. Implementing CI/CD pipelines ensures that
                                the beast remains calm during deployment.
                            </p>
                        </div>

                        <div className="mt-8 border-l-4 border-red-500 pl-4">
                            <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
                                Field Footage
                            </h4>
                            <div className="aspect-video bg-black rounded overflow-hidden">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="w-full h-full"
                                ></iframe>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Pool;
