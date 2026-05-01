import { Body, Controller, Get, Headers, HttpCode, Patch, Post, Res } from "@nestjs/common";
import {
  CURRENT_PLAYER_DISPLAY_NAME_PATH,
  CURRENT_PLAYER_PATH,
  PLAYERS_PATH,
  type CreateGuestSessionRequest,
  type CurrentPlayerResponse,
  type UpdateDisplayNameRequest,
} from "@cryptopoker/contracts";
import { createSessionCookie } from "./session-cookie.js";
import { currentPlayerFromCookie } from "./current-player.js";
import { SessionStore } from "./session.store.js";

type HeaderResponse = {
  setHeader(name: string, value: string): void;
};

@Controller()
export class PlayersController {
  constructor(private readonly sessions: SessionStore) {}

  @Post(PLAYERS_PATH)
  @HttpCode(201)
  createGuestSession(@Body() body: CreateGuestSessionRequest, @Res({ passthrough: true }) response: HeaderResponse): CurrentPlayerResponse {
    const session = this.sessions.createGuestSession(body.displayName);
    response.setHeader("Set-Cookie", createSessionCookie(session.sessionId));
    return { player: session.player };
  }

  @Get(CURRENT_PLAYER_PATH)
  currentPlayer(@Headers("cookie") cookieHeader: string | undefined): CurrentPlayerResponse {
    return { player: currentPlayerFromCookie(this.sessions, cookieHeader).require("Create a guest session before fetching the current Player.") };
  }

  @Patch(CURRENT_PLAYER_DISPLAY_NAME_PATH)
  updateDisplayName(@Headers("cookie") cookieHeader: string | undefined, @Body() body: UpdateDisplayNameRequest): CurrentPlayerResponse {
    return { player: currentPlayerFromCookie(this.sessions, cookieHeader).updateDisplayName(body.displayName) };
  }
}
