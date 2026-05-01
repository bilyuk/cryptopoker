import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Header } from "@/components/aurum/header";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Design System/Components/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    mode: { control: "text" },
    playerName: { control: "text" },
  },
  decorators: [
    (Story) => (
      <AurumCanvas padded={false}>
        <div className="p-6">
          <Story />
        </div>
      </AurumCanvas>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LobbyHeader: Story = {
  args: {
    mode: "Lobby",
    playerName: "riverrat",
    onCreateRoom: () => undefined,
    onInvitePreview: () => undefined,
    onSignOut: () => undefined,
  },
};

export const RoomHeader: Story = {
  args: {
    mode: "Private room",
    playerName: "acepilot",
    onInvitePreview: () => undefined,
    onSignOut: () => undefined,
  },
};
