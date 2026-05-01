import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo } from "@/components/aurum/logo";
import { AurumCanvas } from "./_decorators";

const meta = {
  title: "Design System/Foundations",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AurumCanvas>
        <Story />
      </AurumCanvas>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
  render: () => (
    <div className="grid max-w-6xl gap-10">
      <Logo />
      <section className="grid gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Color</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Sapphire 950", "bg-sapphire-950", "#070A16"],
            ["Sapphire 800", "bg-sapphire-800", "#11183A"],
            ["Champagne 500", "bg-champagne-500", "#D4A85A"],
            ["Gold 400", "bg-gold-400", "#E4C37D"],
            ["Ivory 50", "bg-ivory-50", "#FDFBF4"],
            ["Sapphire 400", "bg-sapphire-400", "#6277B8"],
            ["Verified", "bg-verified-400", "#6FC9A1"],
            ["Danger", "bg-danger-400", "#D4615A"],
          ].map(([name, color, value]) => (
            <div className="rounded-lg border border-champagne-500/20 bg-sapphire-900/80 p-4" key={name}>
              <div className={`h-16 rounded ${color}`} />
              <p className="mt-3 font-medium text-ivory-50">{name}</p>
              <p className="font-mono text-xs text-sapphire-400">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Display</p>
        <h1 className="mt-3 font-display text-7xl leading-none text-ivory-50">
          A seat is <em className="text-gold-400">waiting</em>.
        </h1>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Interface</p>
        <p className="mt-3 text-xl text-ivory-100">Pick a name and take a chair. No sign-up, no wallet - just poker.</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Mono</p>
        <p className="mt-3 font-mono text-lg text-gold-400">$1/$2 · $40-$200 · 3/6</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Interface Tokens</p>
        <div className="mt-3 grid gap-3 rounded-lg border border-champagne-500/20 bg-sapphire-900/80 p-5">
          <p className="aurum-eyebrow">Aurum eyebrow</p>
          <p className="aurum-caption">Aurum caption text keeps table metadata and helper copy at the same scale.</p>
          <p className="aurum-mono-value">$352.00</p>
          <button className="aurum-control-pill w-fit" type="button">
            1/2 pot
          </button>
        </div>
      </div>
    </div>
  ),
};
