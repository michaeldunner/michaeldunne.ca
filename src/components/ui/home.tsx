import { useState } from "react";
import { EncryptedText } from "./encrypted-text";
import { PokemonCard } from "./pokemon-card";
import charizard from "../../assets/charizard.jpg";

function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex justify-center">
          <EncryptedText
            text="Michael Dunne"
            encryptedClassName="text-blue-400"
            revealedClassName="text-yellow-500"
            style={{
              fontFamily: "Pokemon",
              fontSize: "48px",
              WebkitTextStroke: "3px blue",
            }}
          />
        </div>
        <div className="flex items-center h-screen">
          <PokemonCard imageURL={charizard}/>
        </div>
      </div>
    </div>
  );
}

export default Home;
