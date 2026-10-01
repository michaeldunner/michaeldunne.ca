// This is a fork of pokemon cards that integrates with spotify
// the songs are in this format {"title":"All Too Well (10 Minute Version) (Taylor's Version) (From The Vault)","artist":"Taylor Swift","album":"Red (Taylor's Version)","albumImageUrl":"https://i.scdn.co/image/ab67616d0000b273318443aab3531a0558e79a4d","url":"https://open.spotify.com/track/5enxwA8aAbwZbf5qCHORXi","isPlaying":true}
// if nothing is playing it is in the format {"isPlaying":false}

import { PokemonCard } from "./pokemon-card";
import { SpotifyResponse } from "../../assets/types";
import { useQuery } from "@tanstack/react-query";
import spotify from "../../assets/spotify.png";
import { useEffect, useState } from "react";
import { FastAverageColor } from "fast-average-color";

const fac = new FastAverageColor();

/** Convert a hex color to HSL, clamp lightness to [minL, 100], return hex. */
function clampHexLightness(hex: string, minL = 35): string {
  // Parse r/g/b from #rrggbb
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  let l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Clamp lightness
  l = Math.max(minL / 100, l);

  // HSL → RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r2 = 0, g2 = 0, b2 = 0;
  if (h < 60)        { r2 = c; g2 = x; b2 = 0; }
  else if (h < 120)  { r2 = x; g2 = c; b2 = 0; }
  else if (h < 180)  { r2 = 0; g2 = c; b2 = x; }
  else if (h < 240)  { r2 = 0; g2 = x; b2 = c; }
  else if (h < 300)  { r2 = x; g2 = 0; b2 = c; }
  else               { r2 = c; g2 = 0; b2 = x; }

  const toHex = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, "0");

  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}

export function NowPlayingCard() {
  const { data, isPending } = useQuery<SpotifyResponse>({
    queryKey: ["spotify-now-playing"],
    queryFn: async () => {
      const response = await fetch(
        "https://spotify-now-playing.mdunne697.workers.dev/",
      );
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const isPlaying = data?.isPlaying;
  const image = isPlaying ? data.albumImageUrl : spotify;
  const name = isPlaying ? "Current Song" : "Spotify";
  const title = isPlaying ? data.title : "Not Listening To Anything";
  const text = isPlaying ? data.artist : "Click here to check out my Spotify";
  const link =
    "https://open.spotify.com/user/4oae5ks5mrf3u77vqj563xeun?si=5c453783fce74089";

  // Default green-400 roughly (#10B981)
  const [bgColor, setBgColor] = useState<string | undefined>(undefined);

  // Determine the background color: dynamic if playing, default hex if not
  const finalBackgroundColor =
    isPlaying && bgColor ? clampHexLightness(bgColor, 35) : "#1ed760";

  useEffect(() => {
    const url =
      data && "albumImageUrl" in data ? data.albumImageUrl : undefined;
    if (isPlaying && url) {
      fac
        .getColorAsync(url)
        .then((color) => {
          setBgColor(color.hex);
        })
        .catch((e) => {
          console.error(e);
          setBgColor(undefined);
        });
    } else {
      setBgColor(undefined);
    }
  }, [isPlaying, data]);

  return (
    <PokemonCard
      isLoading={isPending}
      name={name}
      imageURL={image}
      backgroundColor={finalBackgroundColor}
      title={title}
      text={text}
      to={link}
    />
  );
}
