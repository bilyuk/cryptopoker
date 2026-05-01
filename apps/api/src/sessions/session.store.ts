import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { PlayerDto } from "@cryptopoker/contracts";

type SessionRecord = {
  id: string;
  playerId: string;
};

@Injectable()
export class SessionStore {
  private readonly players = new Map<string, PlayerDto>();
  private readonly sessions = new Map<string, SessionRecord>();

  createGuestSession(displayName: string): { sessionId: string; player: PlayerDto } {
    const player: PlayerDto = {
      id: randomUUID(),
      displayName: normalizeDisplayName(displayName),
    };
    const sessionId = randomUUID();

    this.players.set(player.id, player);
    this.sessions.set(sessionId, { id: sessionId, playerId: player.id });

    return { sessionId, player };
  }

  findPlayerBySession(sessionId: string | undefined): PlayerDto | undefined {
    if (!sessionId) return undefined;

    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    return this.players.get(session.playerId);
  }

  updateDisplayName(sessionId: string | undefined, displayName: string): PlayerDto | undefined {
    const player = this.findPlayerBySession(sessionId);
    if (!player) return undefined;

    const updated = { ...player, displayName: normalizeDisplayName(displayName) };
    this.players.set(updated.id, updated);
    return updated;
  }

  deleteSession(sessionId: string | undefined): void {
    if (!sessionId) return;
    this.sessions.delete(sessionId);
  }
}

function normalizeDisplayName(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed.length > 0 ? trimmed : "Player";
}
