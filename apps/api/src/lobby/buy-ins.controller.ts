import { Body, Controller, Headers, Inject, Param, Post } from "@nestjs/common";
import {
  BUY_INS_PATH,
  buyInApprovePath,
  buyInRejectPath,
  type BuyInResponse,
  type RequestBuyInRequest,
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

  @Post(BUY_INS_PATH)
  requestBuyIn(@Headers("cookie") cookieHeader: string | undefined, @Body() body: RequestBuyInRequest): BuyInResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { buyIn: this.lobby.requestBuyIn(player, body.roomId, body.amount) };
  }

  @Post(buyInApprovePath(":buyInId"))
  approveBuyIn(@Headers("cookie") cookieHeader: string | undefined, @Param("buyInId") buyInId: string): BuyInResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { buyIn: this.lobby.approveBuyIn(player, buyInId) };
  }

  @Post(buyInRejectPath(":buyInId"))
  rejectBuyIn(@Headers("cookie") cookieHeader: string | undefined, @Param("buyInId") buyInId: string): BuyInResponse {
    const player = currentPlayerFromCookie(this.sessions, cookieHeader).require();
    return { buyIn: this.lobby.rejectBuyIn(player, buyInId) };
  }
}
