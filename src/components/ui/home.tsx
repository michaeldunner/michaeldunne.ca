import { EncryptedText } from "./encrypted-text";
import { PokemonCard } from "./pokemon-card";
import charizard from "../../assets/charizard.jpg";

function Home() {
  return (
    <div className="flex flex-1">
      <div className="flex h-auto md:h-full w-full flex-1 flex-col rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex justify-center">
          <EncryptedText
            text="Michael Dunne"
            encryptedClassName="text-yellow-500"
            revealedClassName="text-yellow-500"
            style={{
              fontFamily: "Pokemon",
              fontSize: "48px",
              WebkitTextStroke: "3px blue",
            }}
          />
        </div>

        {/* everying below will be a row of cards, maybe do some funky stuff for spacing and spacing when sidebar is open */}
        <div className="flex flex-col md:flex-row gap-10 h-full md:h-auto pb-20 md:pb-0 mt-20 md:mt-0">
          {/* 1 and 2 are placeholders */}

          <div className="flex items-center justify-center min-h-[50vh] md:h-screen w-full md:w-auto">
            <PokemonCard
              imageURL={charizard}
              colour="bg-red-500"
              text="This is a sample card"
              to="1"
            />
          </div>
          <div className="flex items-center justify-center min-h-[50vh] md:h-screen w-full md:w-auto">
            <PokemonCard
              imageURL={charizard}
              colour="bg-green-500"
              text="This is a sample card"
              to="2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
