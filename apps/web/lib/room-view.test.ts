import { describe, expect, it } from "vitest";
import type { RoomDto } from "@cryptopoker/contracts";
import { toUiRoom } from "./room-view";

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
    const room = toUiRoom(emptyRoom);

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
});
