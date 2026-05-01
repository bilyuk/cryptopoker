import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";
import { REALTIME_EVENTS } from "@cryptopoker/contracts";
import type { LobbyCommandEvent } from "./command-events.js";

export const ROOM_UPDATED_EVENT = REALTIME_EVENTS.roomUpdated;
export const BUY_IN_UPDATED_EVENT = REALTIME_EVENTS.buyInUpdated;
export const SEAT_UPDATED_EVENT = REALTIME_EVENTS.seatUpdated;
export const WAITLIST_UPDATED_EVENT = REALTIME_EVENTS.waitlistUpdated;
export const SEAT_OFFER_CREATED_EVENT = REALTIME_EVENTS.seatOfferCreated;
export const SEAT_OFFER_UPDATED_EVENT = REALTIME_EVENTS.seatOfferUpdated;
export const PLAYER_UPDATED_EVENT = REALTIME_EVENTS.playerUpdated;

@Injectable()
export class RealtimeService {
  private server: Server | undefined;

  attach(server: Server): void {
    this.server = server;
  }

  emit(event: LobbyCommandEvent): void {
    switch (event.type) {
      case "player.updated":
        this.emitPlayerUpdated(event.playerId);
        return;
      case "room.updated":
        this.emitRoomUpdated(event.roomId);
        return;
      case "buyIn.updated":
        this.emitBuyInUpdated(event.roomId, event.buyInId);
        return;
      case "seat.updated":
        this.emitSeatUpdated(event.roomId);
        return;
      case "waitlist.updated":
        this.emitWaitlistUpdated(event.roomId);
        return;
      case "seatOffer.created":
        this.emitSeatOfferCreated(event.roomId, event.playerId, event.seatOfferId);
        return;
      case "seatOffer.updated":
        this.emitSeatOfferUpdated(event.roomId, event.playerId, event.seatOfferId);
        return;
    }
  }

  emitRoomUpdated(roomId: string): void {
    this.server?.to(roomChannel(roomId)).emit(ROOM_UPDATED_EVENT, { roomId });
  }

  emitBuyInUpdated(roomId: string, buyInId: string): void {
    this.server?.to(roomChannel(roomId)).emit(BUY_IN_UPDATED_EVENT, { roomId, buyInId });
    this.emitRoomUpdated(roomId);
  }

  emitSeatUpdated(roomId: string): void {
    this.server?.to(roomChannel(roomId)).emit(SEAT_UPDATED_EVENT, { roomId });
    this.emitRoomUpdated(roomId);
  }

  emitWaitlistUpdated(roomId: string): void {
    this.server?.to(roomChannel(roomId)).emit(WAITLIST_UPDATED_EVENT, { roomId });
    this.emitRoomUpdated(roomId);
  }

  emitSeatOfferCreated(roomId: string, playerId: string, seatOfferId: string): void {
    this.server?.to(playerChannel(playerId)).emit(SEAT_OFFER_CREATED_EVENT, { roomId, playerId, seatOfferId });
    this.emitRoomUpdated(roomId);
  }

  emitSeatOfferUpdated(roomId: string, playerId: string, seatOfferId: string): void {
    this.server?.to(playerChannel(playerId)).emit(SEAT_OFFER_UPDATED_EVENT, { roomId, playerId, seatOfferId });
    this.emitRoomUpdated(roomId);
  }

  emitPlayerUpdated(playerId: string): void {
    this.server?.to(playerChannel(playerId)).emit(PLAYER_UPDATED_EVENT, { playerId });
  }
}

export function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

export function playerChannel(playerId: string): string {
  return `player:${playerId}`;
}
