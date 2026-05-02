import { Body, Controller, Headers, Inject, Param, Post } from "@nestjs/common";
import type {
  BuyInResponse,
  EscrowDepositEventRequest,
  EscrowRefundEventRequest,
  RequestBuyInRequest,
} from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { currentPlayerFromCookie } from "../sessions/current-player.js";
import { LobbyStore } from "./lobby.store.js";

@Controller()
export class BuyInsController {
  constructor(
    @Inject(SessionStore)
    private readonly sessions: SessionStore,
    @Inject(LobbyStore)
    private readonly lobby: LobbyStore,
  ) {}

  @Post("/buy-ins")
  requestBuyIn(@Headers("cookie") cookieHeader: string | undefined, @Body() body: RequestBuyInRequest): BuyInResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { buyIn: this.lobby.requestBuyIn(player, body.roomId, body.amount) };
  }

  @Post("/buy-ins/:buyInId/expire")
  expireBuyIn(@Headers("cookie") cookieHeader: string | undefined, @Param("buyInId") buyInId: string): BuyInResponse {
    currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { buyIn: this.lobby.markBuyInExpired(buyInId) };
  }

  @Post("/buy-ins/:buyInId/refund")
  requestRefund(@Headers("cookie") cookieHeader: string | undefined, @Param("buyInId") buyInId: string): BuyInResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { buyIn: this.lobby.requestPrePlayRefund(player, buyInId) };
  }

  @Post("/escrow/events/deposits")
  confirmEscrowDeposit(@Body() body: EscrowDepositEventRequest): BuyInResponse {
    return { buyIn: this.lobby.confirmEscrowDeposit(body.eventId, body.fundingReference, body.txHash) };
  }

  @Post("/escrow/events/refunds")
  confirmEscrowRefund(@Body() body: EscrowRefundEventRequest): BuyInResponse {
    return { buyIn: this.lobby.confirmEscrowRefund(body.eventId, body.buyInId, body.txHash) };
  }
}
