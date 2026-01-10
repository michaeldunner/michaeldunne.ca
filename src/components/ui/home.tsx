import { EncryptedText } from "./encrypted-text";
import { NowPlayingCard } from "./now-playing";
import { PokemonCard } from "./pokemon-card";
import charizard from "../../assets/charizard.jpg";
import pdf from "../../assets/pdf.png";
import { LetterboxdCard } from "./letterboxd";
import { motion } from "motion/react";

function Home() {
  return (
    <div className="flex flex-1">
      <div className="relative flex h-screen w-full flex-col items-center justify-start overflow-y-auto rounded-tl-2xl border border-neutral-200 bg-white p-2 md:justify-center md:overflow-y-auto md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="relative z-20 mt-10 mb-8 flex shrink-0 justify-center md:absolute md:top-10 md:my-0">
          <EncryptedText
            text="Michael Dunne"
            encryptedClassName="text-yellow-500"
            revealedClassName="text-yellow-500"
            shimmer={true}
            style={{
              fontFamily: "Pokemon",
              fontSize: "48px",
              WebkitTextStroke: "3px #296aa2",
            }}
          />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          className="flex z-10 w-full flex-col items-center justify-center gap-6 pb-10 md:flex-row md:pb-0 max-w-6xl"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: "easeOut" },
              },
            }}
            className="flex items-center justify-center"
          >
            <NowPlayingCard />
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: "easeOut" },
              },
            }}
            className="flex items-center justify-center"
          >
            <LetterboxdCard />
          </motion.div>
          {/* <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className="flex items-center justify-center"
            >
            <PokemonCard
              imageURL={gyarados}
              colour="bg-blue-500"
              name="Gyarados"
              title="The Pool"
              text="Dive into my thoughts."
              to="/pool"
              />
          </motion.div> */}
          {/* <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className="flex items-center justify-center"
            >
            <PokemonCard
              imageURL={gyarados}
              colour="bg-blue-500"
              name="Gyarados"
              title="The Pool"
              text="Dive into my thoughts."
              to="/rref"
              />
          </motion.div> */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className="flex items-center justify-center"
          >
            <PokemonCard
              imageURL={pdf}
              colour="bg-blue-400"
              name="PDF Merger"
              title="Merge PDFs"
              text="I made this because I needed a service like this for school"
              to="/pdf"
            />
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: "easeOut" },
              },
            }}
            className="flex items-center justify-center"
          >
            <PokemonCard
              imageURL={charizard}
              colour="bg-red-500"
              name="Charizard"
              title="This is a sample card"
              text="This is a sample card"
              to="#"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
