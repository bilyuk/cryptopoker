import { ArrowLeft, ArrowRight } from "lucide-react";
import { AurumButton } from "../button";
import { Logo } from "../logo";
import { Panel } from "../panel";
import type { Room } from "../types";

type InviteScreenProps = {
  playerName: string;
  hostName: string;
  room: Room;
  onJoin: () => void;
  onUseDifferentPlayer: () => void;
  onBack: () => void;
  error?: string;
};

export function InviteScreen({
  playerName,
  hostName,
  room,
  onJoin,
  onUseDifferentPlayer,
  onBack,
  error,
}: InviteScreenProps) {
  return (
    <main className="relative min-h-screen p-3 sm:grid sm:place-items-center sm:p-6">
      <header className="flex h-12 items-center justify-between rounded-[18px] border border-champagne-500/25 bg-sapphire-900/70 px-2 pl-2 shadow-[0_10px_24px_-10px_rgb(0_0_0_/_0.34)] backdrop-blur md:hidden">
        <Logo compact className="[&_img]:size-7 [&_span]:text-base" />
        <span className="aurum-caption rounded-full border border-champagne-500/45 bg-sapphire-800/80 px-3 py-2 text-champagne-300">
          Invite
        </span>
      </header>

      <section className="mx-3 mt-0 pt-6 sm:hidden">
        <p className="aurum-eyebrow text-champagne-500">Private invite</p>
        <h1 className="mt-2 font-display text-4xl leading-none text-ivory-50">Your seat is ready.</h1>
      </section>

      <Panel className="mx-auto mt-7 grid w-full max-w-[350px] gap-5 rounded-[14px] p-8 text-center sm:max-w-[430px]">
        <button className="absolute left-4 top-4 hidden text-sapphire-200 transition hover:text-gold-400 sm:inline-flex" onClick={onBack} aria-label="Back to lobby">
          <ArrowLeft size={18} />
        </button>
        <p className="text-xs text-sapphire-200">
          <b className="mr-2 inline-grid size-7 place-items-center rounded-full bg-champagne-500/20 font-display text-gold-400">
            {hostName.slice(0, 1).toUpperCase()}
          </b>
          <strong className="text-ivory-100">{hostName}</strong> invited you to the table
        </p>
        <span className="aurum-eyebrow text-champagne-500">Private room</span>
        <h2 className="font-display text-[32px] leading-none text-ivory-50 sm:text-5xl">{room.name}</h2>
        <div className="grid grid-cols-4 gap-1 rounded-lg border border-champagne-500/35 bg-sapphire-950/60 p-2">
          <Spec label="Variant" value="NL Hold'em" />
          <Spec label="Blinds" value={room.blinds} gold />
          <Spec label="Buy-in" value={room.buyIn} />
          <Spec label="Seats" value={room.seats} />
        </div>
        <AurumButton className="min-h-10 bg-gradient-to-r from-gold-400 to-champagne-500 text-sapphire-950" onClick={onJoin}>
          Take a Seat
          <ArrowRight size={15} />
        </AurumButton>
        {error && <p className="text-sm font-semibold text-rose-200">{error}</p>}
        <p className="text-sm text-sapphire-200">
          Joining as <strong className="text-ivory-50">{playerName}</strong> on this browser.
        </p>
        <AurumButton className="min-h-10" variant="ghost" onClick={onUseDifferentPlayer}>
          Use a Different Player
        </AurumButton>
        <small className="aurum-caption text-sapphire-200/70">This room is private. Only people with this link can join.</small>
      </Panel>
    </main>
  );
}

function Spec({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <span className="grid gap-1 truncate font-mono text-xs text-ivory-50">
      <b className="aurum-eyebrow truncate font-sans font-normal">{label}</b>
      <span className={gold ? "text-gold-400" : undefined}>{value}</span>
    </span>
  );
}
