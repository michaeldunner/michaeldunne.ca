import { PokemonCard } from "./pokemon-card";
import { LetterboxdFilm } from "../../assets/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FastAverageColor } from "fast-average-color";
import charizard from "../../assets/charizard.jpg";

const fac = new FastAverageColor();

export function LetterboxdCard() {
  const { data, isPending } = useQuery<LetterboxdFilm>({
    queryKey: ["Recent Film"],
    queryFn: async () => {
      const response = await fetch(
        "https://letterboxd-worker.mdunne697.workers.dev/",
      );
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    refetchInterval: 300000, // 5 minutes
    staleTime: 300000,
  });

  const hasItem = !!data?.title;
  const link = data?.link || "https://letterboxd.com/michaeldunner/";
  const movieTitle = data?.title
    ? `${data.title}${data.year ? ` (${data.year})` : ""}`
    : "Letterboxd";
  const ratingText = data?.stars || data?.rating || "";
  const imageURL = data?.poster || undefined;

  // While the query is still in flight, pass undefined so PokemonCard shows its skeleton.
  // Only fall back to Charizard if the API responded but returned no image.
  const finalImage = isPending ? undefined : imageURL || charizard;

  // Default green-400 roughly (#10B981)
  const [bgColor, setBgColor] = useState<string | undefined>(undefined);

  // Determine the background color: dynamic if loaded, default hex if not
  const finalBackgroundColor = isPending
    ? undefined
    : hasItem && bgColor
      ? bgColor
      : "#10B981";

  useEffect(() => {
    if (hasItem && imageURL) {
      fac
        .getColorAsync(`https://wsrv.nl/?url=${encodeURIComponent(imageURL)}&w=100`)
        .then((color) => {
          setBgColor(color.hex);
        })
        .catch((e) => {
          console.error("Letterboxd Color Error:", e);
          setBgColor(undefined);
        });
    } else {
      setBgColor(undefined);
    }
  }, [hasItem, imageURL]);

  return (
    <PokemonCard
      isLoading={isPending}
      imageURL={finalImage}
      backgroundColor={finalBackgroundColor}
      name={"Recent Film"}
      title={hasItem ? movieTitle : "Letterboxd"}
      text={hasItem ? ratingText : "No recent activity"}
      to={link}
    />
  );
}
