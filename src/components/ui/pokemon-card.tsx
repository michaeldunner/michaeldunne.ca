import { GlareCard } from "../ui/glare-card";

export function PokemonCard({ imageURL }: { imageURL?: string }) {
  return (
    <GlareCard className="flex flex-col items-center justify-center">
      <img
        className="h-full w-full absolute inset-0 object-cover"
        src={imageURL}
      />
    </GlareCard>
  );
}
