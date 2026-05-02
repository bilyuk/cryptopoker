import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight } from "lucide-react";
import { AurumButton } from "@/components/aurum/button";
import { Panel } from "@/components/aurum/panel";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Design System/Components/Panel",
  component: Panel,
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
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    className: "h-64 w-full max-w-xl",
  },
};

export const GuestEntryPanel: Story = {
  render: () => (
    <Panel className="w-full max-w-[660px] p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.55em] text-champagne-500">Guest Player</p>
      <label className="mt-7 grid gap-2.5">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-champagne-500">Display name</span>
        <input className="aurum-input" placeholder="pick anything - e.g. river_rat" />
      </label>
      <p className="mt-4 text-sm text-sapphire-400">This browser keeps your Player and Display Name for next time.</p>
      <AurumButton className="mt-6 w-full min-h-16">
        Take a Seat
        <ArrowRight size={16} />
      </AurumButton>
    </Panel>
  ),
};
