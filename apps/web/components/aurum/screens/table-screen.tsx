"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { Header } from "../header";
import { parseCard, PlayingCard } from "../playing-card";
import type { Room } from "../types";

type TableScreenProps = {
  playerName: string;
  room: Room;
  onLeave: () => void;
  onSignOut: () => void;
};

const streets = ["Preflop", "Flop", "Turn", "River", "Showdown"] as const;
const deckRunout = ["10D", "JS", "QH", "7C", "2S"];
const heroCards = ["AH", "KD"];
const quickBets = [
  { label: "1/2 pot", mobileLabel: "1/2", multiplier: 0.5 },
  { label: "3/4 pot", mobileLabel: "3/4", multiplier: 0.75 },
  { label: "pot", mobileLabel: "Pot", multiplier: 1 },
  { label: "2x", mobileLabel: "2x", multiplier: 2 },
];

function clampChip(value: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function ChipStack({ color, count }: { color: "red" | "gold" | "blue"; count: number }) {
  return (
    <span className="relative block h-4 w-[16.56px] md:h-8 md:w-9">
      {Array.from({ length: count }).map((_, index) => (
        <span
          className={cn(
            "absolute left-0 h-[5.52px] w-[16.56px] rounded-full shadow-[0_0.92px_0.92px_rgb(0_0_0_/_0.3)] md:h-3 md:w-9 md:shadow-[0_2px_2px_rgb(0_0_0_/_0.3)]",
            color === "red" && "bg-[radial-gradient(circle_at_30%_30%,#b22a2a,#761d1d_52%,#3a1010)]",
            color === "gold" && "bg-[radial-gradient(circle_at_30%_30%,#d4a85a,#b08944_52%,#8b6a2e)]",
            color === "blue" && "bg-[radial-gradient(circle_at_30%_30%,#6277b8,#3c4a7e_55%,#161d44)]",
          )}
          key={index}
          style={{ top: `${(count - index - 1) * 1.38}px` }}
        />
      ))}
    </span>
  );
}

function TableButton({
  children,
  detail,
  tone = "neutral",
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  detail: string;
  tone?: "danger" | "neutral" | "gold";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={cn(
        "flex h-12 min-w-0 flex-col items-start justify-center gap-0.5 rounded-[14px] px-4 text-left transition md:h-[58.5px] md:rounded-xl md:px-[19px] xl:h-[66px] xl:px-6",
        tone === "danger" && "border border-danger-400 bg-danger-400/10 text-danger-400",
        tone === "neutral" && "border border-champagne-500/35 bg-gradient-to-b from-sapphire-800/90 to-sapphire-900/90 text-ivory-50",
        tone === "gold" && "border border-[#b08a3e] bg-gradient-to-b from-champagne-300 via-champagne-500 to-[#b08a3e] text-sapphire-950 shadow-[0_10px_28px_rgb(176_138_62_/_0.65)]",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="aurum-action-title">{children}</span>
      <span
        className={cn(
          "aurum-action-detail",
          tone === "danger" && "text-danger-400/75",
          tone === "neutral" && "text-sapphire-400",
          tone === "gold" && "text-sapphire-950/70",
        )}
      >
        {detail}
      </span>
    </button>
  );
}

export function TableScreen({ playerName, room, onLeave, onSignOut }: TableScreenProps) {
  const [handNumber, setHandNumber] = useState(4821);
  const [streetIndex, setStreetIndex] = useState(1);
  const [pot, setPot] = useState(248.4);
  const [stack, setStack] = useState(412);
  const [raiseTo, setRaiseTo] = useState(40);
  const [secondsLeft, setSecondsLeft] = useState(21);
  const [folded, setFolded] = useState(false);
  const [log, setLog] = useState([
    "00:11  Flop - 10♦ J♠ Q♥",
    "00:09  longshot folds",
    "00:06  croupier42 folds",
    "00:04  Blinds posted - $2 / $5",
    `00:00  Hand #4821 dealt`,
  ]);

  const street = streets[streetIndex];
  const callAmount = folded || street === "Showdown" ? 0 : Math.min(12 + streetIndex * 4, stack);
  const maxRaise = Math.max(20, Math.min(stack, Math.round(pot * 2)));
  const visibleCommunity = useMemo(() => {
    if (streetIndex === 0) return [];
    if (streetIndex === 1) return deckRunout.slice(0, 3);
    if (streetIndex === 2) return deckRunout.slice(0, 4);
    return deckRunout;
  }, [streetIndex]);

  useEffect(() => {
    if (folded || street === "Showdown") return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [folded, street]);

  useEffect(() => {
    if (secondsLeft !== 0 || folded || street === "Showdown") return;
    commitAction("calls", callAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function resetTimer() {
    setSecondsLeft(21);
  }

  function appendLog(message: string) {
    setLog((current) => [message, ...current].slice(0, 6));
  }

  function advanceStreet() {
    setStreetIndex((current) => Math.min(current + 1, streets.length - 1));
    resetTimer();
  }

  function commitAction(label: string, amount: number) {
    if (folded) return;
    if (street === "Showdown") {
      startNextHand();
      return;
    }

    const committed = clampChip(amount, stack);
    setStack((current) => clampChip(current - committed, current));
    setPot((current) => current + committed);
    appendLog(`00:${(21 - secondsLeft).toString().padStart(2, "0")}  ${playerName} ${label} ${formatMoney(committed)}`);
    advanceStreet();
    setRaiseTo((current) => clampChip(Math.max(current, pot * 0.5), maxRaise));
  }

  function foldHand() {
    setFolded(true);
    setSecondsLeft(0);
    appendLog(`00:${(21 - secondsLeft).toString().padStart(2, "0")}  ${playerName} folds`);
  }

  function startNextHand() {
    setHandNumber((current) => current + 1);
    setStreetIndex(0);
    setPot(15);
    setStack((current) => Math.max(current, 200));
    setRaiseTo(25);
    setFolded(false);
    resetTimer();
    setLog([`00:00  Hand #${handNumber + 1} dealt`, `${playerName} posts the big blind`, "Action is live"]);
  }

  function setQuickBet(multiplier: number) {
    setRaiseTo(clampChip(Math.max(20, pot * multiplier), maxRaise));
  }

  const timerLabel = `00:${secondsLeft.toString().padStart(2, "0")}`;
  const actionLabel = folded || street === "Showdown" ? "New Hand" : "Call";
  const actionDetail = folded || street === "Showdown" ? "Start next deal" : formatMoney(callAmount);

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden px-3 md:px-6 xl:px-10">
      <Header className="md:mt-0" mode={`${room.name} - ${room.blinds} - NL`} playerName={playerName} onSignOut={onSignOut} />

      <section className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1700px] flex-1 flex-col pt-2 md:pt-4 xl:pt-5">
        <div className="shrink-0 overflow-hidden rounded-2xl border border-champagne-500/18 bg-sapphire-950/62 px-3 py-2 shadow-[0_12px_36px_rgb(7_10_22_/_0.45)] backdrop-blur-md md:flex md:min-h-12 md:items-center md:justify-between md:px-4 md:py-2 xl:min-h-14 xl:px-5">
          <div className="hidden items-center gap-3 md:flex">
            <span className="aurum-eyebrow font-mono">Hand #{handNumber}</span>
            <span className="h-3 w-px bg-champagne-500/35" />
            <span className="aurum-caption">6 seats - 3 active</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:hidden">
            {["Gilt Room", `Hand #${handNumber}`, folded ? "Folded" : `To act ${timerLabel}`].map((pill, index) => (
              <span
                className={cn(
                  "aurum-caption shrink-0 rounded-full border px-2.5 py-1.5 tracking-[0.08em]",
                  index === 2 ? "border-champagne-500/60 bg-champagne-500/10 text-gold-400" : "border-sapphire-400/30 bg-sapphire-800/45 text-sapphire-200",
                )}
                key={pill}
              >
                {pill}
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex flex-nowrap justify-start gap-1.5 overflow-x-auto pb-0.5 md:mt-0 md:justify-center md:gap-2 md:overflow-visible md:pb-0">
            {streets.map((step) => (
              <span
                className="shrink-0 rounded-full border border-sapphire-400/25 bg-sapphire-950/70 px-2.5 py-1 text-[8.5px] uppercase tracking-[0.28em] text-sapphire-300 data-[active=true]:border-champagne-500/70 data-[active=true]:bg-champagne-500/10 data-[active=true]:text-gold-400 md:px-[11px] md:py-1.5 md:text-[9.5px] xl:px-4 xl:text-[10px]"
                data-active={step === street}
                key={step}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 items-center gap-3 py-2 md:gap-4 md:py-3 xl:grid-cols-[minmax(520px,1fr)_320px] xl:justify-center xl:gap-9 xl:py-4 2xl:grid-cols-[minmax(640px,1fr)_340px] 2xl:gap-12">
          <div className="relative mx-auto aspect-[754/424.125] w-[min(100%,calc((100dvh-var(--table-offset))*1.777),var(--table-max))] overflow-hidden rounded-full [--table-max:346.84px] [--table-offset:382px] sm:[--table-max:430px] md:[--table-max:754px] md:[--table-offset:322px] xl:[--table-max:940px] xl:[--table-offset:346px] 2xl:[--table-max:1080px] 2xl:[--table-offset:366px]">
            <div className="absolute inset-[4.6px] rounded-full opacity-90 shadow-[0_0_27.6px_rgb(212_168_90_/_0.25),inset_0_0_18.4px_rgb(0_0_0_/_0.7)] md:inset-2.5 md:shadow-[0_0_60px_rgb(212_168_90_/_0.25),inset_0_0_40px_rgb(0_0_0_/_0.7)]" />
            <div className="absolute inset-[9.2px] overflow-hidden rounded-full bg-[radial-gradient(ellipse_at_50%_30%,#2b8866_0%,#1c6b4e_20%,#14573f_45%,#0f4532_75%,#0b3326_100%)] shadow-[inset_0_0_36.8px_rgb(0_0_0_/_0.55),inset_0_0_0_0.92px_rgb(240_217_164_/_0.2),inset_0_0_0_2.3px_rgb(0_0_0_/_0.4),inset_0_0_0_2.76px_rgb(212_168_90_/_0.12)] md:inset-5 md:shadow-[inset_0_0_80px_rgb(0_0_0_/_0.55),inset_0_0_0_2px_rgb(240_217_164_/_0.2),inset_0_0_0_5px_rgb(0_0_0_/_0.4),inset_0_0_0_6px_rgb(212_168_90_/_0.12)]">
              <div className="absolute inset-[13.8px] rounded-full bg-[radial-gradient(ellipse_at_50%_50%,rgb(212_168_90_/_0.06),transparent_55%)] md:inset-[30px]" />
              <div className="absolute left-[13.25%] top-[18%] h-[58%] w-[68%] rounded-full border border-ivory-100/10 md:left-[14%] md:top-[18%]" />
              <div className="absolute left-1/2 top-[19.8%] flex -translate-x-1/2 gap-[3.68px] sm:gap-1.5 md:top-[19.8%] md:gap-2 xl:gap-3 2xl:gap-3.5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const card = visibleCommunity[index];
                  const parsed = card ? parseCard(card) : undefined;
                  return <PlayingCard empty={!parsed} key={index} rank={parsed?.rank} suit={parsed?.suit} />;
                })}
              </div>
              <div className="absolute left-1/2 top-[50.5%] -translate-x-1/2 text-center md:top-[49%]">
                <p className="text-[4.37px] font-semibold uppercase tracking-[0.32em] text-champagne-300/70 md:text-[9.5px] md:tracking-[0.32em] xl:text-[11.5px] 2xl:text-[12.5px]">Pot - {street}</p>
                <strong className="mt-1 block font-mono text-[14.72px] font-medium leading-none text-champagne-300 md:mt-2 md:text-[32px] xl:text-[42px] 2xl:text-[48px]">
                  {formatMoney(pot)}
                </strong>
                <p className="mt-1.5 font-mono text-[4.6px] uppercase tracking-[0.1em] text-champagne-300/55 md:mt-3 md:text-[10px] xl:text-[12px]">{room.blinds} - No Limit</p>
              </div>
              <div className="absolute left-1/2 top-[74%] flex -translate-x-1/2 items-end gap-[2.76px] md:top-[76%] md:gap-1.5">
                <ChipStack color="red" count={4} />
                <ChipStack color="gold" count={6} />
                <ChipStack color="blue" count={3} />
              </div>
            </div>
          </div>

          <aside className="hidden max-h-[min(280px,calc(100dvh-330px))] overflow-hidden rounded-xl border border-champagne-500/20 bg-sapphire-900/70 p-5 xl:block 2xl:p-6">
            <div className="flex items-center justify-between border-t border-champagne-500/35 pt-3">
              <p className="aurum-eyebrow text-champagne-500">Action Log</p>
              <span className="aurum-action-detail text-sapphire-400">Hand #{handNumber}</span>
            </div>
            <div className="mt-3 grid gap-2">
              {log.map((entry, index) => (
                <p className="font-mono text-xs text-sapphire-200 2xl:text-sm" key={`${entry}-${index}`}>
                  {entry}
                </p>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="relative z-20 -mx-3 shrink-0 overflow-hidden border-t border-champagne-500/35 bg-gradient-to-b from-sapphire-950/35 to-sapphire-950 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 shadow-[0_-20px_60px_rgb(212_168_90_/_0.28)] md:-mx-6 md:h-[178px] md:px-6 md:pb-0 md:pt-3.5 lg:px-8 xl:-mx-10 xl:h-[190px] xl:px-10 xl:pt-4">
        <div className="mx-auto hidden h-[150px] w-full max-w-[1080px] flex-col gap-2.5 md:flex xl:h-[156px] xl:max-w-[1240px] 2xl:max-w-[1360px]">
          <div className="flex h-9 items-center gap-3.5 xl:h-10 xl:gap-5">
            <div className="w-[50px] xl:w-[68px]">
              <p className="aurum-eyebrow">To act</p>
              <p className="aurum-mono-value mt-1 text-[#e0a13a]">{timerLabel}</p>
            </div>
            <div className="h-[3px] flex-1 rounded-full bg-champagne-500/15">
              <div className="h-full rounded-full bg-gradient-to-r from-champagne-500 to-champagne-300" style={{ width: `${Math.max(0, secondsLeft / 21) * 100}%` }} />
            </div>
            <div className="w-[50px] text-right xl:w-[68px]">
              <p className="aurum-eyebrow">Stack</p>
              <p className="aurum-mono-value mt-1">{stack.toFixed(2)}</p>
            </div>
          </div>
          <div className="relative h-[29px] xl:h-8">
            <span className="aurum-eyebrow absolute left-0 top-[7px] xl:top-[9px]">Quick</span>
            <div className="absolute left-[51px] top-0.5 flex gap-2 xl:left-[64px] xl:gap-2.5">
              {quickBets.map((bet) => (
                <button className="aurum-control-pill" key={bet.label} onClick={() => setQuickBet(bet.multiplier)} type="button">
                  {bet.label}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 flex h-[28.6px] w-[244px] items-center gap-3 rounded-full border border-champagne-500/35 bg-sapphire-800/60 px-[11px] xl:h-8 xl:w-[304px] xl:px-4">
              <span className="aurum-eyebrow">Raise</span>
              <input aria-label="Raise amount" className="min-w-0 flex-1 accent-champagne-500" max={maxRaise} min={20} onChange={(event) => setRaiseTo(Number(event.target.value))} type="range" value={Math.min(raiseTo, maxRaise)} />
              <span className="aurum-mono-value w-10">${Math.min(raiseTo, maxRaise).toFixed(0)}</span>
            </div>
          </div>
          <div className="grid h-[62px] grid-cols-[1fr_1fr_1.305fr] gap-3 xl:h-[66px] xl:gap-4">
            <TableButton detail="Forfeit hand" onClick={folded ? onLeave : foldHand} tone="danger">
              {folded ? "Leave" : "Fold"}
            </TableButton>
            <TableButton detail={actionDetail} onClick={folded || street === "Showdown" ? startNextHand : () => commitAction("calls", callAmount)}>
              {actionLabel}
            </TableButton>
            <TableButton detail="Commit to the pot" disabled={folded} onClick={() => commitAction("raises to", Math.min(raiseTo, maxRaise))} tone="gold">
              Raise to <span className="font-mono">{formatMoney(Math.min(raiseTo, maxRaise))}</span>
            </TableButton>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[460px] gap-2 md:hidden">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="aurum-eyebrow">To act</p>
              <p className="aurum-mono-value mt-1 text-[#e0a13a]">{timerLabel}</p>
            </div>
            <div className="text-right">
              <p className="aurum-eyebrow">Stack</p>
              <p className="aurum-mono-value mt-1">{stack.toFixed(2)}</p>
            </div>
          </div>
          <div className="h-[3px] rounded-full bg-champagne-500/15">
            <div className="h-full rounded-full bg-gradient-to-r from-champagne-500 to-champagne-300" style={{ width: `${Math.max(0, secondsLeft / 21) * 100}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {quickBets.map((bet) => (
              <button className="aurum-control-pill h-7 w-full px-1 text-[10px]" key={bet.label} onClick={() => setQuickBet(bet.multiplier)} type="button">
                {bet.mobileLabel}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TableButton className="h-11 px-3" detail="Forfeit hand" onClick={folded ? onLeave : foldHand} tone="danger">
              {folded ? "Leave" : "Fold"}
            </TableButton>
            <TableButton className="h-11 px-3" detail={actionDetail} onClick={folded || street === "Showdown" ? startNextHand : () => commitAction("calls", callAmount)}>
              {actionLabel}
            </TableButton>
          </div>
          <TableButton className="h-12 w-full items-center px-3 text-center" detail="Commit to the pot" disabled={folded} onClick={() => commitAction("raises to", Math.min(raiseTo, maxRaise))} tone="gold">
            Raise to <span className="font-mono">{formatMoney(Math.min(raiseTo, maxRaise))}</span>
          </TableButton>
        </div>
      </div>
    </main>
  );
}
