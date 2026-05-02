import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { PlayerDto } from "@cryptopoker/contracts";

type SessionRecord = {
  id: string;
  playerId: string;
};

type PlayerForgottenListener = (playerId: string) => void;

@Injectable()
export class SessionStore {
  private readonly players = new Map<string, PlayerDto>();
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly playerForgottenListeners = new Set<PlayerForgottenListener>();

  onPlayerForgotten(listener: PlayerForgottenListener): void {
    this.playerForgottenListeners.add(listener);
  }

  createGuestSession(displayName: string): { sessionId: string; player: PlayerDto } {
    const player: PlayerDto = {
      id: randomUUID(),
      displayName: normalizeDisplayName(displayName),
      walletAddress: null,
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

  linkWallet(sessionId: string | undefined, walletAddress: string): PlayerDto | undefined {
    const player = this.findPlayerBySession(sessionId);
    if (!player) return undefined;

    const updated = { ...player, walletAddress };
    this.players.set(updated.id, updated);
    return updated;
  }

  deleteSession(sessionId: string | undefined): void {
    if (!sessionId) return;
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.sessions.delete(sessionId);
    this.players.delete(session.playerId);
    for (const listener of this.playerForgottenListeners) {
      listener(session.playerId);
    }
  }
}

function normalizeDisplayName(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed.length > 0 ? trimmed : "Player";
}
