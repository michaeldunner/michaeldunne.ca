"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DJButton } from "./dj-button";
import { DPad } from "./d-pad";
import { ImageSlideshow } from "./image-slideshow";
import { Pokedex } from "./pokedex";

interface ArticleProps {
  images: { src: string; name: string }[];
  title: string;
  subtitle: string;
  date: string;
  description: React.ReactNode;
  statusLines: string[];
  videoUrl?: string;
}

export function Article({
  images,
  title,
  subtitle,
  date,
  description,
  statusLines,
  videoUrl,
}: ArticleProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Auto-scroll logic
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;

    if (isLeft) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  return (
    <div className="h-full w-full bg-white dark:bg-neutral-950 p-4 md:p-8 overflow-y-auto">
      <Pokedex>
        {/* Left Col: Visuals (Sticky on Desktop) */}
        <div className="md:w-1/2 p-8 pt-24 bg-neutral-100 dark:bg-neutral-800 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-neutral-300 dark:border-neutral-700">
          <ImageSlideshow
            images={images}
            currentIdx={currentIdx}
            handleImageClick={handleImageClick}
          />

          {/* Controls: D-Pad and DJ Board */}
          <div className="flex items-center justify-between gap-8 mb-4">
            <DPad onNext={handleNext} onPrev={handlePrev} />

            {/* DJ Button Board */}
            <div className="grid grid-cols-3 gap-3 pr-4">
              {[...Array(6)].map((_, i) => (
                <DJButton key={i} note={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Content */}
        <div className="md:w-1/2 p-8 pt-24 md:p-12 md:pt-24 overflow-y-auto">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400 mb-2">
              {title}
            </h1>
            <h2 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              {subtitle}
            </h2>
            <span className="inline-block bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold tracking-widest text-neutral-500 uppercase mb-8">
              CHANGE THIS TO SOMETHINGData Entry: {date}
            </span>

            <div className="prose prose-neutral dark:prose-invert">
              {description}
            </div>

            {videoUrl && (
              <div className="mt-8 border-l-4 border-red-500 pl-4">
                <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
                  Field Footage
                </h4>
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={videoUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
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
