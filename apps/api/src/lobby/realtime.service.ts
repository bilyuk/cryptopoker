import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";
import { REALTIME_EVENTS } from "@cryptopoker/contracts";
import type { LobbyCommandEvent } from "./command-events.js";

@Injectable()
export class RealtimeService {
  private server: Server | undefined;

  attach(server: Server): void {
    this.server = server;
  }

  emit(event: LobbyCommandEvent): void {
    switch (event.type) {
      case "player.updated":
        this.server?.to(playerChannel(event.playerId)).emit(REALTIME_EVENTS.playerUpdated, { playerId: event.playerId });
        return;
      case "room.updated":
        this.server?.to(roomChannel(event.roomId)).emit(REALTIME_EVENTS.roomUpdated, { roomId: event.roomId });
        return;
      case "buyIn.updated":
        this.server?.to(roomChannel(event.roomId)).emit(REALTIME_EVENTS.buyInUpdated, { roomId: event.roomId, buyInId: event.buyInId });
        this.emitRoomUpdated(event.roomId);
        return;
      case "seat.updated":
        this.server?.to(roomChannel(event.roomId)).emit(REALTIME_EVENTS.seatUpdated, { roomId: event.roomId });
        this.emitRoomUpdated(event.roomId);
        return;
      case "waitlist.updated":
        this.server?.to(roomChannel(event.roomId)).emit(REALTIME_EVENTS.waitlistUpdated, { roomId: event.roomId });
        this.emitRoomUpdated(event.roomId);
        return;
      case "seatOffer.created":
        this.server?.to(playerChannel(event.playerId)).emit(REALTIME_EVENTS.seatOfferCreated, { roomId: event.roomId, playerId: event.playerId, seatOfferId: event.seatOfferId });
        this.emitRoomUpdated(event.roomId);
        return;
      case "seatOffer.updated":
        this.server?.to(playerChannel(event.playerId)).emit(REALTIME_EVENTS.seatOfferUpdated, { roomId: event.roomId, playerId: event.playerId, seatOfferId: event.seatOfferId });
        this.emitRoomUpdated(event.roomId);
        return;
    }
  }

  private emitRoomUpdated(roomId: string): void {
    this.server?.to(roomChannel(roomId)).emit(REALTIME_EVENTS.roomUpdated, { roomId });
  }
}

export function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

export function playerChannel(playerId: string): string {
  return `player:${playerId}`;
}
