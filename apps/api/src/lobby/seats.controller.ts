import { Body, Controller, Headers, Post } from "@nestjs/common";
import type { ClaimSeatRequest, RoomCommandRequest, RoomResponse } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { requirePlayer } from "./auth.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class SeatsController {
  constructor(
    private readonly sessions: SessionStore,
    private readonly lobby: LobbyStore,
  ) {}

  @Post("/seats/claim")
  claimSeat(@Headers("cookie") cookieHeader: string | undefined, @Body() body: ClaimSeatRequest): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.claimSeat(player, body.roomId, body.seatNumber) };
  }

  @Post("/seats/leave")
  leaveSeat(@Headers("cookie") cookieHeader: string | undefined, @Body() body: RoomCommandRequest): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.leaveSeat(player, body.roomId) };
  }
}
