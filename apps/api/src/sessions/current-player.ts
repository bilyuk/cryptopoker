import { NotFoundException } from "@nestjs/common";
import type { PlayerDto } from "@cryptopoker/contracts";
import { readSessionCookie } from "./session-cookie.js";
import { SessionStore } from "./session.store.js";

export class CurrentPlayer {
  constructor(
    private readonly sessions: SessionStore,
    private readonly cookieHeader: string | undefined,
  ) {}

  require(message = "Create a guest session before using this command."): PlayerDto {
    const player = this.sessions.findPlayerBySession(readSessionCookie(this.cookieHeader));
    if (!player) {
      throw new NotFoundException({ code: "PLAYER_SESSION_NOT_FOUND", message });
    }
    return player;
  }

  updateDisplayName(displayName: string): PlayerDto {
    const player = this.sessions.updateDisplayName(readSessionCookie(this.cookieHeader), displayName);
    if (!player) {
      throw new NotFoundException({ code: "PLAYER_SESSION_NOT_FOUND", message: "Create a guest session before updating the Display Name." });
    }
    return player;
  }

  linkWallet(walletAddress: string): PlayerDto {
    const player = this.sessions.linkWallet(readSessionCookie(this.cookieHeader), walletAddress);
    if (!player) {
      throw new NotFoundException({ code: "PLAYER_SESSION_NOT_FOUND", message: "Create a guest session before linking a wallet." });
    }
    return player;
  }
}

export function currentPlayerFromCookie(sessions: SessionStore, cookieHeader: string | undefined): CurrentPlayer {
  return new CurrentPlayer(sessions, cookieHeader);
}
