import { Module } from "@nestjs/common";
import { SessionsModule } from "../sessions/sessions.module.js";
import { BuyInsController } from "./buy-ins.controller.js";
import { InviteLinksController } from "./invite-links.controller.js";
import { LobbyGateway } from "./lobby.gateway.js";
import { LobbyStore } from "./lobby.store.js";
import { RealtimeService } from "./realtime.service.js";
import { RoomsController } from "./rooms.controller.js";
import { SeatOffersController } from "./seat-offers.controller.js";
import { SeatsController } from "./seats.controller.js";
import { WaitlistController } from "./waitlist.controller.js";

@Module({
  imports: [SessionsModule],
  controllers: [RoomsController, InviteLinksController, BuyInsController, SeatsController, WaitlistController, SeatOffersController],
  providers: [LobbyStore, RealtimeService, LobbyGateway],
  exports: [LobbyStore],
})
export class LobbyModule {}
