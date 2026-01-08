import { motion } from "motion/react";
import { useState } from "react";

const RAINBOW_COLORS = [
  "rgb(239, 68, 68)", // Red
  "rgb(249, 115, 22)", // Orange
  "rgb(234, 179, 8)", // Yellow
  "rgb(34, 197, 94)", // Green
  "rgb(59, 130, 246)", // Blue
  "rgb(99, 102, 241)", // Indigo
  "rgb(168, 85, 247)", // Purple
];

export function DJButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [currentColor, setCurrentColor] = useState(RAINBOW_COLORS[0]);

  const handlePress = () => {
    const randomColor =
      RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
    setCurrentColor(randomColor);
    setIsPressed(true);
  };

  return (
    <motion.button
      onMouseDown={handlePress}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onBlur={() => setIsPressed(false)}
      whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
      animate={{
        backgroundColor: isPressed ? currentColor : "rgb(38, 38, 38)",
        boxShadow: isPressed
          ? `0 0 25px ${currentColor}, inset 0 0 10px rgba(255,255,255,0.4)`
          : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        scale: isPressed ? 0.92 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="w-12 h-12 rounded-lg border-2 border-neutral-700/50 flex items-center justify-center relative overflow-hidden group cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    </motion.button>
  );
}
