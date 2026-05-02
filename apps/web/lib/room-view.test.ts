import { describe, expect, it } from "vitest";
import type { RoomDto } from "@cryptopoker/contracts";
import { isCurrentPlayerInRoom, toUiRoomForPlayer } from "./room-view";

const emptyRoom: RoomDto = {
  id: "room-1",
  hostPlayerId: "host-1",
  tableId: "table-1",
  inviteCode: "invite-1",
  settings: {
    name: "Codex Test Room",
    smallBlind: 1,
    bigBlind: 2,
    buyInMin: 40,
    buyInMax: 200,
    seatCount: 6,
    actionTimerSeconds: 30,
  },
  hasStarted: false,
  players: [{ playerId: "host-1", displayName: "codex_tester", role: "host" }],
  buyIns: [],
  seats: Array.from({ length: 6 }, (_, index) => ({
    seatNumber: index + 1,
    playerId: null,
    tableStack: null,
  })),
  waitlist: [],
  seatOffers: [],
};

describe("Room view model", () => {
  it("exposes the buy-in range as { min, max } and renders empty seats", () => {
    const room = toUiRoomForPlayer(emptyRoom);

    expect(room.seats).toBe("0/6");
    expect(room.occupiedSeats).toBe(0);
    expect(room.seatCount).toBe(6);
    expect(room.buyInRange).toEqual({ min: 40, max: 200 });
    expect(room.seatRoster).toEqual([
      { seatNumber: 1, playerId: null, displayName: null, isHost: false, stack: null },
      { seatNumber: 2, playerId: null, displayName: null, isHost: false, stack: null },
      { seatNumber: 3, playerId: null, displayName: null, isHost: false, stack: null },
      { seatNumber: 4, playerId: null, displayName: null, isHost: false, stack: null },
      { seatNumber: 5, playerId: null, displayName: null, isHost: false, stack: null },
      { seatNumber: 6, playerId: null, displayName: null, isHost: false, stack: null },
    ]);
  });

  it("flags the host seat and renders occupied seats with stacks", () => {
    const room = toUiRoomForPlayer({
      ...emptyRoom,
      players: [
        { playerId: "host-1", displayName: "codex_tester", role: "host" },
        { playerId: "guest-1", displayName: "guest_tester", role: "player" },
      ],
      buyIns: [
        { id: "host-buy", roomId: "room-1", playerId: "host-1", amount: 40, status: "host-verified" },
        { id: "guest-buy", roomId: "room-1", playerId: "guest-1", amount: 80, status: "host-verified" },
      ],
      seats: [
        { seatNumber: 1, playerId: "host-1", tableStack: 40 },
        { seatNumber: 2, playerId: "guest-1", tableStack: 80 },
        ...Array.from({ length: 4 }, (_, index) => ({ seatNumber: index + 3, playerId: null, tableStack: null })),
      ],
    });

    expect(room.seatRoster[0]).toEqual({
      seatNumber: 1,
      playerId: "host-1",
      displayName: "codex_tester",
      isHost: true,
      stack: "$40.00",
    });
    expect(room.seatRoster[1]).toEqual({
      seatNumber: 2,
      playerId: "guest-1",
      displayName: "guest_tester",
      isHost: false,
      stack: "$80.00",
    });
    expect(room.players).toHaveLength(2);
    expect(room.players[1]).toEqual(
      expect.objectContaining({ playerId: "guest-1", seated: true, stack: "$80.00", buyInStatus: "host-verified" }),
    );
  });

  it("surfaces pending Buy-Ins for the host banner without listing them in seat roster", () => {
    const room = toUiRoomForPlayer({
      ...emptyRoom,
      players: [
        { playerId: "host-1", displayName: "codex_tester", role: "host" },
        { playerId: "guest-1", displayName: "guest_tester", role: "player" },
      ],
      buyIns: [
        { id: "buy-in-1", roomId: "room-1", playerId: "guest-1", amount: 40, status: "pending" },
      ],
    });

    expect(room.pendingBuyIns).toEqual([
      { id: "buy-in-1", playerId: "guest-1", displayName: "guest_tester", amount: "$40.00" },
    ]);
    expect(room.seatRoster.every((entry) => entry.playerId === null)).toBe(true);
  });

  it("isCurrentPlayerInRoom returns false for invite preview (Player not in players list yet)", () => {
    // Preview path: server returns RoomDto without adding the Player to joinedPlayerIds.
    // FE Room.players therefore does not include the previewing Player. Subscribing the
    // WS at this moment would fail with ROOM_ACCESS_REQUIRED and never recover.
    const room = toUiRoomForPlayer(emptyRoom);
    expect(isCurrentPlayerInRoom(room, "guest-not-joined")).toBe(false);
  });

  it("isCurrentPlayerInRoom returns true once the Player has joined", () => {
    const room = toUiRoomForPlayer({
      ...emptyRoom,
      players: [
        { playerId: "host-1", displayName: "codex_tester", role: "host" },
        { playerId: "guest-1", displayName: "guest_tester", role: "player" },
      ],
    });
    expect(isCurrentPlayerInRoom(room, "guest-1")).toBe(true);
    expect(isCurrentPlayerInRoom(room, "host-1")).toBe(true);
  });

  it("isCurrentPlayerInRoom returns false without a playerId", () => {
    const room = toUiRoomForPlayer(emptyRoom);
    expect(isCurrentPlayerInRoom(room, undefined)).toBe(false);
  });

  it("exposes the current Player's Waitlist position, Seat Offer, and waitlist roster", () => {
    const room = toUiRoomForPlayer(
      {
        ...emptyRoom,
        players: [
          { playerId: "host-1", displayName: "codex_tester", role: "host" },
          { playerId: "guest-1", displayName: "guest_tester", role: "player" },
          { playerId: "guest-2", displayName: "second", role: "player" },
        ],
        waitlist: [
          { playerId: "guest-1", position: 1 },
          { playerId: "guest-2", position: 2 },
        ],
        seatOffers: [
          { id: "offer-1", roomId: "room-1", playerId: "guest-1", seatNumber: 2, status: "pending" },
          { id: "offer-2", roomId: "room-1", playerId: "host-1", seatNumber: 3, status: "pending" },
        ],
      },
      "guest-1",
    );

    expect(room.currentPlayerWaitlistPosition).toBe(1);
    expect(room.currentPlayerSeatOffer).toEqual({ id: "offer-1", seatNumber: 2 });
    expect(room.waitlistRoster).toEqual([
      { position: 1, playerId: "guest-1", displayName: "guest_tester" },
      { position: 2, playerId: "guest-2", displayName: "second" },
    ]);
  });
});
