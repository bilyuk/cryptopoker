import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreateRoomScreen } from "@/components/aurum/screens/create-room-screen";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Screens/Create Room",
  component: CreateRoomScreen,
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
} satisfies Meta<typeof CreateRoomScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerName: "riverrat",
    onCancel: () => undefined,
    onCreate: () => undefined,
    onSignOut: () => undefined,
  },
};
