"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AurumButton } from "../button";
import { Logo } from "../logo";
import { Panel } from "../panel";

type WelcomeScreenProps = {
  onEnter: (name: string) => void;
  busy?: boolean;
  error?: string;
};

export function WelcomeScreen({ onEnter, busy = false, error }: WelcomeScreenProps) {
  const [name, setName] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onEnter(name.trim() || "riverrat");
  }

  return (
    <main className="relative grid min-h-screen place-items-center content-center gap-6 px-5 py-16 text-center">
      <Logo compact className="absolute left-6 top-6 md:left-12 md:top-11" />
      <span className="absolute right-6 top-7 rounded-full border border-champagne-500/35 bg-sapphire-800/70 px-4 py-2 text-sm font-semibold text-ivory-100 md:hidden">
        Guest
      </span>
      <section>
        <p className="hidden text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500 md:block">Poker, in the grand manner</p>
        <h1 className="mt-8 font-display text-[clamp(58px,8vw,121px)] leading-[0.95] tracking-normal text-ivory-50">
          A seat is <em className="text-gold-400">waiting</em>.
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-[clamp(18px,2vw,24px)] text-ivory-100">
          Pick a name and take a chair. No sign-up, no wallet - just poker.
        </p>
      </section>

      <Panel className="w-full max-w-[660px] p-7 text-left">
        <form onSubmit={submit}>
          <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Guest Player</p>
          <label className="mt-7 grid gap-2.5">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-champagne-500">Display name</span>
            <input
              className="min-h-16 rounded-xl border border-champagne-500/35 bg-sapphire-950/70 px-5 text-xl text-ivory-100 outline-none transition placeholder:text-ivory-100/35 focus:border-champagne-500/70"
              placeholder="pick anything - e.g. river_rat"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <p className="mt-4 text-sm text-sapphire-400">This browser keeps your Player and Display Name for next time.</p>
          {error && <p className="mt-4 text-sm font-semibold text-rose-200">{error}</p>}
          <AurumButton className="mt-6 w-full min-h-16" type="submit" disabled={busy}>
            Take a Seat
            <ArrowRight size={16} />
          </AurumButton>
        </form>
      </Panel>
      <p className="-mt-4 text-xs uppercase tracking-[0.3em] text-sapphire-400">Play-money only - 18+</p>
    </main>
  );
}
