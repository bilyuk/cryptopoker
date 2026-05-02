"use client";

import { ArrowRight, Copy, Share2 } from "lucide-react";
import { AurumButton } from "../button";
import { Header } from "../header";
import { Panel } from "../panel";
import { SpecRow } from "../spec-row";
import type { Room } from "../types";

type TableViewProps = {
  playerName: string;
  room: Room;
  isHost: boolean;
  isSeated: boolean;
  onApproveBuyIn: (buyInId: string) => void;
  onRejectBuyIn: (buyInId: string) => void;
  onLeaveSeat: () => void;
  onLeaveRoom: () => void;
  onDeal: () => void;
  onCopyInvite: () => void;
  onShareInvite: () => void;
  onInvitePreview: () => void;
  onSignOut: () => void;
  inviteActionMessage?: string;
};

export function TableView({
  playerName,
  room,
  isHost,
  isSeated,
  onApproveBuyIn,
  onRejectBuyIn,
  onLeaveSeat,
  onLeaveRoom,
  onDeal,
  onCopyInvite,
  onShareInvite,
  onInvitePreview,
  onSignOut,
  inviteActionMessage,
}: TableViewProps) {
  const canDeal = isHost && room.occupiedSeats >= 2;
  const pendingCount = room.pendingBuyIns.length;

  return (
    <main className="relative min-h-screen p-3 pb-28 md:p-6">
      <Header mode="Waiting room" playerName={playerName} onInvitePreview={onInvitePreview} onSignOut={onSignOut} />
      <section className="mx-auto mt-4 w-full max-w-[1052px] md:mt-20">
        <p className="aurum-eyebrow text-champagne-500">Table set</p>
        <h1 className="mt-3 font-display text-[clamp(42px,5vw,58px)] leading-none text-ivory-50">{room.name}.</h1>

        {isHost && (
          <Panel className="mt-7 p-5 md:p-6" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <p className="aurum-eyebrow">
                Pending verifications {pendingCount > 0 ? `(${pendingCount})` : ""}
              </p>
            </div>
            {pendingCount === 0 ? (
              <p className="mt-3 text-xs text-sapphire-300">No buy-ins waiting.</p>
            ) : (
              <div className="mt-4 grid gap-2">
                {room.pendingBuyIns.map((buyIn) => (
                  <div
                    key={buyIn.id}
                    className="grid gap-2 rounded-md border border-champagne-500/30 bg-sapphire-950/60 p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-ivory-100">{buyIn.displayName}</p>
                      <p className="aurum-mono-value mt-1">{buyIn.amount}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                      <AurumButton className="min-h-10 px-3 text-xs" onClick={() => onApproveBuyIn(buyIn.id)}>
                        Approve
                      </AurumButton>
                      <AurumButton
                        className="min-h-10 px-3 text-xs"
                        variant="ghost"
                        onClick={() => onRejectBuyIn(buyIn.id)}
                      >
                        Reject
                      </AurumButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-4">
            <Panel className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <p className="aurum-eyebrow">The table</p>
                <span className="font-mono text-xs text-gold-400">
                  {room.occupiedSeats} / {room.seatCount}
                </span>
              </div>
              <ul className="mt-4 grid gap-2">
                {room.seatRoster.map((seat) => (
                  <li
                    key={seat.seatNumber}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-champagne-500/20 bg-sapphire-950/60 px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-sapphire-400">{seat.seatNumber}</span>
                    {seat.displayName ? (
                      <span className="text-ivory-100">
                        {seat.displayName}
                        {seat.isHost && <span className="ml-2 aurum-eyebrow text-champagne-500">Host</span>}
                      </span>
                    ) : (
                      <span className="text-sapphire-300">Open</span>
                    )}
                    <span className="font-mono text-xs text-gold-400">{seat.stack ?? ""}</span>
                  </li>
                ))}
              </ul>
              {isSeated && (
                <div className="mt-4">
                  <AurumButton className="min-h-10 px-3 text-xs" variant="ghost" onClick={onLeaveSeat}>
                    Leave Seat
                  </AurumButton>
                </div>
              )}
            </Panel>

            {room.waitlistRoster.length > 0 && (
              <Panel className="p-5 md:p-6">
                <p className="aurum-eyebrow">Waitlist ({room.waitlistRoster.length})</p>
                <ul className="mt-4 grid gap-2">
                  {room.waitlistRoster.map((entry) => (
                    <li
                      key={entry.playerId}
                      className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-md border border-champagne-500/20 bg-sapphire-950/60 px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs text-sapphire-400">#{entry.position}</span>
                      <span className="text-ivory-100">{entry.displayName}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          <div className="grid gap-4">
            <Panel className="p-5 md:p-6">
              <p className="aurum-eyebrow">Room settings</p>
              <SpecRow
                className="mt-4"
                items={[
                  { label: "Variant", value: room.variant },
                  { label: "Blinds", value: room.blinds, gold: true },
                  { label: "Buy-in", value: room.buyIn },
                  { label: "Timer", value: room.timer },
                  { label: "Seats", value: room.seats },
                ]}
              />
            </Panel>

            <Panel className="p-5 md:p-6">
              <p className="aurum-eyebrow text-champagne-500">Invite link</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto] md:grid-cols-1 lg:grid-cols-[1fr_auto_auto]">
                <p className="overflow-hidden rounded-lg bg-sapphire-950/70 px-3 py-3 font-mono text-xs text-gold-400">
                  cryptopoker.game/r/{room.inviteCode ?? room.id}
                </p>
                <AurumButton className="min-h-10 px-4" onClick={onCopyInvite}>
                  <Copy size={14} />
                  Copy
                </AurumButton>
                <AurumButton className="min-h-10 px-4" variant="ghost" onClick={onShareInvite}>
                  <Share2 size={14} />
                  Share
                </AurumButton>
              </div>
              {inviteActionMessage && <p className="mt-3 text-xs font-semibold text-gold-400">{inviteActionMessage}</p>}
              <p className="mt-3 text-xs text-sapphire-400">
                Anyone with this link can join. {room.occupiedSeats} of {room.seatCount} seats filled.
              </p>
            </Panel>
          </div>
        </div>

        <div className="fixed inset-x-3 bottom-4 z-20 grid gap-3 sm:static sm:mt-7 sm:grid-cols-[1fr_auto]">
          <p className="hidden items-center gap-2 text-xs text-ivory-100 sm:flex">
            <span className="size-1.5 rounded-full bg-verified-400" />
            {room.occupiedSeats >= 2 ? `${room.occupiedSeats} seated. Host can deal.` : "Need at least 2 players. Waiting for more."}
          </p>
          <div className="grid grid-cols-[0.9fr_1.5fr] gap-3">
            <AurumButton variant="ghost" onClick={onLeaveRoom}>
              Leave Room
            </AurumButton>
            <AurumButton disabled={!canDeal} onClick={onDeal}>
              Deal the First Hand
              <ArrowRight size={16} />
            </AurumButton>
          </div>
        </div>
      </section>
    </main>
  );
}
