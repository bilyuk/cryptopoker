import { ArrowRight, Copy, Share2 } from "lucide-react";
import { AurumButton } from "../button";
import { Header } from "../header";
import { Panel } from "../panel";
import { SpecRow } from "../spec-row";
import type { Room } from "../types";

type RoomScreenProps = {
  playerName: string;
  room: Room;
  onBackToLobby: () => void;
  onDeal: () => void;
  onInvitePreview: () => void;
  onSignOut: () => void;
};

export function RoomScreen({ playerName, room, onBackToLobby, onDeal, onInvitePreview, onSignOut }: RoomScreenProps) {
  return (
    <main className="relative min-h-screen p-3 pb-28 md:p-6">
      <Header mode="Waiting room" playerName={playerName} onInvitePreview={onInvitePreview} onSignOut={onSignOut} />
      <section className="mx-auto mt-4 w-full max-w-[1052px] md:mt-20">
        <p className="aurum-eyebrow text-champagne-500">Table set</p>
        <h1 className="mt-3 font-display text-[clamp(42px,5vw,58px)] leading-none text-ivory-50">{room.name}.</h1>
        <p className="mt-3 text-sm text-sapphire-200">Hosting - waiting for the last few seats. Start when you're ready.</p>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div className="grid gap-4">
            <Panel className="p-5 md:p-6">
              <p className="aurum-eyebrow">Room settings</p>
              <SpecRow
                className="mt-4"
                items={[
                  { label: "Variant", value: "NL Hold'em" },
                  { label: "Blinds", value: room.blinds, gold: true },
                  { label: "Buy-in", value: room.buyIn },
                  { label: "Timer", value: room.timer },
                  { label: "Seats", value: room.seats },
                ]}
              />
            </Panel>

            <Panel className="p-5 md:p-6">
              <b className="aurum-eyebrow text-champagne-500">Invite link</b>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto] md:grid-cols-1 lg:grid-cols-[1fr_auto_auto]">
                <p className="overflow-hidden rounded-lg bg-sapphire-950/70 px-3 py-3 font-mono text-xs text-gold-400">
                  cryptopoker.game/r/VELVET-8F3K2
                </p>
                <AurumButton className="min-h-10 px-4" onClick={onInvitePreview}>
                  <Copy size={14} />
                  Copy
                </AurumButton>
                <AurumButton className="min-h-10 px-4" variant="ghost" onClick={onInvitePreview}>
                  <Share2 size={14} />
                  Share
                </AurumButton>
              </div>
              <p className="mt-3 text-xs text-sapphire-400">Anyone with this link can join. 3 of 6 seats filled.</p>
            </Panel>
          </div>

          <Panel className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <p className="aurum-eyebrow">At the table</p>
              <span className="font-mono text-xs text-gold-400">3 / 6</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["riverrat · host", "magpie", "kings_up", "Seat 4 - waiting...", "Seat 5 - waiting...", "Seat 6 - waiting..."].map((seat, index) => (
                <div className="rounded-md border border-champagne-500/20 bg-sapphire-950/60 p-3 text-xs text-sapphire-200" key={seat}>
                  <span className="font-medium text-ivory-100">{seat}</span>
                  {index < 3 && <p className="aurum-action-detail mt-1">$200.00</p>}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="fixed inset-x-3 bottom-4 z-20 grid gap-3 sm:static sm:mt-7 sm:grid-cols-[1fr_auto]">
          <p className="hidden items-center gap-2 text-xs text-ivory-100 sm:flex">
            <span className="size-1.5 rounded-full bg-verified-400" />
            Need at least 2 players. 3 seated. Ready when you are.
          </p>
          <div className="grid grid-cols-[0.9fr_1.5fr] gap-3">
            <AurumButton variant="ghost" onClick={onBackToLobby}>
              Leave Room
            </AurumButton>
            <AurumButton onClick={onDeal}>
              Deal the First Hand
              <ArrowRight size={16} />
            </AurumButton>
          </div>
        </div>
      </section>
    </main>
  );
}
