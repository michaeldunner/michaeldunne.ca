"use client";
import { Article } from "./article";
import gyarados from "../../assets/gyarados_pixel_art.png";
import charizard from "../../assets/charizard_pixel_art.png";
import blastoise from "../../assets/blastoise_pixel_art.png";
import venusaur from "../../assets/venusaur_pixel_art.png";
import { useEffect, useState } from "react";

const POKEMON_IMAGES = [
  { src: gyarados, name: "Gyarados" },
  { src: charizard, name: "Charizard" },
  { src: blastoise, name: "Blastoise" },
  { src: venusaur, name: "Venusaur" },
];

interface PuzzleResult {
  id: number;
  game: string;
  puzzle_number: number;
  time_seconds: number | null;
  guesses: number | null;
  created_at: string;
}

export default function LinkedInPuzzles() {
  const [results, setResults] = useState<Record<string, PuzzleResult[]>>({});

  useEffect(() => {
    fetch("https://linkedin-puzzles.mdunne697.workers.dev/results")
      .then(res => res.json())
      .then(data => {
        const grouped = data.reduce((acc: Record<string, PuzzleResult[]>, result: PuzzleResult) => {
          if (!acc[result.game]) acc[result.game] = [];
          acc[result.game].push(result);
          return acc;
        }, {});
        setResults(grouped);
      });
  }, []);

  function formatTime(seconds: number | null): string {
    if (seconds === null) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }


  return (
    <div>
    <div>
      {results.Queens?.map(result => (
        <div key={result.id}>
          Queens #{result.puzzle_number} — {formatTime(result.time_seconds)}
        </div>
      ))}
    </div>
    <div>
      {results.Tango?.map(result => (
        <div key={result.id}>
          Tango #{result.puzzle_number} — {formatTime(result.time_seconds)}
        </div>
      ))}
    </div>
    </div>
  );
}
