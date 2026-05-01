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

export const LoginFormPanel: Story = {
  render: () => (
    <Panel className="w-full max-w-[660px] p-7">
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-champagne-500/15 bg-sapphire-950/60 p-1.5">
        <AurumButton active variant="segment">Play as Guest</AurumButton>
        <AurumButton variant="segment">Sign In</AurumButton>
      </div>
      <label className="mt-7 grid gap-2.5">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-champagne-500">Display name</span>
        <input className="aurum-input" placeholder="pick anything - e.g. river_rat" />
      </label>
      <p className="mt-4 text-sm text-sapphire-400">Guest names are not saved. Close the tab, take the name with you.</p>
      <AurumButton className="mt-6 w-full min-h-16">
        Take a Seat
        <ArrowRight size={16} />
      </AurumButton>
    </Panel>
  ),
};
