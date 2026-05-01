import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { defaultRooms } from "@/components/aurum/data";
import { RoomCard } from "@/components/aurum/room-card";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Design System/Components/RoomCard",
  component: RoomCard,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AurumCanvas>
        <div className="max-w-sm">
          <Story />
        </div>
      </AurumCanvas>
    ),
  ],
} satisfies Meta<typeof RoomCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Featured: Story = {
  args: {
    room: defaultRooms[0],
  },
};

export const Open: Story = {
  args: {
    room: defaultRooms[1],
  },
};

export const Full: Story = {
  args: {
    room: defaultRooms[5],
  },
};

export const Grid: Story = {
  args: {
    room: defaultRooms[0],
  },
  decorators: [
    (Story) => (
      <AurumCanvas>
        <div className="grid max-w-5xl gap-4 md:grid-cols-3">
          <Story />
        </div>
      </AurumCanvas>
    ),
  ],
  render: () => (
    <>
      {defaultRooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </>
  ),
};
