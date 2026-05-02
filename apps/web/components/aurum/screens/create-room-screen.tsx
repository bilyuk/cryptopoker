"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { AurumButton } from "../button";
import { Header } from "../header";
import { Panel } from "../panel";
import type { CreateRoomValues } from "../types";

type CreateRoomScreenProps = {
  playerName: string;
  onCancel: () => void;
  onCreate: (values: CreateRoomValues) => void;
  onSignOut: () => void;
};

export function CreateRoomScreen({ playerName, onCancel, onCreate, onSignOut }: CreateRoomScreenProps) {
  const [values, setValues] = useState<CreateRoomValues>({
    name: "The Velvet Room",
    mode: "host-verified",
    blinds: "$1/$2",
    buyInMin: "$40",
    buyInMax: "$200",
    seats: "6",
    timer: "30s",
  });

  function update(key: keyof CreateRoomValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate(values);
  }

  return (
    <main className="relative min-h-screen p-3 pb-28 md:p-6">
      <Header mode="Create room" playerName={playerName} onSignOut={onSignOut} />
      <Panel className="mx-auto mt-12 w-full max-w-[920px] p-5 md:mt-28 md:p-8">
        <form onSubmit={submit}>
          <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Start a table</p>
          <h2 className="mt-3 font-display text-5xl leading-none text-ivory-50">Make it private.</h2>
          <p className="mt-4 text-sm text-ivory-100">Pick the feel of the room. Everyone joins by invite link only.</p>
          <Field label="Room mode">
            <select className="aurum-input" value={values.mode} onChange={(event) => update("mode", event.target.value as CreateRoomValues["mode"])}>
              <option value="host-verified">Host-Verified Buy-In</option>
              <option value="blockchain-backed">Blockchain-Backed Room (Base + USDC, no rake)</option>
            </select>
          </Field>
          <Field label="Room name">
            <input
              className="aurum-input"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </Field>
          <div className="grid gap-x-5 md:grid-cols-2">
            <Field label="Blinds">
              <select className="aurum-input" value={values.blinds} onChange={(event) => update("blinds", event.target.value)}>
                <option>$0.50/$1</option>
                <option>$1/$2</option>
                <option>$2/$5</option>
                <option>$5/$10</option>
              </select>
            </Field>
            <Field label="Seats">
              <select className="aurum-input" value={values.seats} onChange={(event) => update("seats", event.target.value)}>
                <option>2</option>
                <option>6</option>
                <option>9</option>
              </select>
            </Field>
            <Field label="Buy-in min">
              <input
                className="aurum-input"
                value={values.buyInMin}
                onChange={(event) => update("buyInMin", event.target.value)}
              />
            </Field>
            <Field label="Buy-in max">
              <input
                className="aurum-input"
                value={values.buyInMax}
                onChange={(event) => update("buyInMax", event.target.value)}
              />
            </Field>
          </div>
          <p className="mt-9 text-xs text-sapphire-400">
            {values.mode === "blockchain-backed"
              ? "Blockchain-Backed Rooms use Connected Wallet and Bound Wallet preflight on Base with native USDC. No platform rake. Host-Arbitrated Payouts are disclosed before funding and on payout receipts."
              : "A private invite link is generated after you create the room. Share it with anyone you want at your table."}
          </p>
          {values.mode === "blockchain-backed" && (
            <p className="mt-2 text-xs text-sapphire-300">
              Host delegation notice: checkout payouts are authorized by the Room Host (or delegated Room Settlement Key), while custody stays in on-chain escrow.
            </p>
          )}
          <div className="mt-7 grid gap-3 sm:grid-cols-[0.9fr_1.5fr] md:ml-auto md:max-w-sm">
            <AurumButton type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </AurumButton>
            <AurumButton type="submit">
              Create Private Room
              <ArrowRight size={16} />
            </AurumButton>
          </div>
        </form>
      </Panel>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-7 grid gap-2.5">
      <span className="text-sm font-semibold uppercase tracking-[0.3em] text-champagne-500">{label}</span>
      {children}
    </label>
  );
}
