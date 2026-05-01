import { Body, Controller, Headers, Inject, Post } from "@nestjs/common";
import type { ClaimSeatRequest, RoomCommandRequest, RoomResponse } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { currentPlayerFromCookie } from "../sessions/current-player.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class SeatsController {
  constructor(
    @Inject(SessionStore)
    private readonly sessions: SessionStore,
    @Inject(LobbyStore)
    private readonly lobby: LobbyStore,
  ) {}

  @Post("/seats/claim")
  claimSeat(@Headers("cookie") cookieHeader: string | undefined, @Body() body: ClaimSeatRequest): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.claimSeat(player, body.roomId, body.seatNumber) };
  }

  @Post("/seats/leave")
  leaveSeat(@Headers("cookie") cookieHeader: string | undefined, @Body() body: RoomCommandRequest): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.leaveSeat(player, body.roomId) };
  }
}
