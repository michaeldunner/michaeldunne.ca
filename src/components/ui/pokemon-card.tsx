import { Link } from "react-router-dom";
import { GlareCard } from "../ui/glare-card";
import { TiltCard } from "./tilt-card";
import { Skeleton } from "./skeleton";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";

type PokemonCardProps = {
  imageURL?: string;
  name?: string;
  title?: string;
  text?: React.ReactNode;
  colour?: string; // Tailwind class
  backgroundColor?: string; // Hex code or other CSS color value
  isLoading?: boolean;
};

export function PokemonCard({
  imageURL,
  name,
  title,
  text,
  colour,
  backgroundColor,
  isLoading,
  to,
}: PokemonCardProps & { to?: string }) {
  const glareRef = useRef<import("../ui/glare-card").GlareCardApi>(null);
  const glareContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isImageReady, setIsImageReady] = useState(false);

  const handlePointerMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (glareRef.current && glareContainerRef.current) {
      const rect = glareContainerRef.current.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const percentage = {
        x: (100 / rect.width) * position.x,
        y: (100 / rect.height) * position.y,
      };

      glareRef.current.updateGlare(percentage.x, percentage.y, true);
    }
  };

  const handlePointerLeave = () => {
    if (glareRef.current) {
      glareRef.current.updateGlare(50, 50, false);
    }
  };

  // Handle image loading with decode() for cached images
  useEffect(() => {
    if (!imgRef.current || !imageURL) {
      setIsImageReady(true); // No image to load
      return;
    }

    setIsImageReady(false);
    let timeoutId: number;

    const img = imgRef.current;

    // Function to mark image as ready
    const markReady = () => {
      setIsImageReady(true);
      clearTimeout(timeoutId);
    };

    // Timeout fallback (10 seconds)
    timeoutId = setTimeout(() => {
      console.warn("Image decode timeout, showing anyway");
      setIsImageReady(true);
    }, 10000);

    // Use decode() to ensure image is fully decoded before showing
    if (img.complete) {
      // Image is cached - decode it
      img
        .decode()
        .then(markReady)
        .catch((error) => {
          console.error("Image decode error:", error);
          markReady(); // Show anyway on error
        });
    } else {
      // Image not cached - wait for load then decode
      const handleLoad = () => {
        img
          .decode()
          .then(markReady)
          .catch((error) => {
            console.error("Image decode error:", error);
            markReady(); // Show anyway on error
          });
      };

      const handleError = () => {
        console.error("Image load error");
        markReady(); // Show anyway on error
      };

      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleError);

      return () => {
        img.removeEventListener("load", handleLoad);
        img.removeEventListener("error", handleError);
        clearTimeout(timeoutId);
      };
    }

    return () => clearTimeout(timeoutId);
  }, [imageURL]);

  return (
    <Link
      to={to || "#"}
      className="cursor-pointer focus:outline-none hover:opacity-90 transition-opacity block"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <TiltCard>
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0px rgba(234, 179, 8, 0)",
              "0 0 25px rgba(234, 179, 8, 0.4)",
              "0 0 0px rgba(234, 179, 8, 0)",
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          }}
          className={`relative flex w-[315px] h-[440px] rounded-2xl border-16 border-yellow-400 ${colour ?? ""} p-4 justify-center`}
          style={{ backgroundColor: backgroundColor }}
        >
          {!isImageReady || isLoading ? (
            <Skeleton className="absolute top-2 left-5 h-7 w-32" />
          ) : (
            <span className="absolute top-2 left-5 font-bold text-xl text-black dark:text-black">
              {name}
            </span>
          )}
          <div className="flex flex-col mt-6 gap-4">
            <div ref={glareContainerRef} className="block w-fit mx-auto">
              <GlareCard
                ref={glareRef}
                className="flex flex-col items-center justify-center relative"
              >
                {/* Stable background to prevent black flash */}
                <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800" />

                {/* Image - always mounted */}
                <img
                  ref={imgRef}
                  className="h-full w-full absolute inset-0 object-cover transition-opacity duration-300"
                  style={{ opacity: (!isImageReady || isLoading) ? 0 : 1 }}
                  src={imageURL}
                  alt={title || name || ""}
                />

                {/* Loader overlay - hidden when image ready */}
                {(!isImageReady || isLoading) && (
                  <div className="absolute inset-0 z-10">
                    <Skeleton className="w-full h-full rounded-none" />
                  </div>
                )}
              </GlareCard>
            </div>
            <div className="flex flex-col items-center gap-2">
              {(!isImageReady || isLoading) ? (
                <>
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  {title && (
                    <span className="font-bold text-center text-xl text-black dark:text-black">
                      {title}
                    </span>
                  )}
                  {text && (
                    <span className="text-sm text-center opacity-90 text-black dark:text-black">
                      {text}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </TiltCard>
    </Link>
  );
}
