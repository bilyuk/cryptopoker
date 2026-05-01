import { Controller, Headers, Param, Post } from "@nestjs/common";
import type { RoomResponse, SeatOfferResponse } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { requirePlayer } from "./auth.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class SeatOffersController {
  constructor(
    private readonly sessions: SessionStore,
    private readonly lobby: LobbyStore,
  ) {}

  @Post("/seat-offers/:seatOfferId/accept")
  acceptSeatOffer(@Headers("cookie") cookieHeader: string | undefined, @Param("seatOfferId") seatOfferId: string): RoomResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { room: this.lobby.acceptSeatOffer(player, seatOfferId) };
  }

  @Post("/seat-offers/:seatOfferId/decline")
  declineSeatOffer(@Headers("cookie") cookieHeader: string | undefined, @Param("seatOfferId") seatOfferId: string): SeatOfferResponse {
    const player = requirePlayer(this.sessions, cookieHeader);
    return { seatOffer: this.lobby.declineSeatOffer(player, seatOfferId) };
  }

  @Post("/seat-offers/:seatOfferId/expire")
  expireSeatOffer(@Param("seatOfferId") seatOfferId: string): SeatOfferResponse {
    return { seatOffer: this.lobby.expireSeatOffer(seatOfferId) };
  }
}
