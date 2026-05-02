"use client";

import { AurumButton } from "../button";
import { Header } from "../header";
import { Panel } from "../panel";
import type { Room } from "../types";

type WaitlistFoyerProps = {
  playerName: string;
  room: Room;
  position: number;
  onLeaveWaitlist: () => void;
  onAcceptSeatOffer: (seatOfferId: string) => void;
  onDeclineSeatOffer: (seatOfferId: string) => void;
  onBackToLobby: () => void;
  onInvitePreview: () => void;
  onSignOut: () => void;
};

export function WaitlistFoyer({
  playerName,
  room,
  position,
  onLeaveWaitlist,
  onAcceptSeatOffer,
  onDeclineSeatOffer,
  onBackToLobby,
  onInvitePreview,
  onSignOut,
}: WaitlistFoyerProps) {
  const seatOffer = room.currentPlayerSeatOffer;
  const ordinal = formatOrdinal(position);

  return (
    <main className="relative min-h-screen p-3 pb-28 md:p-6">
      <Header mode="Waiting room" playerName={playerName} onInvitePreview={onInvitePreview} onSignOut={onSignOut} />
      <section className="mx-auto mt-4 w-full max-w-[600px] md:mt-20">
        <p className="aurum-eyebrow text-champagne-500">Waitlist</p>
        <h1 className="mt-3 font-display text-[clamp(42px,5vw,58px)] leading-none text-ivory-50">{room.name}.</h1>

        {seatOffer ? (
          <Panel className="mt-7 p-5 md:p-6" role="status" aria-live="polite">
            <p className="aurum-eyebrow text-champagne-500">Seat offer</p>
            <p className="mt-3 font-display text-3xl text-ivory-50">
              Seat {seatOffer.seatNumber} is open for you.
            </p>
            <p className="mt-3 text-sm text-sapphire-200">
              Accept now, or it goes to the next person on the waitlist.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <AurumButton onClick={() => onAcceptSeatOffer(seatOffer.id)}>
                Accept Seat {seatOffer.seatNumber}
              </AurumButton>
              <AurumButton variant="ghost" onClick={() => onDeclineSeatOffer(seatOffer.id)}>
                Decline
              </AurumButton>
            </div>
          </Panel>
        ) : (
          <Panel className="mt-7 p-5 md:p-6">
            <p className="font-display text-3xl text-ivory-50">You're {ordinal} on the waitlist.</p>
            <p className="mt-3 text-sm text-sapphire-200">
              Escrow funded. We'll seat you the moment a Seat opens.
            </p>
            <div className="mt-5">
              <AurumButton variant="ghost" onClick={onLeaveWaitlist}>
                Leave Waitlist
              </AurumButton>
            </div>
          </Panel>
        )}

        <div className="mt-7 flex justify-end">
          <AurumButton variant="ghost" onClick={onBackToLobby}>
            Leave Room
          </AurumButton>
        </div>
      </section>
    </main>
  );
}

function formatOrdinal(n: number): string {
  if (n === 1) return "#1";
  return `#${n}`;
}
