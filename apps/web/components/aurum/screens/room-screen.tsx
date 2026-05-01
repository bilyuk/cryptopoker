import { ArrowRight, Copy, Share2 } from "lucide-react";
import { AurumButton } from "../button";
import { Header } from "../header";
import { Panel } from "../panel";
import { SpecRow } from "../spec-row";
import type { Room } from "../types";

type RoomScreenProps = {
  playerId?: string;
  playerName: string;
  room: Room;
  onBackToLobby: () => void;
  onDeal: () => void;
  onApproveBuyIn: (buyInId: string) => void;
  onClaimSeat: (seatNumber: number) => void;
  onLeaveSeat: () => void;
  onInvitePreview: () => void;
  onCopyInvite: () => void;
  onRequestBuyIn: () => void;
  onJoinWaitlist: () => void;
  onLeaveWaitlist: () => void;
  onAcceptSeatOffer: (seatOfferId: string) => void;
  onDeclineSeatOffer: (seatOfferId: string) => void;
  onShareInvite: () => void;
  inviteActionMessage?: string;
  onSignOut: () => void;
};

export function RoomScreen({
  playerId,
  playerName,
  room,
  onBackToLobby,
  onDeal,
  onApproveBuyIn,
  onClaimSeat,
  onLeaveSeat,
  onInvitePreview,
  onCopyInvite,
  onRequestBuyIn,
  onJoinWaitlist,
  onLeaveWaitlist,
  onAcceptSeatOffer,
  onDeclineSeatOffer,
  onShareInvite,
  inviteActionMessage,
  onSignOut,
}: RoomScreenProps) {
  const isHost = playerId === room.hostPlayerId;
  const currentPlayer = room.players.find((player) => player.playerId === playerId);
  const firstOpenSeat = room.openSeatNumbers[0];
  const canClaimSeat = Boolean(
    currentPlayer &&
      currentPlayer.buyInStatus === "host-verified" &&
      !currentPlayer.seated &&
      firstOpenSeat &&
      !room.currentPlayerWaitlistPosition &&
      !room.currentPlayerSeatOffer,
  );
  const canJoinWaitlist = Boolean(
    currentPlayer &&
      currentPlayer.buyInStatus === "host-verified" &&
      !currentPlayer.seated &&
      room.full &&
      !room.currentPlayerWaitlistPosition &&
      !room.currentPlayerSeatOffer,
  );
  const canRequestBuyIn = Boolean(currentPlayer && currentPlayer.buyInStatus !== "pending" && currentPlayer.buyInStatus !== "host-verified");
  const canDeal = isHost && room.occupiedSeats >= 2;

  return (
    <main className="relative min-h-screen p-3 pb-28 md:p-6">
      <Header mode="Waiting room" playerName={playerName} onInvitePreview={onInvitePreview} onSignOut={onSignOut} />
      <section className="mx-auto mt-4 w-full max-w-[1052px] md:mt-20">
        <p className="aurum-eyebrow text-champagne-500">Table set</p>
        <h1 className="mt-3 font-display text-[clamp(42px,5vw,58px)] leading-none text-ivory-50">{room.name}.</h1>
        <p className="mt-3 text-sm text-sapphire-200">Host verifies Buy-Ins before Players claim Seats.</p>

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

            <Panel className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="aurum-eyebrow">Buy-in</p>
                <span className="font-mono text-xs text-gold-400">{room.buyIn}</span>
              </div>
              <p className="mt-3 text-xs text-sapphire-300">Request a Buy-In, wait for Host verification, then claim an open Seat.</p>
              {room.currentPlayerSeatOffer && (
                <div className="mt-4 rounded-md border border-gold-400/45 bg-gold-400/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">Seat Offer</p>
                  <p className="mt-2 text-sm text-ivory-100">Seat {room.currentPlayerSeatOffer.seatNumber} is open for you.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <AurumButton className="min-h-10 px-3" onClick={() => onAcceptSeatOffer(room.currentPlayerSeatOffer!.id)}>
                      Accept Seat
                    </AurumButton>
                    <AurumButton className="min-h-10 px-3" variant="ghost" onClick={() => onDeclineSeatOffer(room.currentPlayerSeatOffer!.id)}>
                      Decline
                    </AurumButton>
                  </div>
                </div>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <AurumButton className="min-h-10 px-3" disabled={!canRequestBuyIn} onClick={onRequestBuyIn}>
                  Request ${room.buyInMinValue}
                </AurumButton>
                <AurumButton className="min-h-10 px-3" disabled={!canClaimSeat} onClick={() => firstOpenSeat && onClaimSeat(firstOpenSeat)} variant="ghost">
                  Claim Seat {firstOpenSeat ?? ""}
                </AurumButton>
                <AurumButton className="min-h-10 px-3" disabled={!currentPlayer?.seated} onClick={onLeaveSeat} variant="ghost">
                  Leave Seat
                </AurumButton>
                <AurumButton className="min-h-10 px-3" disabled={!canJoinWaitlist} onClick={onJoinWaitlist} variant="ghost">
                  Join Waitlist
                </AurumButton>
              </div>
              {currentPlayer && (
                <p className="mt-3 text-xs text-sapphire-300">
                  Your status: <span className="font-semibold text-ivory-100">{formatBuyInStatus(currentPlayer.buyInStatus)}</span>
                  {currentPlayer.seated ? " - seated" : ""}
                  {room.currentPlayerWaitlistPosition ? ` - Waitlist #${room.currentPlayerWaitlistPosition}` : ""}
                </p>
              )}
              {room.currentPlayerWaitlistPosition && (
                <AurumButton className="mt-3 min-h-10 px-3" onClick={onLeaveWaitlist} variant="ghost">
                  Leave Waitlist
                </AurumButton>
              )}
            </Panel>
          </div>

          <div className="grid gap-4">
            <Panel className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <p className="aurum-eyebrow">Players in room</p>
                <span className="font-mono text-xs text-gold-400">{room.players.length}</span>
              </div>
              <div className="mt-4 grid gap-2">
                {room.players.map((player) => (
                  <div className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-champagne-500/20 bg-sapphire-950/60 p-3 text-xs" key={player.playerId}>
                    <div>
                      <p className="font-medium text-ivory-100">
                        {player.displayName}
                        {player.role === "host" ? " · host" : ""}
                      </p>
                      <p className="aurum-action-detail mt-1">
                        {player.seated ? `Seated${player.stack ? ` - ${player.stack}` : ""}` : formatBuyInStatus(player.buyInStatus)}
                      </p>
                    </div>
                    {isHost && player.buyInStatus === "pending" && player.buyInId && (
                      <AurumButton className="min-h-9 px-3 text-xs" onClick={() => onApproveBuyIn(player.buyInId!)}>
                        Approve
                      </AurumButton>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <p className="aurum-eyebrow">At the table</p>
                <span className="font-mono text-xs text-gold-400">
                  {room.occupiedSeats} / {room.seatCount}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {room.seatLabels.map((seat) => (
                  <div className="rounded-md border border-champagne-500/20 bg-sapphire-950/60 p-3 text-xs text-sapphire-200" key={seat.label}>
                    <span className="font-medium text-ivory-100">{seat.label}</span>
                    {seat.stack && <p className="aurum-action-detail mt-1">{seat.stack}</p>}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <div className="fixed inset-x-3 bottom-4 z-20 grid gap-3 sm:static sm:mt-7 sm:grid-cols-[1fr_auto]">
          <p className="hidden items-center gap-2 text-xs text-ivory-100 sm:flex">
            <span className="size-1.5 rounded-full bg-verified-400" />
            Need at least 2 players. {room.occupiedSeats} seated. {room.occupiedSeats >= 2 ? "Host can deal." : "Waiting for more Players."}
          </p>
          <div className="grid grid-cols-[0.9fr_1.5fr] gap-3">
            <AurumButton variant="ghost" onClick={onBackToLobby}>
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

function formatBuyInStatus(status: "none" | "pending" | "host-verified" | "rejected"): string {
  if (status === "host-verified") return "Buy-In verified";
  if (status === "pending") return "Buy-In pending";
  if (status === "rejected") return "Buy-In rejected";
  return "Needs Buy-In";
}
