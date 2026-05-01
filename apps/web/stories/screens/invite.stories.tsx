import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { defaultRooms } from "@/components/aurum/data";
import { InviteScreen } from "@/components/aurum/screens/invite-screen";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Screens/Invite",
  component: InviteScreen,
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
} satisfies Meta<typeof InviteScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileInvite: Story = {
  args: {
    hostName: "riverrat",
    room: defaultRooms[0],
    onBack: () => undefined,
    onJoin: () => undefined,
    onSignIn: () => undefined,
  },
};
