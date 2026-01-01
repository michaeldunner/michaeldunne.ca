import { Link } from "react-router-dom";
import { GlareCard } from "../ui/glare-card";
import { TiltCard } from "./tilt-card";
import { useRef } from "react";

type PokemonCardProps = {
  imageURL?: string;
  text?: string;
  colour?: string;
};

// make the card a button with glow on hover or something
export function PokemonCard({
  imageURL,
  text,
  colour,
  to,
}: PokemonCardProps & { to?: string }) {
  const glareRef = useRef<import("../ui/glare-card").GlareCardApi>(null);
  const glareContainerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (glareRef.current && glareContainerRef.current) {
      const rect = glareContainerRef.current.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const percentage = {
        x: (100 / rect.width) * position.x,
        y: (100 / rect.height) * position.y,
      };

      glareRef.current.updateGlare(percentage.x, percentage.y, true);
    }
  };

  const handlePointerLeave = () => {
    if (glareRef.current) {
      glareRef.current.updateGlare(50, 50, false);
    }
  };

  return (
    <Link
      to={to || "#"}
      className="cursor-pointer focus:outline-none hover:opacity-90 transition-opacity block"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <TiltCard>
        <div
          className={`flex w-[315px] h-[440px] rounded-2xl border-16 border-yellow-400 ${colour ?? ""} p-4 justify-center`}
        >
          <div className="flex flex-col mt-4 gap-4">
            <div ref={glareContainerRef} className="block w-fit mx-auto">
              <GlareCard
                ref={glareRef}
                className="flex flex-col items-center justify-center"
              >
                <img
                  className="h-full w-full absolute inset-0 object-cover"
                  src={imageURL}
                />
              </GlareCard>
            </div>
            <p className="text-black dark:text-black text-xl">{text}</p>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}
