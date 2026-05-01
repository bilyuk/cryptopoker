import type { Room } from "./types";
import { cn } from "@/lib/cn";

type RoomCardProps = {
  room: Room;
  onOpen?: (room: Room) => void;
};

export function RoomCard({ room, onOpen }: RoomCardProps) {
  return (
    <button
      className={cn(
        "relative min-h-[178px] overflow-hidden rounded-lg border border-champagne-500/20 bg-gradient-to-b from-sapphire-800/70 to-sapphire-900/85 p-5 text-left transition hover:-translate-y-0.5 hover:border-champagne-500/35 md:min-h-[158px] md:p-4",
        room.featured &&
          "bg-[radial-gradient(280px_160px_at_22%_8%,rgb(212_168_90_/_0.2),transparent_70%),linear-gradient(180deg,rgb(22_29_68_/_0.75),rgb(11_16_36_/_0.84))]",
        room.full && "cursor-not-allowed opacity-55 hover:translate-y-0",
      )}
      disabled={room.full}
      onClick={() => onOpen?.(room)}
    >
      <span className={cn("aurum-eyebrow text-verified-400", room.full && "text-danger-400")}>
        {room.status}
      </span>
      {room.featured && <span className="aurum-eyebrow float-right text-champagne-500">Featured</span>}
      <strong className="mt-3 block font-display text-3xl font-medium leading-none text-ivory-50 md:mt-2 md:text-2xl">{room.name}</strong>
      <small className="aurum-caption mt-1 block text-sapphire-400">{room.variant}</small>
      <i className="gilt-line my-4 block h-px opacity-60" />
      <span className="inline-grid gap-1 font-mono text-sm text-gold-400">
        <b className="aurum-eyebrow font-sans font-normal">Blinds</b>
        {room.blinds}
      </span>
      <span className="float-right inline-grid gap-1 text-right font-mono text-sm text-ivory-100">
        <b className="aurum-eyebrow font-sans font-normal">Seats</b>
        {room.seats}
      </span>
    </button>
  );
}
