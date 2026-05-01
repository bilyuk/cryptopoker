import { Module } from "@nestjs/common";
import { PlayersController } from "./players.controller.js";
import { SessionStore } from "./session.store.js";

@Module({
  controllers: [PlayersController],
  providers: [SessionStore],
  exports: [SessionStore],
})
export class SessionsModule {}
