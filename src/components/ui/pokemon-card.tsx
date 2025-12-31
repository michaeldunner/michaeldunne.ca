import { Link } from "react-router-dom";
import { GlareCard } from "../ui/glare-card";

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
  return (
    <Link
      to={to || "#"}
      className="cursor-pointer focus:outline-none hover:opacity-90 transition-opacity block"
    >
      <div
        className={`flex w-[315px] h-[440px] rounded-2xl border-16 border-yellow-400 ${colour ?? ""} p-4 justify-center`}
      >
        <div className="flex flex-col mt-4 gap-4">
          <GlareCard className="flex flex-col items-center justify-center">
            <img
              className="h-full w-full absolute inset-0 object-cover"
              src={imageURL}
            />
          </GlareCard>
          <p className="text-black dark:text-black text-xl">{text}</p>
        </div>
      </div>
    </Link>
  );
}
