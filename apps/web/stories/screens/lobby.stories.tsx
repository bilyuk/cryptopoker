import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { defaultRooms } from "@/components/aurum/data";
import { LobbyScreen } from "@/components/aurum/screens/lobby-screen";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Screens/Lobby",
  component: LobbyScreen,
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
} satisfies Meta<typeof LobbyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerName: "riverrat",
    rooms: defaultRooms,
    onCreateRoom: () => undefined,
    onInvitePreview: () => undefined,
    onOpenRoom: () => undefined,
    onSignOut: () => undefined,
  },
};
