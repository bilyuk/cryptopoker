import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { defaultRooms } from "@/components/aurum/data";
import { RoomScreen } from "@/components/aurum/screens/room-screen";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Screens/Room",
  component: RoomScreen,
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
} satisfies Meta<typeof RoomScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrivateRoom: Story = {
  args: {
    playerName: "riverrat",
    room: defaultRooms[0],
    onBackToLobby: () => undefined,
    onDeal: () => undefined,
    onApproveBuyIn: () => undefined,
    onClaimSeat: () => undefined,
    onInvitePreview: () => undefined,
    onCopyInvite: () => undefined,
    onRequestBuyIn: () => undefined,
    onShareInvite: () => undefined,
    onSignOut: () => undefined,
  },
};
