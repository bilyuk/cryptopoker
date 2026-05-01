import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { defaultRooms } from "@/components/aurum/data";
import { TableScreen } from "@/components/aurum/screens/table-screen";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Screens/Table",
  component: TableScreen,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AurumCanvas padded={false}>
        <Story />
      </AurumCanvas>
    ),
  ],
} satisfies Meta<typeof TableScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveHand: Story = {
  args: {
    playerName: "riverrat",
    room: defaultRooms[0],
    onLeave: () => undefined,
    onSignOut: () => undefined,
  },
};
