import { describe, expect, it } from "vitest";
import type { RoomDto } from "@cryptopoker/contracts";
import { toUiRoomForPlayer } from "./room-view";

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
  it("renders server-backed empty Seat state without placeholder players", () => {
    const room = toUiRoomForPlayer(emptyRoom);

    expect(room.seats).toBe("0/6");
    expect(room.occupiedSeats).toBe(0);
    expect(room.seatCount).toBe(6);
    expect(room.seatLabels).toEqual([
      { label: "Seat 1 - waiting...", stack: null },
      { label: "Seat 2 - waiting...", stack: null },
      { label: "Seat 3 - waiting...", stack: null },
      { label: "Seat 4 - waiting...", stack: null },
      { label: "Seat 5 - waiting...", stack: null },
      { label: "Seat 6 - waiting...", stack: null },
    ]);
  });

  it("keeps joined unseated Players visible separately from occupied Seats", () => {
    const room = toUiRoomForPlayer({
      ...emptyRoom,
      players: [
        { playerId: "host-1", displayName: "codex_tester", role: "host" },
        { playerId: "guest-1", displayName: "guest_tester", role: "player" },
      ],
      buyIns: [
        {
          id: "buy-in-1",
          roomId: "room-1",
          playerId: "guest-1",
          amount: 40,
          status: "pending",
        },
      ],
    });

    expect(room.seats).toBe("0/6");
    expect(room.players).toEqual([
      {
        playerId: "host-1",
        displayName: "codex_tester",
        role: "host",
        seated: false,
        stack: null,
        buyInStatus: "none",
        buyInId: undefined,
      },
      {
        playerId: "guest-1",
        displayName: "guest_tester",
        role: "player",
        seated: false,
        stack: null,
        buyInStatus: "pending",
        buyInId: "buy-in-1",
      },
    ]);
    expect(room.pendingBuyIns).toEqual([
      {
        id: "buy-in-1",
        playerId: "guest-1",
        displayName: "guest_tester",
        amount: "$40.00",
      },
    ]);
  });

  it("exposes the current Player's Waitlist position and targeted Seat Offer", () => {
    const room = toUiRoomForPlayer(
      {
        ...emptyRoom,
        players: [
          { playerId: "host-1", displayName: "codex_tester", role: "host" },
          { playerId: "guest-1", displayName: "guest_tester", role: "player" },
        ],
        waitlist: [{ playerId: "guest-1", position: 1 }],
        seatOffers: [
          {
            id: "offer-1",
            roomId: "room-1",
            playerId: "guest-1",
            seatNumber: 2,
            status: "pending",
          },
          {
            id: "offer-2",
            roomId: "room-1",
            playerId: "host-1",
            seatNumber: 3,
            status: "pending",
          },
        ],
      },
      "guest-1",
    );

    expect(room.currentPlayerWaitlistPosition).toBe(1);
    expect(room.currentPlayerSeatOffer).toEqual({ id: "offer-1", seatNumber: 2 });
  });
});
