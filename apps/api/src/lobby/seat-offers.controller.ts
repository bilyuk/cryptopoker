import { Controller, Headers, Inject, Param, Post } from "@nestjs/common";
import type { RoomResponse, SeatOfferResponse } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { currentPlayerFromCookie } from "../sessions/current-player.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class SeatOffersController {
  constructor(
    @Inject(SessionStore)
    private readonly sessions: SessionStore,
    @Inject(LobbyStore)
    private readonly lobby: LobbyStore,
  ) {}

  @Post("/seat-offers/:seatOfferId/accept")
  acceptSeatOffer(@Headers("cookie") cookieHeader: string | undefined, @Param("seatOfferId") seatOfferId: string): RoomResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { room: this.lobby.acceptSeatOffer(player, seatOfferId) };
  }

  @Post("/seat-offers/:seatOfferId/decline")
  declineSeatOffer(@Headers("cookie") cookieHeader: string | undefined, @Param("seatOfferId") seatOfferId: string): SeatOfferResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { seatOffer: this.lobby.declineSeatOffer(player, seatOfferId) };
  }

  @Post("/seat-offers/:seatOfferId/expire")
  expireSeatOffer(@Param("seatOfferId") seatOfferId: string): SeatOfferResponse {
    return { seatOffer: this.lobby.expireSeatOffer(seatOfferId) };
  }
}
