import { EncryptedText } from "./encrypted-text";
import { NowPlayingCard } from "./now-playing";
import { PokemonCard } from "./pokemon-card";
import charizard from "../../assets/charizard.jpg";
import { LetterboxdCard } from "../letterboxd";

function Home() {
  return (
    <div className="flex flex-1">
      <div className="relative flex h-screen w-full flex-col items-center justify-center rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="absolute top-10 z-20 flex justify-center">
          <EncryptedText
            text="Michael Dunne"
            encryptedClassName="text-yellow-500"
            revealedClassName="text-yellow-500"
            style={{
              fontFamily: "Pokemon",
              fontSize: "48px",
              WebkitTextStroke: "3px #296aa2",
            }}
          />
        </div>

        {/* Cards container: centered vertically and horizontally */}
        <div className="flex flex-col md:flex-row gap-10 items-center justify-center w-full z-10">
          <div className="flex items-center justify-center">
            <PokemonCard
              imageURL={charizard}
              colour="bg-red-500"
              name="Name"
              title="Sample Card"
              text="This is a description"
              to="1"
            />
          </div>
          <div className="flex items-center justify-center">
            <LetterboxdCard />
          </div>
          <div className="flex items-center justify-center">
            <NowPlayingCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
