"use client";
import { Article } from "./article";
import gyarados from "../../assets/gyarados_pixel_art.png";
import charizard from "../../assets/charizard_pixel_art.png";
import blastoise from "../../assets/blastoise_pixel_art.png";
import venusaur from "../../assets/venusaur_pixel_art.png";

const POKEMON_IMAGES = [
    { src: gyarados, name: "Gyarados" },
    { src: charizard, name: "Charizard" },
    { src: blastoise, name: "Blastoise" },
    { src: venusaur, name: "Venusaur" },
];

export default function Pool() {
    return (
        <Article
            images={POKEMON_IMAGES}
            title="#130 The Atrocious"
            subtitle="Gyarados"
            date="2026-01-06"
            statusLines={[
                "READING_TIME: 5 MINS",
                "TYPE: WATER / FLYING",
                "STATUS: ONLINE"
            ]}
            description={
                <>
                    <p>
                        Rarely seen in the wild, huge and vicious, it is capable of
                        destroying entire cities in a rage. In the coding world, this
                        represents technical debt left unchecked.
                    </p>
                    <p>
                        However, when tamed, it becomes a powerful ally. Refactoring
                        large codebases requires the same patience as training a
                        Magikarp. It seems useless at first—small commits, minor
                        tweaks—but eventually, it evolves into something majestic.
                    </p>
                    <h3>Research Notes</h3>
                    <p>
                        Recent studies show that automated testing reduces the "Rage"
                        status effect by 45%. Implementing CI/CD pipelines ensures that
                        the beast remains calm during deployment.
                    </p>
                </>
            }
            videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
        />
    );
}
