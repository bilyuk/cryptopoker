import { Body, Controller, Delete, Get, Headers, HttpCode, Inject, Patch, Post, Res } from "@nestjs/common";
import type {
  CreateGuestSessionRequest,
  CurrentPlayerResponse,
  UpdateDisplayNameRequest,
} from "@cryptopoker/contracts";
import { clearSessionCookie, createSessionCookie, readSessionCookie } from "./session-cookie.js";
import { currentPlayerFromCookie } from "./current-player.js";
import { SessionStore } from "./session.store.js";

type HeaderResponse = {
  setHeader(name: string, value: string): void;
};

@Controller()
export class PlayersController {
  constructor(@Inject(SessionStore) private readonly sessions: SessionStore) {}

  @Post("/players")
  @HttpCode(201)
  createGuestSession(@Body() body: CreateGuestSessionRequest, @Res({ passthrough: true }) response: HeaderResponse): CurrentPlayerResponse {
    const session = this.sessions.createGuestSession(body.displayName);
    response.setHeader("Set-Cookie", createSessionCookie(session.sessionId));
    return { player: session.player };
  }

  @Get("/players/current")
  currentPlayer(@Headers("cookie") cookieHeader: string | undefined): CurrentPlayerResponse {
    return { player: currentPlayerFromCookie(this.sessions, cookieHeader).require("Create a guest session before fetching the current Player.") };
  }

  @Patch("/players/current/display-name")
  updateDisplayName(@Headers("cookie") cookieHeader: string | undefined, @Body() body: UpdateDisplayNameRequest): CurrentPlayerResponse {
    return { player: currentPlayerFromCookie(this.sessions, cookieHeader).updateDisplayName(body.displayName) };
  }

  @Delete("/players/current/session")
  @HttpCode(204)
  deleteCurrentSession(@Headers("cookie") cookieHeader: string | undefined, @Res({ passthrough: true }) response: HeaderResponse): void {
    this.sessions.deleteSession(readSessionCookie(cookieHeader));
    response.setHeader("Set-Cookie", clearSessionCookie());
  }
}
