import { Body, Controller, Get, Headers, HttpCode, NotFoundException, Patch, Post, Res } from "@nestjs/common";
import {
  CURRENT_PLAYER_DISPLAY_NAME_PATH,
  CURRENT_PLAYER_PATH,
  PLAYERS_PATH,
  type CreateGuestSessionRequest,
  type CurrentPlayerResponse,
  type UpdateDisplayNameRequest,
} from "@cryptopoker/contracts";
import { createSessionCookie, readSessionCookie } from "./session-cookie.js";
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
    const player = this.sessions.findPlayerBySession(readSessionCookie(cookieHeader));
    if (!player) {
      throw new NotFoundException({ code: "PLAYER_SESSION_NOT_FOUND", message: "Create a guest session before fetching the current Player." });
    }

    return { player };
  }

  @Patch(CURRENT_PLAYER_DISPLAY_NAME_PATH)
  updateDisplayName(@Headers("cookie") cookieHeader: string | undefined, @Body() body: UpdateDisplayNameRequest): CurrentPlayerResponse {
    const player = this.sessions.updateDisplayName(readSessionCookie(cookieHeader), body.displayName);
    if (!player) {
      throw new NotFoundException({ code: "PLAYER_SESSION_NOT_FOUND", message: "Create a guest session before updating the Display Name." });
    }

    return { player };
  }
}
