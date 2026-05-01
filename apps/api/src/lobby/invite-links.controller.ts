import { Controller, Get, Headers, Param, Post } from "@nestjs/common";
import type { RoomResponse } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { requirePlayer } from "./auth.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class InviteLinksController {
  constructor(
    private readonly sessions: SessionStore,
    private readonly lobby: LobbyStore,
  ) {}

  @Get("/invite-links/:inviteCode")
  previewInvite(@Param("inviteCode") inviteCode: string): RoomResponse {
    return { room: this.lobby.previewInvite(inviteCode) };
  }

  @Post("/invite-links/:inviteCode/join")
  joinInvite(@Headers("cookie") cookieHeader: string | undefined, @Param("inviteCode") inviteCode: string): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.joinInvite(player, inviteCode) };
  }
}
