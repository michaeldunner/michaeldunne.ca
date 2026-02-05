import { EncryptedText } from "./encrypted-text";
import { NowPlayingCard } from "./now-playing";
import { PokemonCard } from "./pokemon-card";
// import charizard from "../../assets/charizard.jpg";
import choreo from "../../assets/choreo.png";
import pdf from "../../assets/pdf.png";
import rref from "../../assets/rref.png";
import { LetterboxdCard } from "./letterboxd";
import { motion } from "motion/react";

function Home() {
  return (
    <div className="flex flex-1 min-h-screen">
      <div className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-y-auto rounded-tl-2xl border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
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
          className="flex z-10 w-full flex-col items-center justify-center gap-6 pb-10 md:flex-row md:flex-wrap md:pb-0 max-w-7xl mt-24 md:mt-48"
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
              imageURL={rref}
              colour="bg-purple-500"
              name="RREF Solver"
              title="Reduced Row Echelon Form"
              text="I made this because I wanted a way to easily solve systems of linear equations"
              to="/rref"
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
              imageURL={choreo}
              colour="bg-red-500"
              name="FRC Trajectory Visualizer"
              title="Visualize Multiple Choreo Trajectories"
              text="I made this because I thought it would be useful to the FRC team I mentor"
              to="/choreo"
            />
          </motion.div>
        </motion.div>
        {/* Mobile Spacer */}
        <div className="h-24 w-full shrink-0 md:hidden" />
      </div>
    </div>
  );
}

export default Home;
