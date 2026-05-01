import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { LobbyModule } from "./lobby/lobby.module.js";
import { SessionsModule } from "./sessions/sessions.module.js";

@Module({
  imports: [SessionsModule, LobbyModule],
  controllers: [HealthController],
})
export class AppModule {}
