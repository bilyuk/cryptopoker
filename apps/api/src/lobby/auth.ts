import { NotFoundException } from "@nestjs/common";
import { readSessionCookie } from "../sessions/session-cookie.js";
import { SessionStore } from "../sessions/session.store.js";

export function requirePlayer(sessions: SessionStore, cookieHeader: string | undefined) {
  const player = sessions.findPlayerBySession(readSessionCookie(cookieHeader));
  if (!player) {
    throw new NotFoundException({ code: "PLAYER_SESSION_NOT_FOUND", message: "Create a guest session before using Room commands." });
  }
  return player;
}
