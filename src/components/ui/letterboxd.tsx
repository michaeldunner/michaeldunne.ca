import { PokemonCard } from "./pokemon-card";
import { LetterboxdResponse } from "../../assets/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FastAverageColor } from "fast-average-color";
import charizard from "../../assets/charizard.jpg";

const fac = new FastAverageColor();

export function LetterboxdCard() {
  const { data } = useQuery<LetterboxdResponse>({
    queryKey: ["letterboxd"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.rss2json.com/v1/api.json?rss_url=https://letterboxd.com/michaeldunner/rss/",
      );
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    refetchInterval: 300000, // 5 minutes
    staleTime: 300000,
  });

  const latestItem = data?.items?.[0];
  const hasItem = !!latestItem;
  const link = latestItem?.link || "https://letterboxd.com/michaeldunner/";

  // Parse Title and Rating
  // RSS Title formats:
  // "Movie (Year) ★★★½" (Watched/Reviewed)
  // "Movie (Year)" (Watched, no rating)
  const rawTitle = latestItem?.title || "";
  let movieTitle = rawTitle;
  let rating = "";

  // Extract Rating (looking for stars at the end)
  const ratingMatch = rawTitle.match(/(★|½)+$/);
  if (ratingMatch) {
    rating = ratingMatch[0];
    movieTitle = rawTitle.replace(rating, "").trim();
    // Remove trailing comma or hyphen if present after removing rating
    // RSS2JSON title often comes as "Title, Year - Rating"
    movieTitle = movieTitle.replace(/[, -]+$/, "").trim();
  }

  // Extract Image
  // RSS2JSON tries to put it in thumbnail, otherwise regex the description
  let imageURL = latestItem?.thumbnail;
  if (!imageURL && latestItem?.description) {
    const imgMatch = latestItem.description.match(/src="([^"]+)"/);
    if (imgMatch) {
      imageURL = imgMatch[1];
    }
  }
  // Fallback if no image found
  const finalImage = hasItem && imageURL ? imageURL : charizard;

  // Default green-400 roughly (#10B981)
  const [bgColor, setBgColor] = useState<string | undefined>(undefined);

  // Determine the background color: dynamic if loaded, default hex if not
  const finalBackgroundColor = hasItem && bgColor ? bgColor : "#10B981";

  useEffect(() => {
    if (hasItem && imageURL) {
      fac
        .getColorAsync(imageURL)
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
      imageURL={finalImage}
      backgroundColor={finalBackgroundColor}
      name={"Recent Film"}
      title={hasItem ? movieTitle : "Letterboxd"}
      text={hasItem ? rating : "No recent activity"}
      to={link}
    />
  );
}
