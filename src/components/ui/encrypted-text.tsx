"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  /**
   * Time in milliseconds between revealing each subsequent real character.
   * Lower is faster. Defaults to 50ms per character.
   */
  revealDelayMs?: number;
  /** Optional custom character set to use for the gibberish effect. */
  charset?: string;
  /**
   * Time in milliseconds between gibberish flips for unrevealed characters.
   * Lower is more jittery. Defaults to 50ms.
   */
  flipDelayMs?: number;
  /** CSS class for styling the encrypted/scrambled characters */
  encryptedClassName?: string;
  /** CSS class for styling the revealed characters */
  revealedClassName?: string;
  style?: React.CSSProperties;
  /** Whether to show a cycling shimmer effect across the text */
  shimmer?: boolean;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length);
  return charset.charAt(index);
}

function generateGibberishPreservingSpaces(
  original: string,
  charset: string,
): string {
  if (!original) return "";
  let result = "";
  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i];
    result += ch === " " ? " " : generateRandomCharacter(charset);
  }
  return result;
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
  style,
  shimmer = false,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const [revealCount, setRevealCount] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFlipTimeRef = useRef<number>(0);
  const scrambleCharsRef = useRef<string[]>(
    text ? generateGibberishPreservingSpaces(text, charset).split("") : [],
  );

  useEffect(() => {
    if (!isInView) return;

    // Reset state for a fresh animation whenever dependencies change
    const initial = text
      ? generateGibberishPreservingSpaces(text, charset)
      : "";
    scrambleCharsRef.current = initial.split("");
    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;
    setRevealCount(0);

    let isCancelled = false;

    const update = (now: number) => {
      if (isCancelled) return;

      const elapsedMs = now - startTimeRef.current;
      const totalLength = text.length;
      const currentRevealCount = Math.min(
        totalLength,
        Math.floor(elapsedMs / Math.max(1, revealDelayMs)),
      );

      setRevealCount(currentRevealCount);

      if (currentRevealCount >= totalLength) {
        return;
      }

      // Re-randomize unrevealed scramble characters on an interval
      const timeSinceLastFlip = now - lastFlipTimeRef.current;
      if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
        for (let index = 0; index < totalLength; index += 1) {
          if (index >= currentRevealCount) {
            if (text[index] !== " ") {
              scrambleCharsRef.current[index] =
                generateRandomCharacter(charset);
            } else {
              scrambleCharsRef.current[index] = " ";
            }
          }
        }
        lastFlipTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInView, text, revealDelayMs, charset, flipDelayMs]);

  if (!text) return null;

  return (
    <div className="relative inline-block">
      <motion.span
        ref={ref}
        className={cn(className)}
        aria-label={text}
        role="text"
      >
        {text.split("").map((char, index) => {
          const isRevealed = index < revealCount;
          const displayChar = isRevealed
            ? char
            : char === " "
              ? " "
              : (scrambleCharsRef.current[index] ??
                generateRandomCharacter(charset));

          return (
            <span
              key={index}
              className={cn(isRevealed ? revealedClassName : encryptedClassName)}
              style={style}
            >
              {displayChar}
            </span>
          );
        })}
      </motion.span>
      {shimmer && (
        <motion.span
          className={cn(className, "absolute inset-0 pointer-events-none select-none")}
          aria-hidden="true"
          style={{
            ...style,
            background: "linear-gradient(to right, transparent 0%, rgba(255, 217, 0, 0.8) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            WebkitTextStrokeColor: "transparent", // Hide stroke on shimmer layer to keep it clean
          }}
          animate={{
            backgroundPosition: ["100% 0", "-100% 0"],
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: "linear",
          }}
        >
          {text.split("").map((char, index) => {
            const isRevealed = index < revealCount;
            const displayChar = isRevealed
              ? char
              : char === " "
                ? " "
                : (scrambleCharsRef.current[index] ??
                  generateRandomCharacter(charset));
            return (
              <span key={index} style={style}>
                {displayChar}
              </span>
            );
          })}
        </motion.span>
      )}
    </div>
  );
};
