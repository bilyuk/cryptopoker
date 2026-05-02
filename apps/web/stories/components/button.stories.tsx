import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Copy, Plus } from "lucide-react";
import { AurumButton } from "@/components/aurum/button";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Design System/Components/Button",
  component: AurumButton,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "ghost", "segment"],
    },
    active: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <AurumCanvas>
        <div className="max-w-xl">
          <Story />
        </div>
      </AurumCanvas>
    ),
  ],
} satisfies Meta<typeof AurumButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: (
      <>
        Take a Seat
        <ArrowRight size={16} />
      </>
    ),
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: (
      <>
        <Copy size={16} />
        Copy Invite
      </>
    ),
  },
};

export const Segment: Story = {
  args: {
    variant: "segment",
    active: true,
    children: "Play as Guest",
  },
};

export const ButtonGroup: Story = {
  args: {
    children: "Button group",
  },
  render: () => (
    <div className="grid gap-4">
      <AurumButton>
        <Plus size={16} />
        Create Room
      </AurumButton>
      <AurumButton variant="ghost">Leave Room</AurumButton>
      <div className="grid gap-2 rounded-2xl border border-champagne-500/15 bg-sapphire-950/60 p-1.5">
        <AurumButton active variant="segment">Guest Player</AurumButton>
      </div>
    </div>
  ),
};
