"use client";
import { motion, AnimatePresence } from "motion/react";

interface ImageSlideshowProps {
    images: { src: string; name: string }[];
    currentIdx: number;
    handleImageClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function ImageSlideshow({ images, currentIdx, handleImageClick }: ImageSlideshowProps) {
    return (
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
                    src={images[currentIdx].src}
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
                {images.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIdx ? "bg-red-500" : "bg-neutral-300"}`}
                    />
                ))}
            </div>
        </div>
    );
}
