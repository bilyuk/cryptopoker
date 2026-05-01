import { Body, Controller, Headers, Post } from "@nestjs/common";
import type { RoomCommandRequest, RoomResponse } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { requirePlayer } from "./auth.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class WaitlistController {
  constructor(
    private readonly sessions: SessionStore,
    private readonly lobby: LobbyStore,
  ) {}

  @Post("/waitlist/join")
  joinWaitlist(@Headers("cookie") cookieHeader: string | undefined, @Body() body: RoomCommandRequest): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.joinWaitlist(player, body.roomId) };
  }

  @Post("/waitlist/leave")
  leaveWaitlist(@Headers("cookie") cookieHeader: string | undefined, @Body() body: RoomCommandRequest): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.leaveWaitlist(player, body.roomId) };
  }
}
