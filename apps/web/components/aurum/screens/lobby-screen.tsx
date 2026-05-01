import { ArrowRight, Command, Plus } from "lucide-react";
import { AurumButton } from "../button";
import { Header } from "../header";
import { RoomCard } from "../room-card";
import type { Room } from "../types";

type LobbyScreenProps = {
  playerName: string;
  rooms: Room[];
  onCreateRoom: () => void;
  onInvitePreview: () => void;
  onOpenRoom: (room: Room) => void;
  onSignOut: () => void;
};

export function LobbyScreen({ playerName, rooms, onCreateRoom, onInvitePreview, onOpenRoom, onSignOut }: LobbyScreenProps) {
  return (
    <main className="relative min-h-screen p-3 md:p-6">
      <Header
        mode="Lobby"
        playerName={playerName}
        onCreateRoom={onCreateRoom}
        onInvitePreview={onInvitePreview}
        onSignOut={onSignOut}
      />
      <section className="mx-auto mt-12 w-full max-w-[1052px] md:mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="aurum-eyebrow text-champagne-500">Your table</p>
            <h2 className="mt-5 font-display text-[clamp(44px,5.8vw,70px)] leading-[0.95] text-ivory-50">
              Start a hand, <em className="text-gold-400">{playerName}</em>.
            </h2>
            <p className="mt-4 text-sm text-ivory-100">Host a private table - or slip in with an invite link.</p>
          </div>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <button
            className="gilt-panel group flex min-h-24 items-center gap-5 rounded-xl p-6 text-left transition hover:-translate-y-0.5 hover:border-champagne-500/50"
            onClick={onCreateRoom}
          >
            <span className="grid size-11 place-items-center rounded-full border border-champagne-500/35 bg-champagne-500/15 text-gold-400">
              <Plus size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block font-display text-2xl font-medium text-ivory-50">Create a Room</strong>
              <small className="mt-1 block text-sapphire-200">Host a private table. Pick blinds, timer, seats.</small>
            </span>
            <ArrowRight className="text-gold-400" size={18} />
          </button>
          <button className="flex min-h-24 items-center gap-5 rounded-xl border border-dashed border-champagne-500/30 bg-sapphire-800/35 p-6 text-left transition hover:border-champagne-500/50" onClick={onInvitePreview}>
            <span className="grid size-11 place-items-center rounded-full border border-sapphire-400/60 bg-sapphire-800/50 text-sapphire-200">
              <Command size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block font-display text-2xl font-medium text-ivory-50">Join with a Link</strong>
              <small className="mt-1 block text-sapphire-200">Paste a friend's invite. We'll seat you.</small>
            </span>
            <ArrowRight className="text-sapphire-200" size={18} />
          </button>
        </div>
        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="aurum-eyebrow text-champagne-500">Your rooms</p>
            <h3 className="mt-2 font-display text-2xl text-ivory-50 md:text-3xl">Open rooms right now.</h3>
          </div>
          <div className="hidden gap-1 md:flex">
            {["All", "Hosting", "Invited"].map((filter) => (
              <span className="aurum-caption rounded-full bg-sapphire-800/70 px-3 py-1 text-sapphire-200 first:bg-champagne-500/35 first:text-gold-400" key={filter}>
                {filter}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onOpen={onOpenRoom} />
          ))}
        </div>
      </section>
    </main>
  );
}
