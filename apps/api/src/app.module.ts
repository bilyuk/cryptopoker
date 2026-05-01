import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module.js";
import { HealthController } from "./health.controller.js";
import { LobbyModule } from "./lobby/lobby.module.js";
import { SessionsModule } from "./sessions/sessions.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", "../../.env"],
      isGlobal: true,
    }),
    DatabaseModule,
    SessionsModule,
    LobbyModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
