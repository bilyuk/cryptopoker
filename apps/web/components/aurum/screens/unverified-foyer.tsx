"use client";

import { useState } from "react";
import { AurumButton } from "../button";
import { BuyInAmountPicker } from "../buy-in-amount-picker";
import { Header } from "../header";
import { Panel } from "../panel";
import type { Room, RoomPlayerSummary } from "../types";

type UnverifiedFoyerProps = {
  playerName: string;
  room: Room;
  currentPlayer: RoomPlayerSummary | undefined;
  onRequestBuyIn: (amount: number) => Promise<void> | void;
  onBackToLobby: () => void;
  onInvitePreview: () => void;
  onSignOut: () => void;
};

export function UnverifiedFoyer({
  playerName,
  room,
  currentPlayer,
  onRequestBuyIn,
  onBackToLobby,
  onInvitePreview,
  onSignOut,
}: UnverifiedFoyerProps) {
  const status = currentPlayer?.buyInStatus ?? "none";
  const defaultAmount = Math.round((room.buyInRange.min + room.buyInRange.max) / 2);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Server-driven "pending" supersedes any local optimistic submitting state.
  const showPending = status === "funding-pending";
  const showRefundPending = status === "refund-pending";
  const showRefunded = status === "refunded" && !submitting;
  const showExpired = status === "expired" && !submitting;
  const showFundingFailed = status === "funding-failed" && !submitting;
  const showEscrowFunded = status === "escrow-funded";
  const showPicker = !showPending;

  async function handleRequest() {
    if (submitting) return;
    setError(undefined);
    setSubmitting(true);
    try {
      await onRequestBuyIn(amount);
    } catch {
      setError("Couldn't reach the table. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen p-3 pb-28 md:p-6">
      <Header mode="Waiting room" playerName={playerName} onInvitePreview={onInvitePreview} onSignOut={onSignOut} />
      <section className="mx-auto mt-4 w-full max-w-[600px] md:mt-20">
        <p className="aurum-eyebrow text-champagne-500">Buy-in</p>
        <h1 className="mt-3 font-display text-[clamp(42px,5vw,58px)] leading-none text-ivory-50">{room.name}.</h1>
        <p className="mt-3 text-sm text-sapphire-200">
          Hosted by <span className="text-ivory-100">{room.hostName}</span>
          {" · "}
          {room.variant} · {room.blinds} · Range {room.buyIn}
        </p>

        <Panel className="mt-7 p-5 md:p-6">
          {showExpired && (
            <div className="mb-5 rounded-md border border-champagne-500/45 bg-champagne-500/10 p-3">
              <p className="aurum-eyebrow text-champagne-500">Funding intent expired</p>
              <p className="mt-2 text-sm text-ivory-100">
                Create a new funding intent to continue joining this Room.
              </p>
            </div>
          )}
          {showFundingFailed && (
            <div className="mb-5 rounded-md border border-danger-400/45 bg-danger-400/10 p-3">
              <p className="aurum-eyebrow text-danger-300">Funding reverted</p>
              <p className="mt-2 text-sm text-ivory-100">The chain event was reverted or failed. Submit a new funding intent.</p>
            </div>
          )}
          {showRefundPending && (
            <div className="mb-5 rounded-md border border-champagne-500/45 bg-champagne-500/10 p-3">
              <p className="aurum-eyebrow text-champagne-500">Refund pending</p>
              <p className="mt-2 text-sm text-ivory-100">Escrow is processing your refund before play starts.</p>
            </div>
          )}
          {showRefunded && (
            <div className="mb-5 rounded-md border border-champagne-500/45 bg-champagne-500/10 p-3">
              <p className="aurum-eyebrow text-champagne-500">Refund complete</p>
              <p className="mt-2 text-sm text-ivory-100">Funds were returned to your linked wallet.</p>
            </div>
          )}

          {showPending ? (
            <div className="grid gap-4" role="status" aria-live="polite">
              <div className="flex items-center gap-3">
                <span aria-hidden className="aurum-pulse-dot inline-block size-3 rounded-full" />
                <p className="aurum-eyebrow text-sapphire-400">Waiting</p>
              </div>
              <p className="font-display text-3xl text-ivory-50">
                Waiting for escrow deposit confirmation.
              </p>
              <p className="text-sm text-sapphire-200">Your Buy-In remains pending until confirmation depth is met.</p>
            </div>
          ) : showEscrowFunded ? (
            <div className="grid gap-4" role="status" aria-live="polite">
              <p className="aurum-eyebrow text-verified-400">Escrowed Buy-In confirmed</p>
              <p className="font-display text-3xl text-ivory-50">Funding confirmed on-chain.</p>
              <p className="text-sm text-sapphire-200">
                Tracer phase complete: your Room now shows escrow-funded state without auto-seating.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              <p className="aurum-eyebrow">Take a seat</p>
              <BuyInAmountPicker
                range={room.buyInRange}
                value={amount}
                onChange={setAmount}
                disabled={submitting}
              />
              <AurumButton
                className="min-h-12"
                disabled={submitting || amount < room.buyInRange.min || amount > room.buyInRange.max}
                onClick={handleRequest}
              >
                {submitting ? "Creating..." : `Fund $${amount} to escrow`}
              </AurumButton>
              <p className="text-xs text-sapphire-300">
                Base USDC funding intent; seating unlocks once escrow is funded.
              </p>
              {error && (
                <p className="rounded-md border border-danger-400/45 bg-danger-400/10 px-3 py-2 text-xs text-ivory-100">
                  {error}
                </p>
              )}
            </div>
          )}
        </Panel>

        {showPicker && (
          <div className="mt-7 flex justify-end">
            <AurumButton variant="ghost" onClick={onBackToLobby}>
              Leave Room
            </AurumButton>
          </div>
        )}
      </section>
    </main>
  );
}
