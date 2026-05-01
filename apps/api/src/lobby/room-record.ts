import { randomBytes } from "node:crypto";
import { BadRequestException } from "@nestjs/common";
import type { RoomDto, RoomSettingsDto } from "@cryptopoker/contracts";

export type RoomRecord = RoomDto & {
  joinedPlayerIds: Set<string>;
};

export function normalizeRoomSettings(settings: RoomSettingsDto): RoomSettingsDto {
  if (!settings.name?.trim()) throw new BadRequestException({ code: "ROOM_NAME_REQUIRED", message: "Room name is required." });
  if (settings.smallBlind <= 0 || settings.bigBlind <= settings.smallBlind) {
    throw new BadRequestException({ code: "INVALID_BLINDS", message: "Big blind must be larger than the small blind." });
  }
  if (settings.buyInMin <= 0 || settings.buyInMax < settings.buyInMin) {
    throw new BadRequestException({ code: "INVALID_BUY_IN_RANGE", message: "Buy-In range is invalid." });
  }
  if (settings.seatCount < 2 || settings.seatCount > 10) {
    throw new BadRequestException({ code: "INVALID_SEAT_COUNT", message: "Seat count must be between 2 and 10." });
  }
  if (settings.actionTimerSeconds < 10) {
    throw new BadRequestException({ code: "INVALID_ACTION_TIMER", message: "Action timer must be at least 10 seconds." });
  }

  return {
    ...settings,
    name: settings.name.trim(),
  };
}

export function createInviteCode(): string {
  return randomBytes(24).toString("base64url");
}

export function toRoomDto(room: RoomRecord): RoomDto {
  return {
    id: room.id,
    hostPlayerId: room.hostPlayerId,
    tableId: room.tableId,
    inviteCode: room.inviteCode,
    settings: { ...room.settings },
    hasStarted: room.hasStarted,
    players: room.players.map((player) => ({ ...player })),
    buyIns: room.buyIns.map((buyIn) => ({ ...buyIn })),
    seats: room.seats.map((seat) => ({ ...seat })),
    waitlist: room.waitlist.map((entry) => ({ ...entry })),
    seatOffers: room.seatOffers.map((offer) => ({ ...offer })),
  };
}
