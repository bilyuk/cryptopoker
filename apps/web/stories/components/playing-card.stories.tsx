import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayingCard } from "@/components/aurum/playing-card";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Design System/Components/Playing Card",
  component: PlayingCard,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    rank: { control: "text" },
    suit: {
      control: "select",
      options: ["D", "H", "S", "C"],
    },
    size: {
      control: "select",
      options: ["table", "seat"],
    },
    empty: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <AurumCanvas>
        <div className="flex items-center gap-4">
          <Story />
        </div>
      </AurumCanvas>
    ),
  ],
} satisfies Meta<typeof PlayingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CommunityCard: Story = {
  args: {
    rank: "10",
    suit: "D",
    size: "table",
  },
};

export const SeatCard: Story = {
  args: {
    rank: "A",
    suit: "H",
    size: "seat",
  },
};

export const Runout: Story = {
  render: () => (
    <>
      <PlayingCard rank="10" suit="D" />
      <PlayingCard rank="J" suit="S" />
      <PlayingCard rank="Q" suit="H" />
      <PlayingCard empty />
      <PlayingCard empty />
    </>
  ),
};
