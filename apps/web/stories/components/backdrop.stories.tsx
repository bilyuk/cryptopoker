import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Backdrop } from "@/components/aurum/backdrop";

const meta = {
  title: "Design System/Components/Backdrop",
  component: Backdrop,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Backdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="relative min-h-screen overflow-hidden bg-sapphire-950">
      <Backdrop />
    </div>
  ),
};
