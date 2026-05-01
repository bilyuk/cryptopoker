import { Controller, Get, Headers, Inject, Param, Post } from "@nestjs/common";
import {
  inviteLinkJoinPath,
  inviteLinkPath,
  type RoomResponse,
} from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { currentPlayerFromCookie } from "../sessions/current-player.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class InviteLinksController {
  constructor(
    @Inject(SessionStore)
    private readonly sessions: SessionStore,
    @Inject(LobbyStore)
    private readonly lobby: LobbyStore,
  ) {}

  @Get(inviteLinkPath(":inviteCode"))
  previewInvite(@Param("inviteCode") inviteCode: string): RoomResponse {
    return { room: this.lobby.previewInvite(inviteCode) };
  }

  @Post(inviteLinkJoinPath(":inviteCode"))
  joinInvite(@Headers("cookie") cookieHeader: string | undefined, @Param("inviteCode") inviteCode: string): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.joinInvite(player, inviteCode) };
  }
}
