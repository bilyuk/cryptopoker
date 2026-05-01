import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo } from "@/components/aurum/logo";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Design System/Components/Logo",
  component: Logo,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    compact: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <AurumCanvas>
        <Story />
      </AurumCanvas>
    ),
  ],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Product: Story = {
  args: {
    compact: false,
  },
};

export const Compact: Story = {
  args: {
    compact: true,
  },
};
