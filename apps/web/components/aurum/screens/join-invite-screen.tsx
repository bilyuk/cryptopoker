"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AurumButton } from "../button";
import { Header } from "../header";
import { Panel } from "../panel";

type JoinInviteScreenProps = {
  playerName: string;
  error?: string;
  onBack: () => void;
  onJoinLink: (input: string) => void;
  onSignOut: () => void;
};

export function JoinInviteScreen({ playerName, error, onBack, onJoinLink, onSignOut }: JoinInviteScreenProps) {
  const [inviteInput, setInviteInput] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onJoinLink(inviteInput);
  }

  return (
    <main className="relative min-h-screen p-3 pb-28 md:p-6">
      <Header mode="Join with Invite Link" playerName={playerName} onSignOut={onSignOut} />
      <Panel className="mx-auto mt-12 w-full max-w-[720px] p-5 md:mt-28 md:p-8">
        <form onSubmit={submit}>
          <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Private invite</p>
          <h2 className="mt-3 font-display text-5xl leading-none text-ivory-50">Find your Room.</h2>
          <p className="mt-4 text-sm text-ivory-100">Paste the Invite Link or code from the Room Host.</p>
          <label className="mt-7 grid gap-2.5">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-champagne-500">Invite link or code</span>
            <input
              className="aurum-input"
              placeholder="https://cryptopoker.game/r/..."
              value={inviteInput}
              onChange={(event) => setInviteInput(event.target.value)}
            />
          </label>
          {error && <p className="mt-4 text-sm font-semibold text-rose-200">{error}</p>}
          <div className="mt-7 grid gap-3 sm:grid-cols-[0.9fr_1.5fr] md:ml-auto md:max-w-sm">
            <AurumButton type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft size={16} />
              Back
            </AurumButton>
            <AurumButton type="submit">
              Preview Room
              <ArrowRight size={16} />
            </AurumButton>
          </div>
        </form>
      </Panel>
    </main>
  );
}
