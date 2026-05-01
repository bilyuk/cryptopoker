import { Body, Controller, Headers, Inject, Post } from "@nestjs/common";
import type { RoomCommandRequest, RoomResponse } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { currentPlayerFromCookie } from "../sessions/current-player.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class WaitlistController {
  constructor(
    @Inject(SessionStore)
    private readonly sessions: SessionStore,
    @Inject(LobbyStore)
    private readonly lobby: LobbyStore,
  ) {}

  @Post("/waitlist/join")
  joinWaitlist(@Headers("cookie") cookieHeader: string | undefined, @Body() body: RoomCommandRequest): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.joinWaitlist(player, body.roomId) };
  }

  @Post("/waitlist/leave")
  leaveWaitlist(@Headers("cookie") cookieHeader: string | undefined, @Body() body: RoomCommandRequest): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.leaveWaitlist(player, body.roomId) };
  }
}
