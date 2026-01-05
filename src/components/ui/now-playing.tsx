
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

export function NowPlayingCard() {
    const { data } = useQuery<SpotifyResponse>({
        queryKey: ["spotify-now-playing"],
        queryFn: async () => {
            const response = await fetch(
                "https://spotify-now-playing.mdunne697.workers.dev/.mathewdunne.ca/"
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
    const link = "https://open.spotify.com/user/4oae5ks5mrf3u77vqj563xeun?si=5c453783fce74089";


    // Default green-400 roughly (#10B981)
    const [bgColor, setBgColor] = useState<string | undefined>(undefined);

    // Determine the background color: dynamic if playing, default hex if not
    const finalBackgroundColor = isPlaying && bgColor ? bgColor : "#1ed760";

    useEffect(() => {
        const url = data && 'albumImageUrl' in data ? data.albumImageUrl : undefined;
        if (isPlaying && url) {
            fac.getColorAsync(url)
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
        name={name}
            imageURL={image}
            backgroundColor={finalBackgroundColor}
            title={title}
            text={text}
            to={link}
        />
    );
}