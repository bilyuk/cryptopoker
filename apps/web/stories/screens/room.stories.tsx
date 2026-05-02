import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Room, RoomPlayerSummary } from "@/components/aurum/types";
import { defaultRooms } from "@/components/aurum/data";
import { RoomScreen } from "@/components/aurum/screens/room-screen";
import { AurumCanvas } from "../_decorators";

const baseRoom = defaultRooms[0];
const hostId = baseRoom.hostPlayerId;
const guestId = "story-guest";

const hostPlayer: RoomPlayerSummary = {
  playerId: hostId,
  displayName: baseRoom.hostName,
  role: "host",
  seated: true,
  stack: "$200.00",
  buyInStatus: "in-play",
};

const seatedRoom: Room = {
  ...baseRoom,
  players: [hostPlayer],
};

const seatedRoomWithPending: Room = {
  ...seatedRoom,
  pendingBuyIns: [
    { id: "buy-in-1", playerId: "pending-1", displayName: "magpie", amount: "$200.00" },
    { id: "buy-in-2", playerId: "pending-2", displayName: "kings_up", amount: "$300.00" },
  ],
  players: [
    hostPlayer,
    {
      playerId: "pending-1",
      displayName: "magpie",
      role: "player",
      seated: false,
      stack: null,
      buyInStatus: "funding-pending",
      buyInId: "buy-in-1",
    },
    {
      playerId: "pending-2",
      displayName: "kings_up",
      role: "player",
      seated: false,
      stack: null,
      buyInStatus: "funding-pending",
      buyInId: "buy-in-2",
    },
  ],
};

const guestUnverifiedRoom: Room = {
  ...baseRoom,
  players: [
    hostPlayer,
    {
      playerId: guestId,
      displayName: "you",
      role: "player",
      seated: false,
      stack: null,
      buyInStatus: "none",
    },
  ],
};

const guestPendingRoom: Room = {
  ...baseRoom,
  players: [
    hostPlayer,
    {
      playerId: guestId,
      displayName: "you",
      role: "player",
      seated: false,
      stack: null,
      buyInStatus: "funding-pending",
      buyInId: "buy-in-self",
    },
  ],
};

const guestWaitlistRoom: Room = {
  ...baseRoom,
  occupiedSeats: 6,
  full: true,
  status: "Full",
  players: [
    hostPlayer,
    {
      playerId: guestId,
      displayName: "you",
      role: "player",
      seated: false,
      stack: null,
      buyInStatus: "in-play",
      buyInId: "buy-in-self",
    },
  ],
  waitlistRoster: [
    { position: 1, playerId: guestId, displayName: "you" },
    { position: 2, playerId: "later", displayName: "longshot" },
  ],
  currentPlayerWaitlistPosition: 1,
};

const guestSeatOfferRoom: Room = {
  ...guestWaitlistRoom,
  currentPlayerSeatOffer: { id: "offer-1", seatNumber: 4 },
};

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

const baseHandlers = {
  playerName: "riverrat",
  onBackToLobby: () => undefined,
  onDeal: () => undefined,
  onExpireBuyIn: () => undefined,
  onRefundBuyIn: () => undefined,
  onLeaveSeat: () => undefined,
  onInvitePreview: () => undefined,
  onCopyInvite: () => undefined,
  onRequestBuyIn: async () => undefined,
  onLeaveWaitlist: () => undefined,
  onAcceptSeatOffer: () => undefined,
  onDeclineSeatOffer: () => undefined,
  onShareInvite: () => undefined,
  onSignOut: () => undefined,
};

export const HostAtTableEmpty: Story = {
  args: { ...baseHandlers, room: seatedRoom, playerId: hostId },
};

export const HostAtTableWithPending: Story = {
  args: { ...baseHandlers, room: seatedRoomWithPending, playerId: hostId },
};

export const GuestUnverifiedFoyer: Story = {
  args: { ...baseHandlers, room: guestUnverifiedRoom, playerId: guestId },
};

export const GuestPendingFoyer: Story = {
  args: { ...baseHandlers, room: guestPendingRoom, playerId: guestId },
};

export const GuestWaitlistFoyer: Story = {
  args: { ...baseHandlers, room: guestWaitlistRoom, playerId: guestId },
};

export const GuestSeatOfferFoyer: Story = {
  args: { ...baseHandlers, room: guestSeatOfferRoom, playerId: guestId },
};
