
// This is a fork of pokemon cards that integrates with spotify
// the songs are in this format {"title":"All Too Well (10 Minute Version) (Taylor's Version) (From The Vault)","artist":"Taylor Swift","album":"Red (Taylor's Version)","albumImageUrl":"https://i.scdn.co/image/ab67616d0000b273318443aab3531a0558e79a4d","url":"https://open.spotify.com/track/5enxwA8aAbwZbf5qCHORXi","isPlaying":true}
// if nothing is playing it is in the format {"isPlaying":false}

import { PokemonCard } from "./pokemon-card";
import { SpotifyResponse } from "../../assets/types";
import { useQuery } from "@tanstack/react-query";
import charizard from "../../assets/charizard.jpg";

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
    const image = isPlaying ? data.albumImageUrl : charizard;
    const text = isPlaying ? `${data.title} - ${data.artist}` : "Not Playing";
    const link = "https://open.spotify.com/user/4oae5ks5mrf3u77vqj563xeun?si=5c453783fce74089";

    return (
        <PokemonCard
            imageURL={image}
            colour="bg-green-500"
            text={text}
            to={link}
        />
    );
}